import { useState } from 'react'
import { makeCatId, saveCatId } from '../lib/catId'
import { createCat, catExists } from '../lib/store'
import { isSupabaseReady } from '../lib/supabaseClient'

// 首次进入：创建新猫咪，或用他人分享的 ID 加入。
// onReady(catId) 把选定的猫咪交给上层。
export default function CatGate({ onReady, hasLocalData }) {
  const [tab, setTab] = useState('create') // create | join
  const [prefix, setPrefix] = useState('')
  const [joinId, setJoinId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleCreate() {
    setBusy(true); setMsg('')
    try {
      const id = makeCatId(prefix || 'cat')
      await createCat(id, prefix)
      saveCatId(id)
      onReady(id)
    } catch (e) {
      setMsg('创建失败：' + (e.message || e))
    } finally { setBusy(false) }
  }

  async function handleJoin() {
    setBusy(true); setMsg('')
    const id = joinId.trim()
    if (!id) { setMsg('请输入猫咪 ID。'); setBusy(false); return }
    try {
      const ok = await catExists(id)
      if (!ok) { setMsg('找不到这个猫咪 ID，请检查是否输入正确。'); setBusy(false); return }
      saveCatId(id)
      onReady(id)
    } catch (e) {
      setMsg('加入失败：' + (e.message || e))
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-moss text-3xl">🐱</div>
        <h1 className="font-display text-3xl font-semibold">猫咪追踪器</h1>
        <p className="mt-1 text-sm text-ink/50">创建一只猫咪，或加入共同养育</p>
      </div>

      {!isSupabaseReady && (
        <div className="card mb-4 bg-danger/10 p-3 text-sm text-danger">
          尚未配置云端连接，请检查 <code>.env.local</code>。
        </div>
      )}

      <div className="card space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-sand p-1">
          <button className={`btn py-2 text-sm ${tab === 'create' ? 'bg-white text-ink' : 'bg-transparent text-ink/50'}`}
            onClick={() => setTab('create')}>创建猫咪</button>
          <button className={`btn py-2 text-sm ${tab === 'join' ? 'bg-white text-ink' : 'bg-transparent text-ink/50'}`}
            onClick={() => setTab('join')}>加入猫咪</button>
        </div>

        {tab === 'create' ? (
          <>
            <label className="block">
              <span className="label">给猫咪起个好记的名字（用于生成 ID）</span>
              <input className="field" value={prefix} onChange={(e) => setPrefix(e.target.value)}
                placeholder="例如 mimi" />
            </label>
            <p className="text-xs text-ink/50">
              系统会生成一个带随机码的完整 ID（如 <code>mimi-7h3k9q2x</code>）。
              请像密码一样保管，把它发给共同养育人即可一起记录。
            </p>
            <button className="btn-primary w-full" onClick={handleCreate} disabled={busy || !isSupabaseReady}>
              {busy ? '创建中…' : '创建猫咪'}
            </button>
            {hasLocalData && (
              <p className="text-center text-xs text-moss">
                检测到本地已有数据，创建后可在设置里迁移到云端。
              </p>
            )}
          </>
        ) : (
          <>
            <label className="block">
              <span className="label">输入共同养育人分享的猫咪 ID</span>
              <input className="field" value={joinId} onChange={(e) => setJoinId(e.target.value)}
                placeholder="例如 mimi-7h3k9q2x" autoCapitalize="none" />
            </label>
            <button className="btn-primary w-full" onClick={handleJoin} disabled={busy || !isSupabaseReady}>
              {busy ? '加入中…' : '加入猫咪'}
            </button>
          </>
        )}

        {msg && <p className="text-center text-sm text-clay">{msg}</p>}
      </div>

      <p className="mt-6 text-center text-xs text-ink/40">
        无需登录 · 凭猫咪 ID 共享 · 数据存于你的 Supabase
      </p>
    </div>
  )
}
