import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/useData'
import { upsertFood, deleteFood } from '../lib/store'
import { blankFood, recomputeFood, FOOD_TYPES } from '../lib/food'
import { exportFoodsCSV } from '../lib/io'
import { PageHeader, Modal, Field } from '../components/ui'
import { Scan, Edit, Trash } from '../components/icons'

export default function Foods() {
  const { foods } = useData()
  const [editing, setEditing] = useState(null)

  return (
    <div>
      <PageHeader
        title="Foods"
        subtitle={`${foods.length} card${foods.length === 1 ? '' : 's'}`}
        action={
          <Link to="/foods/scan" className="btn-primary px-3 py-2 text-sm">
            <Scan className="h-5 w-5" /> Scan
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button className="btn-soft" onClick={() => setEditing(blankFood())}>+ Add manually</button>
        <button className="btn-ghost" onClick={exportFoodsCSV} disabled={!foods.length}>Export CSV</button>
      </div>

      {foods.length === 0 && (
        <div className="card p-6 text-center text-sm text-ink/55">
          No foods yet. Scan a barcode, snap a label, or add one manually.
        </div>
      )}

      <ul className="space-y-2">
        {foods.map((f) => (
          <li key={f.id} className="card flex items-center gap-3 p-3">
            {f.imageDataUrl ? (
              <img src={f.imageDataUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sand text-lg">
                {(f.foodType || f.type) === 'wet' ? '🥫' : (f.foodType || f.type) === 'treat' ? '🍪' : '🥣'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {f.brand ? `${f.brand} · ` : ''}{f.productName || f.name || 'Unnamed'}
              </div>
              <div className="text-xs text-ink/50">
                {f.foodType || f.type}
                {f.kcalPerGram != null && ` · ${(f.kcalPerGram).toFixed(2)} kcal/g`}
                {f.crudeProteinPercentAsFed != null && ` · ${f.crudeProteinPercentAsFed}% protein`}
                {f.source && f.source !== 'manual' && ` · ${f.source}`}
              </div>
            </div>
            <button className="btn-ghost px-2 py-2" onClick={() => setEditing(f)}><Edit className="h-4 w-4" /></button>
            <button className="btn-danger px-2 py-2" onClick={() => deleteFood(f.id)}><Trash className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>

      {editing && <FoodEditor food={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

export function FoodEditor({ food, onClose, confirmLabel = 'Save food' }) {
  const [draft, setDraft] = useState(food)
  const { food: computed, warnings } = recomputeFood(draft)

  const set = (k) => (e) => {
    const v = e.target.value
    setDraft((d) => ({ ...d, [k]: v === '' ? '' : v }))
  }
  const setNum = (k) => (e) => {
    const v = e.target.value
    setDraft((d) => ({ ...d, [k]: v === '' ? null : Number(v) }))
  }

  function save() {
    upsertFood(computed)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={food.productName || food.name ? 'Edit food' : 'New food'}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>{confirmLabel}</button>
        </div>
      }
    >
      <div className="space-y-3">
        {computed.imageDataUrl && (
          <img src={computed.imageDataUrl} alt="" className="h-32 w-full rounded-xl object-cover" />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand"><input className="field" value={draft.brand || ''} onChange={set('brand')} /></Field>
          <Field label="Product name"><input className="field" value={draft.productName || ''} onChange={set('productName')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select className="field" value={draft.foodType || 'dry'} onChange={set('foodType')}>
              {FOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Barcode"><input className="field" value={draft.barcode || ''} onChange={set('barcode')} /></Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="kcal / kg" hint="auto → kcal/g">
            <input className="field" type="number" inputMode="decimal" value={draft.kcalPerKg ?? ''} onChange={setNum('kcalPerKg')} />
          </Field>
          <Field label="kcal / gram">
            <input className="field" type="number" inputMode="decimal" value={draft.kcalPerGram ?? ''} onChange={setNum('kcalPerGram')} />
          </Field>
          <Field label="kcal / can"><input className="field" type="number" inputMode="decimal" value={draft.kcalPerCan ?? ''} onChange={setNum('kcalPerCan')} /></Field>
          <Field label="kcal / cup"><input className="field" type="number" inputMode="decimal" value={draft.kcalPerCup ?? ''} onChange={setNum('kcalPerCup')} /></Field>
          <Field label="Can weight (g)"><input className="field" type="number" inputMode="decimal" value={draft.canWeightGram ?? ''} onChange={setNum('canWeightGram')} /></Field>
          <Field label="Cup weight (g)"><input className="field" type="number" inputMode="decimal" value={draft.cupWeightGram ?? ''} onChange={setNum('cupWeightGram')} /></Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Crude protein % (as fed)"><input className="field" type="number" inputMode="decimal" value={draft.crudeProteinPercentAsFed ?? ''} onChange={setNum('crudeProteinPercentAsFed')} /></Field>
          <Field label="Crude fat % (as fed)"><input className="field" type="number" inputMode="decimal" value={draft.crudeFatPercentAsFed ?? ''} onChange={setNum('crudeFatPercentAsFed')} /></Field>
          <Field label="Crude fiber % (max)"><input className="field" type="number" inputMode="decimal" value={draft.crudeFiberPercentAsFed ?? ''} onChange={setNum('crudeFiberPercentAsFed')} /></Field>
          <Field label="Moisture % (max)"><input className="field" type="number" inputMode="decimal" value={draft.moisturePercent ?? ''} onChange={setNum('moisturePercent')} /></Field>
          <Field label="Taurine %"><input className="field" type="number" inputMode="decimal" value={draft.taurinePercent ?? ''} onChange={setNum('taurinePercent')} /></Field>
        </div>

        <div className="card bg-cream/60 p-3 text-sm">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/45">Auto-calculated</div>
          <div className="flex justify-between"><span className="text-ink/55">kcal/g</span><b>{computed.kcalPerGram != null ? computed.kcalPerGram.toFixed(3) : '—'}</b></div>
          <div className="flex justify-between"><span className="text-ink/55">DM protein %</span><b>{computed.dryMatterProteinPercent != null ? computed.dryMatterProteinPercent.toFixed(1) : '—'}</b></div>
          <div className="flex justify-between"><span className="text-ink/55">DM fat %</span><b>{computed.dryMatterFatPercent != null ? computed.dryMatterFatPercent.toFixed(1) : '—'}</b></div>
        </div>

        {warnings.length > 0 && (
          <div className="card bg-warn/10 p-3 text-xs text-warn">
            {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}

        <Field label="Notes"><textarea className="field" rows={2} value={draft.notes || ''} onChange={set('notes')} /></Field>
      </div>
    </Modal>
  )
}
