import CloudPanel from './CloudPanel'
import { useData } from '../lib/useData'
import { updateSettings, getData } from '../lib/store'
import { PageHeader, Field } from '../components/ui'

// 从当前云端快照直接生成 CSV（不依赖旧的 io.js）
function download(name, text, mime) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}
function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

function exportLogsCSV() {
  const { logs, foods } = getData()
  const foodName = (id) => foods.find((f) => f.id === id)?.productName || foods.find((f) => f.id === id)?.name || ''
  const headers = ['id', 'timestamp', 'type', 'amount', 'unit', 'foodId', 'foodName',
    'remainingAmount', 'calculatedIntake', 'calculatedKcal', 'calculatedProtein', 'note']
  const rows = (logs || []).slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((l) => [l.id, l.timestamp, l.type, l.amount, l.unit, l.foodId, foodName(l.foodId),
      l.remainingAmount, l.calculatedIntake, l.calculatedKcal, l.calculatedProtein, l.note]
      .map(csvEscape).join(','))
  download(`喂养记录-${stamp()}.csv`, [headers.join(','), ...rows].join('\n'), 'text/csv')
}

function exportFoodsCSV() {
  const { foods } = getData()
  const headers = ['id', 'barcode', 'brand', 'productName', 'foodType', 'kcalPerGram', 'kcalPerCan',
    'crudeProteinPercentAsFed', 'crudeFatPercentAsFed', 'moisturePercent', 'source', 'notes']
  const rows = (foods || []).map((f) => headers.map((h) => csvEscape(f[h])).join(','))
  download(`食物卡片-${stamp()}.csv`, [headers.join(','), ...rows].join('\n'), 'text/csv')
}

export default function Settings() {
  const { settings, foods, logs } = useData()

  const setNum = (k) => (e) => updateSettings({ [k]: e.target.value === '' ? 0 : Number(e.target.value) })
  const setStr = (k) => (e) => updateSettings({ [k]: e.target.value })

  return (
    <div>
      <PageHeader title="设置" />

      <CloudPanel />

      <section className="card mb-4 space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">猫咪档案</h2>
        <Field label="名字"><input className="field" value={settings.kittenName} onChange={setStr('kittenName')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="出生日期"><input className="field" type="date" value={settings.birthDate || ''} onChange={setStr('birthDate')} /></Field>
          <Field label="体重（kg）"><input className="field" type="number" inputMode="decimal" value={settings.currentWeightKg || ''} onChange={setNum('currentWeightKg')} /></Field>
        </div>
      </section>

      <section className="card mb-4 space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">每日目标</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="目标热量（kcal/天）"><input className="field" type="number" inputMode="decimal" value={settings.targetDailyKcal} onChange={setNum('targetDailyKcal')} /></Field>
          <Field label="目标饮水（ml/天）"><input className="field" type="number" inputMode="decimal" value={settings.targetDailyWaterMl} onChange={setNum('targetDailyWaterMl')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="低于此值需观察 %" hint="例如 90"><input className="field" type="number" inputMode="decimal" value={settings.normalIntakePercent} onChange={setNum('normalIntakePercent')} /></Field>
          <Field label="低于此值预警 %" hint="例如 70"><input className="field" type="number" inputMode="decimal" value={settings.lowIntakeWarningPercent} onChange={setNum('lowIntakeWarningPercent')} /></Field>
        </div>
      </section>

      <section className="card mb-4 space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">导出备份</h2>
        <p className="text-xs text-ink/50">数据保存在云端。你也可以随时导出 CSV 存档。</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-soft" onClick={exportLogsCSV} disabled={!logs?.length}>导出记录 CSV</button>
          <button className="btn-soft" onClick={exportFoodsCSV} disabled={!foods?.length}>导出食物 CSV</button>
        </div>
      </section>

      <p className="px-1 text-center text-xs text-ink/40">猫咪追踪器 · 凭猫咪 ID 共享 · 无需登录</p>
    </div>
  )
}
