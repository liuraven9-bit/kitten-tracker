// 云端数据存储：对外暴露与旧本地 store 相同的接口，
// 让各页面几乎不用改就能从本地切换到云端。
// 内部维护一份内存快照（供 useSyncExternalStore 稳定读取），
// 首次加载从 Supabase 拉取，之后通过 Realtime 保持同步。

import { supabase } from './supabaseClient'
import {
  foodFromDb, foodToDb, logFromDb, logToDb, catFromDb, settingsToCatDb,
} from './mappers'

let CAT_ID = null

// 内存快照（引用稳定，写入时才替换）
let snapshot = {
  loading: true,
  online: true,
  settings: {
    kittenName: '', birthDate: '', currentWeightKg: 0,
    targetDailyKcal: 200, targetDailyWaterMl: 150,
    lowIntakeWarningPercent: 70, normalIntakePercent: 90,
  },
  foods: [],
  logs: [],
}

const listeners = new Set()
function emit() {
  snapshot = { ...snapshot } // 换引用，触发 React 更新
  listeners.forEach((fn) => fn())
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
export function getData() { return snapshot }

export const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10)

// ---------------- 初始化：绑定某只猫，拉数据 + 订阅 ----------------
let channel = null

export async function initCat(catId) {
  CAT_ID = catId
  snapshot.loading = true
  emit()
  await reloadAll()
  subscribeRealtime()
}

async function reloadAll() {
  try {
    const [catRes, foodRes, logRes] = await Promise.all([
      supabase.from('cats').select('*').eq('cat_id', CAT_ID).single(),
      supabase.from('food_cards').select('*').eq('cat_id', CAT_ID).is('deleted_at', null),
      supabase.from('logs').select('*').eq('cat_id', CAT_ID).is('deleted_at', null)
        .order('timestamp', { ascending: false }),
    ])
    if (catRes.data) snapshot.settings = catFromDb(catRes.data)
    snapshot.foods = (foodRes.data || []).map(foodFromDb)
    snapshot.logs = (logRes.data || []).map(logFromDb)
    snapshot.online = true
  } catch (e) {
    console.error('加载云端数据失败：', e)
    snapshot.online = false
  } finally {
    snapshot.loading = false
    emit()
  }
}

function subscribeRealtime() {
  if (channel) supabase.removeChannel(channel)
  channel = supabase
    .channel('cat-' + CAT_ID)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'food_cards', filter: `cat_id=eq.${CAT_ID}` },
      () => reloadFoods())
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'logs', filter: `cat_id=eq.${CAT_ID}` },
      () => reloadLogs())
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'cats', filter: `cat_id=eq.${CAT_ID}` },
      (payload) => { if (payload.new) { snapshot.settings = catFromDb(payload.new); emit() } })
    .subscribe()
}

async function reloadFoods() {
  const { data } = await supabase.from('food_cards').select('*')
    .eq('cat_id', CAT_ID).is('deleted_at', null)
  snapshot.foods = (data || []).map(foodFromDb)
  emit()
}
async function reloadLogs() {
  const { data } = await supabase.from('logs').select('*')
    .eq('cat_id', CAT_ID).is('deleted_at', null)
    .order('timestamp', { ascending: false })
  snapshot.logs = (data || []).map(logFromDb)
  emit()
}

// ---------------- Settings ----------------
export function getSettings() { return snapshot.settings }

export async function updateSettings(patch) {
  // 乐观更新
  snapshot.settings = { ...snapshot.settings, ...patch }
  emit()
  const dbPatch = settingsToCatDb(patch)
  const { error } = await supabase.from('cats').update(dbPatch).eq('cat_id', CAT_ID)
  if (error) console.error('更新设置失败：', error)
}

// ---------------- Foods ----------------
export function getFoods() { return snapshot.foods }
export function getFood(id) { return snapshot.foods.find((f) => f.id === id) || null }

export async function upsertFood(food) {
  const row = foodToDb({ ...food, id: food.id || uid() }, CAT_ID)
  // 乐观更新
  const local = foodFromDb(row)
  const idx = snapshot.foods.findIndex((f) => f.id === local.id)
  if (idx >= 0) snapshot.foods[idx] = { ...snapshot.foods[idx], ...local }
  else snapshot.foods = [local, ...snapshot.foods]
  emit()
  const { error } = await supabase.from('food_cards').upsert(row)
  if (error) { console.error('保存食物卡失败：', error); await reloadFoods() }
  return snapshot.foods
}

export async function deleteFood(id) {
  snapshot.foods = snapshot.foods.filter((f) => f.id !== id)
  emit()
  // 软删除
  const { error } = await supabase.from('food_cards')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) { console.error('删除食物卡失败：', error); await reloadFoods() }
}

// ---------------- Logs ----------------
export function getLogs() { return snapshot.logs }

export async function addLog(log) {
  const entry = { ...log, id: log.id || uid(), timestamp: log.timestamp || new Date().toISOString() }
  const row = logToDb(entry, CAT_ID)
  const local = logFromDb(row)
  snapshot.logs = [local, ...snapshot.logs]
  emit()
  const { error } = await supabase.from('logs').insert(row)
  if (error) { console.error('添加记录失败：', error); await reloadLogs() }
  return local
}

export async function updateLog(id, patch) {
  const idx = snapshot.logs.findIndex((l) => l.id === id)
  if (idx >= 0) { snapshot.logs[idx] = { ...snapshot.logs[idx], ...patch }; emit() }
  const dbPatch = {}
  if (patch.note !== undefined) dbPatch.note = patch.note
  if (patch.amount !== undefined) dbPatch.amount = patch.amount
  dbPatch.updated_at = new Date().toISOString()
  const { error } = await supabase.from('logs').update(dbPatch).eq('id', id)
  if (error) { console.error('更新记录失败：', error); await reloadLogs() }
}

export async function deleteLog(id) {
  snapshot.logs = snapshot.logs.filter((l) => l.id !== id)
  emit()
  const { error } = await supabase.from('logs')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) { console.error('删除记录失败：', error); await reloadLogs() }
}

// ---------------- 创建 / 加入猫咪 ----------------
// 创建：在 cats 表插入一行（若已存在则报错给上层）
export async function createCat(catId, name) {
  const { data, error } = await supabase.from('cats')
    .insert({ cat_id: catId, name: name || '' }).select().single()
  if (error) throw error
  return data
}

// 检查某个 cat_id 是否存在（加入时用）
export async function catExists(catId) {
  const { data, error } = await supabase.from('cats')
    .select('cat_id').eq('cat_id', catId).maybeSingle()
  if (error) throw error
  return !!data
}

// 迁移：把本地旧数据批量写入云端
export async function migrateLocalData({ settings, foods, logs }) {
  if (settings) {
    await supabase.from('cats').update(settingsToCatDb(settings)).eq('cat_id', CAT_ID)
  }
  if (foods?.length) {
    const rows = foods.map((f) => foodToDb({ ...f, id: f.id || uid() }, CAT_ID))
    await supabase.from('food_cards').upsert(rows)
  }
  if (logs?.length) {
    const rows = logs.map((l) => logToDb({ ...l, id: l.id || uid() }, CAT_ID))
    await supabase.from('logs').insert(rows)
  }
  await reloadAll()
}
