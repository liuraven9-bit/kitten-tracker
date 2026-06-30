import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../lib/useData'
import { addLog, deleteLog } from '../lib/store'
import { foodIntakeGram, kcalFromIntake, proteinGramIntake, dayKey } from '../lib/calc'
import { PageHeader, Modal, Field } from '../components/ui'
import { Drop, Trash } from '../components/icons'

const QUICK = [
  { type: 'pee', label: 'Pee 🚽', cls: 'bg-amber-100 text-amber-800' },
  { type: 'poop', label: 'Poop 💩', cls: 'bg-yellow-900/10 text-yellow-900' },
  { type: 'vomit', label: 'Vomit 🤢', cls: 'bg-danger/10 text-danger' },
  { type: 'water_added', label: 'Water 💧', cls: 'bg-sky-100 text-sky-800', needsAmount: true, unit: 'ml' },
  { type: 'note', label: 'Note 📝', cls: 'bg-sand text-ink', needsNote: true },
]

const TYPE_LABEL = {
  dry_food_offered: 'Dry food offered',
  wet_food_offered: 'Wet food offered',
  food_remaining: 'Food intake (resolved)',
  water_added: 'Water added',
  water_remaining: 'Water remaining',
  pee: 'Pee',
  poop: 'Poop',
  vomit: 'Vomit',
  note: 'Note',
}

export default function QuickLog() {
  const { logs, foods } = useData()
  const [params] = useSearchParams()
  const [amountModal, setAmountModal] = useState(null) // {type, unit}
  const [feedOpen, setFeedOpen] = useState(false)

  const todays = useMemo(
    () =>
      logs
        .filter((l) => dayKey(new Date(l.timestamp)) === dayKey())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [logs]
  )

  function quick(item) {
    if (item.needsAmount || item.needsNote) {
      setAmountModal(item)
      return
    }
    addLog({ type: item.type })
  }

  return (
    <div>
      <PageHeader title="Quick log" subtitle="One tap to record" />

      <div className="grid grid-cols-2 gap-3">
        {QUICK.map((q) => (
          <button key={q.type} onClick={() => quick(q)} className={`btn ${q.cls} h-20 text-lg`}>
            {q.label}
          </button>
        ))}
        <button onClick={() => setFeedOpen(true)} className="btn col-span-2 h-20 bg-moss text-cream text-lg">
          🍽 Record a feed (offered → remaining)
        </button>
      </div>

      <h2 className="mb-2 mt-7 font-display text-xl font-semibold">Today’s entries</h2>
      {todays.length === 0 && <p className="text-sm text-ink/45">Nothing logged yet today.</p>}
      <ul className="space-y-2">
        {todays.map((l) => (
          <li key={l.id} className="card flex items-center justify-between p-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{TYPE_LABEL[l.type] || l.type}</div>
              <div className="truncate text-xs text-ink/50">
                {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {l.amount != null && ` · ${l.amount}${l.unit || ''}`}
                {l.calculatedKcal != null && ` · ${Math.round(l.calculatedKcal)} kcal`}
                {l.calculatedProtein != null && ` · ${Math.round(l.calculatedProtein * 10) / 10} g protein`}
                {l.note && ` · ${l.note}`}
              </div>
            </div>
            <button onClick={() => deleteLog(l.id)} className="btn-danger px-3 py-2">
              <Trash className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <AmountModal item={amountModal} initialType={params.get('type')} onClose={() => setAmountModal(null)} />
      <FeedModal open={feedOpen} foods={foods} onClose={() => setFeedOpen(false)} />
    </div>
  )
}

function AmountModal({ item, onClose }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  if (!item) return null
  const save = () => {
    addLog({
      type: item.type,
      amount: item.needsAmount ? Number(amount) || 0 : null,
      unit: item.unit || null,
      note,
    })
    setAmount('')
    setNote('')
    onClose()
  }
  return (
    <Modal open={!!item} onClose={onClose} title={item.label}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save</button>
        </div>
      }
    >
      {item.needsAmount && (
        <Field label={`Amount (${item.unit})`}>
          <input className="field" type="number" inputMode="decimal" autoFocus value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 30" />
        </Field>
      )}
      <div className="mt-3">
        <Field label="Note (optional)">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function FeedModal({ open, foods, onClose }) {
  const [foodId, setFoodId] = useState('')
  const [offered, setOffered] = useState('')
  const [remaining, setRemaining] = useState('')
  const [note, setNote] = useState('')

  const food = foods.find((f) => f.id === foodId) || null
  const intake = food ? foodIntakeGram(Number(offered), remaining === '' ? 0 : Number(remaining)) : null
  const kcal = food ? kcalFromIntake(intake, food.kcalPerGram) : null
  const protein = food ? proteinGramIntake(intake, food.crudeProteinPercentAsFed) : null
  const foodTypeIsDry = (food?.foodType || food?.type) === 'dry'

  function save() {
    if (!food) return
    const ts = new Date().toISOString()
    // 1) the offered event (counts as a feed)
    addLog({
      type: foodTypeIsDry ? 'dry_food_offered' : 'wet_food_offered',
      foodId: food.id,
      amount: Number(offered) || 0,
      unit: 'g',
      timestamp: ts,
      note,
    })
    // 2) the remaining/resolved event (carries calculated intake)
    addLog({
      type: 'food_remaining',
      foodId: food.id,
      amount: Number(offered) || 0,
      remainingAmount: remaining === '' ? 0 : Number(remaining),
      unit: 'g',
      calculatedIntake: intake,
      calculatedKcal: kcal,
      calculatedProtein: protein,
      timestamp: ts,
    })
    setFoodId(''); setOffered(''); setRemaining(''); setNote('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Record a feed"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!food || offered === ''}>Save feed</button>
        </div>
      }
    >
      {foods.length === 0 ? (
        <p className="text-sm text-ink/55">No foods yet. Add one in the Foods tab first.</p>
      ) : (
        <div className="space-y-3">
          <Field label="Food">
            <select className="field" value={foodId} onChange={(e) => setFoodId(e.target.value)}>
              <option value="">Select…</option>
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.brand ? `${f.brand} · ` : ''}{f.productName || f.name || 'Unnamed'}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Offered (g)">
              <input className="field" type="number" inputMode="decimal" value={offered}
                onChange={(e) => setOffered(e.target.value)} placeholder="e.g. 40" />
            </Field>
            <Field label="Remaining (g)" hint="Leave blank = 0">
              <input className="field" type="number" inputMode="decimal" value={remaining}
                onChange={(e) => setRemaining(e.target.value)} placeholder="0" />
            </Field>
          </div>

          {food && (
            <div className="card bg-cream/60 p-3 text-sm">
              <div className="flex justify-between"><span className="text-ink/55">Intake</span><b>{intake ?? '—'} g</b></div>
              <div className="flex justify-between"><span className="text-ink/55">Energy</span>
                <b>{kcal != null ? `${Math.round(kcal)} kcal` : '—'}</b></div>
              <div className="flex justify-between"><span className="text-ink/55">Protein</span>
                <b>{protein != null ? `${Math.round(protein * 10) / 10} g` : '— (no protein %)'}</b></div>
              {food.kcalPerGram == null && (
                <div className="mt-1 text-xs text-warn">This food has no kcal/gram — energy won’t be counted.</div>
              )}
            </div>
          )}

          <Field label="Note (optional)">
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      )}
    </Modal>
  )
}
