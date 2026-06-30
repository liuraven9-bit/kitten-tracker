// Local-only data store backed by localStorage.
// Everything lives under a single namespaced key so export/import is trivial.
// 兼容旧浏览器:structuredClone 不存在时用 JSON 深拷贝兜底
const clone = (obj) =>
  typeof structuredClone === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj))

const KEY = 'kitten-tracker:v1'

const DEFAULT_SETTINGS = {
  kittenName: 'Kitten',
  birthDate: '',
  currentWeightKg: 0,
  targetDailyKcal: 200,
  targetDailyWaterMl: 150,
  lowIntakeWarningPercent: 70,
  normalIntakePercent: 90,
}

const DEFAULT_DATA = {
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  foods: [],
  logs: [],
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return clone(DEFAULT_DATA)
    const parsed = JSON.parse(raw)
    return {
      ...clone(DEFAULT_DATA),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      foods: parsed.foods || [],
      logs: parsed.logs || [],
    }
  } catch (e) {
    console.error('Failed to read store, resetting view (data not erased):', e)
    return clone(DEFAULT_DATA)
  }
}

const listeners = new Set()

// 缓存快照：useSyncExternalStore 要求 getSnapshot 返回稳定引用，
// 只有写入时才刷新这个引用，否则会无限重渲染。
let snapshot = null

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  snapshot = data
  listeners.forEach((fn) => fn())
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getData() {
  if (snapshot === null) {
    snapshot = read()
  }
  return snapshot
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// ---- Settings ----
export function getSettings() {
  return read().settings
}
export function updateSettings(patch) {
  const data = read()
  data.settings = { ...data.settings, ...patch }
  write(data)
}

// ---- Foods ----
export function getFoods() {
  return read().foods
}
export function getFood(id) {
  return read().foods.find((f) => f.id === id) || null
}
export function upsertFood(food) {
  const data = read()
  const now = new Date().toISOString()
  const idx = data.foods.findIndex((f) => f.id === food.id)
  if (idx >= 0) {
    data.foods[idx] = { ...data.foods[idx], ...food, updatedAt: now }
  } else {
    data.foods.push({
      id: food.id || uid(),
      createdAt: now,
      updatedAt: now,
      ...food,
    })
  }
  write(data)
  return data.foods
}
export function deleteFood(id) {
  const data = read()
  data.foods = data.foods.filter((f) => f.id !== id)
  write(data)
}

// ---- Logs ----
export function getLogs() {
  return read().logs
}
export function addLog(log) {
  const data = read()
  const entry = {
    id: log.id || uid(),
    timestamp: log.timestamp || new Date().toISOString(),
    type: log.type,
    amount: log.amount ?? null,
    unit: log.unit ?? null,
    foodId: log.foodId ?? null,
    remainingAmount: log.remainingAmount ?? null,
    calculatedIntake: log.calculatedIntake ?? null,
    calculatedKcal: log.calculatedKcal ?? null,
    calculatedProtein: log.calculatedProtein ?? null,
    note: log.note ?? '',
  }
  data.logs.push(entry)
  write(data)
  return entry
}
export function updateLog(id, patch) {
  const data = read()
  const idx = data.logs.findIndex((l) => l.id === id)
  if (idx >= 0) {
    data.logs[idx] = { ...data.logs[idx], ...patch }
    write(data)
  }
}
export function deleteLog(id) {
  const data = read()
  data.logs = data.logs.filter((l) => l.id !== id)
  write(data)
}

// ---- Bulk import / replace ----
export function replaceAll(newData) {
  const merged = {
    ...clone(DEFAULT_DATA),
    ...newData,
    settings: { ...DEFAULT_SETTINGS, ...(newData.settings || {}) },
    foods: newData.foods || [],
    logs: newData.logs || [],
  }
  write(merged)
}
