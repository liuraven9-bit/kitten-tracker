import { getData, replaceAll } from './store'

function download(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

export function exportJSON() {
  const data = getData()
  download(`kitten-tracker-${stamp()}.json`, JSON.stringify(data, null, 2))
}

export async function importJSON(file) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file')
  replaceAll(parsed)
}

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function exportLogsCSV() {
  const { logs, foods } = getData()
  const foodName = (id) => foods.find((f) => f.id === id)?.productName || foods.find((f) => f.id === id)?.name || ''
  const headers = [
    'id', 'timestamp', 'type', 'amount', 'unit', 'foodId', 'foodName',
    'remainingAmount', 'calculatedIntake', 'calculatedKcal', 'calculatedProtein', 'note',
  ]
  const rows = logs
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((l) =>
      [
        l.id, l.timestamp, l.type, l.amount, l.unit, l.foodId, foodName(l.foodId),
        l.remainingAmount, l.calculatedIntake, l.calculatedKcal, l.calculatedProtein, l.note,
      ].map(csvEscape).join(',')
    )
  const csv = [headers.join(','), ...rows].join('\n')
  download(`kitten-logs-${stamp()}.csv`, csv, 'text/csv')
}

export function exportFoodsCSV() {
  const { foods } = getData()
  const headers = [
    'id', 'barcode', 'brand', 'productName', 'foodType', 'kcalPerGram', 'kcalPerCan',
    'kcalPerCup', 'canWeightGram', 'cupWeightGram', 'crudeProteinPercentAsFed',
    'crudeFatPercentAsFed', 'crudeFiberPercentAsFed', 'moisturePercent',
    'dryMatterProteinPercent', 'dryMatterFatPercent', 'source', 'notes',
  ]
  const rows = foods.map((f) => headers.map((h) => csvEscape(f[h])).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  download(`kitten-foods-${stamp()}.csv`, csv, 'text/csv')
}
