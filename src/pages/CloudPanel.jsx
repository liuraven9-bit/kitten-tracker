import { useState } from 'react'
import { getSavedCatId, clearCatId } from '../lib/catId'
import { migrateLocalData } from '../lib/store'

// 读取旧版本地数据
function readLegacy() {
  try {
    const raw = localStorage.getItem('kitten-tracker:v1')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function downloadJSON(obj, name) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

// 放在设置页的一个区块：显示当前猫咪 ID、迁移本地数据、退出当前猫咪。
export default function CloudPanel() {
  const catId = getSavedCatId()
  const legacy = readLegacy()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const foodsN = legacy?.foods?.length || 0
  const logsN = legacy?.logs?.length || 0
  const alreadyMigrated = legacy?.migrated

  async function migrate() {
    if (!legacy) return
    setBusy(true); setMsg('')
    try {
      await migrateLocalData({
        settings: legacy.settings,
        foods: legacy.foods || [],
        logs: legacy.logs || [],
      })
      // 标记已迁移，不删除本地数据
      localStorage.setItem('kitten-tracker:v1', JSON.stringify({ ...legacy, migrated: true }))
      setMsg('迁移完成，云端已包含本地数据。')
    } catch (e) {
      setMsg('迁移失败：' + (e.message || e))
    } finally { setBusy(false) }
  }

  function copyId() {
    navigator.clipboard.writeText(catId).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="card mb-4 space-y-3 p-4">
      <h2 className="font-display text-lg font-semibold">共同养育</h2>

      <div>
        <div className="label">当前猫咪 ID（分享给共同养育人）</div>
        <div className="flex gap-2">
          <input className="field flex-1 font-mono text-sm" readOnly value={catId || ''} />
          <button className="btn-soft px-3" onClick={copyId}>{copied ? '已复制' : '复制'}</button>
        </div>
        <p className="mt-1 text-xs text-ink/45">对方在「加入猫咪」里输入这个 ID，即可一起记录。</p>
      </div>

      {legacy && (foodsN > 0 || logsN > 0) && !alreadyMigrated && (
        <div className="card bg-cream/60 p-3">
          <div className="mb-2 text-sm font-semibold">本地数据迁移</div>
          <div className="text-xs text-ink/60">
            本地食物卡片：{foodsN} · 本地记录：{logsN}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-ghost text-sm" onClick={() => downloadJSON(legacy, 'kitten-backup.json')}>
              下载本地备份
            </button>
            <button className="btn-primary text-sm" onClick={migrate} disabled={busy}>
              {busy ? '迁移中…' : '迁移到云端'}
            </button>
          </div>
        </div>
      )}
      {alreadyMigrated && <p className="text-xs text-moss">本地数据已迁移到云端。</p>}

      <button className="btn-soft w-full" onClick={() => {
        if (confirm('退出当前猫咪？下次需要重新输入 ID。本地和云端数据不会被删除。')) {
          clearCatId(); location.reload()
        }
      }}>退出当前猫咪</button>

      {msg && <p className="text-sm text-moss">{msg}</p>}
    </section>
  )
}
