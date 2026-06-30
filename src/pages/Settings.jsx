import { useRef, useState } from 'react'
import { useData } from '../lib/useData'
import { updateSettings } from '../lib/store'
import { exportJSON, importJSON, exportLogsCSV, exportFoodsCSV } from '../lib/io'
import { PageHeader, Field } from '../components/ui'

export default function Settings() {
  const { settings } = useData()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  const setNum = (k) => (e) => updateSettings({ [k]: e.target.value === '' ? 0 : Number(e.target.value) })
  const setStr = (k) => (e) => updateSettings({ [k]: e.target.value })

  async function onImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importJSON(file)
      setMsg('Imported successfully.')
    } catch (err) {
      setMsg('Import failed: ' + err.message)
    }
    e.target.value = ''
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <section className="card mb-4 space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">Kitten profile</h2>
        <Field label="Name"><input className="field" value={settings.kittenName} onChange={setStr('kittenName')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Birth date"><input className="field" type="date" value={settings.birthDate || ''} onChange={setStr('birthDate')} /></Field>
          <Field label="Weight (kg)"><input className="field" type="number" inputMode="decimal" value={settings.currentWeightKg || ''} onChange={setNum('currentWeightKg')} /></Field>
        </div>
      </section>

      <section className="card mb-4 space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">Daily targets</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target kcal / day"><input className="field" type="number" inputMode="decimal" value={settings.targetDailyKcal} onChange={setNum('targetDailyKcal')} /></Field>
          <Field label="Target water (ml)"><input className="field" type="number" inputMode="decimal" value={settings.targetDailyWaterMl} onChange={setNum('targetDailyWaterMl')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Watch below %" hint="e.g. 90"><input className="field" type="number" inputMode="decimal" value={settings.normalIntakePercent} onChange={setNum('normalIntakePercent')} /></Field>
          <Field label="Warn below %" hint="e.g. 70"><input className="field" type="number" inputMode="decimal" value={settings.lowIntakeWarningPercent} onChange={setNum('lowIntakeWarningPercent')} /></Field>
        </div>
      </section>

      <section className="card mb-4 space-y-3 p-4">
        <h2 className="font-display text-lg font-semibold">Data</h2>
        <p className="text-xs text-ink/50">Everything is stored locally in this browser. Back up regularly.</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={exportJSON}>Export JSON</button>
          <button className="btn-soft" onClick={() => fileRef.current?.click()}>Import JSON</button>
          <button className="btn-ghost" onClick={exportLogsCSV}>Export logs CSV</button>
          <button className="btn-ghost" onClick={exportFoodsCSV}>Export foods CSV</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        {msg && <p className="text-sm text-moss">{msg}</p>}
      </section>

      <p className="px-1 text-center text-xs text-ink/40">Kitten Tracker · local-only PWA · no accounts, no servers</p>
    </div>
  )
}
