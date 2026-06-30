// Pure calculation helpers — no side effects, easy for future AI edits.

export function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function dayKey(d = new Date()) {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(
    x.getDate()
  ).padStart(2, '0')}`
}

export function lastNDays(n) {
  const days = []
  const today = startOfDay()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

// food intake gram = offered - remaining
export function foodIntakeGram(offered, remaining) {
  if (offered == null) return null
  const r = remaining == null ? 0 : remaining
  return Math.max(0, offered - r)
}

export function kcalFromIntake(intakeGram, kcalPerGram) {
  if (intakeGram == null || kcalPerGram == null) return null
  return intakeGram * kcalPerGram
}

export function proteinGramIntake(intakeGram, crudeProteinPercentAsFed) {
  if (intakeGram == null || crudeProteinPercentAsFed == null) return null
  return (intakeGram * crudeProteinPercentAsFed) / 100
}

export function dryMatterPercent(asFedPercent, moisturePercent) {
  if (asFedPercent == null || moisturePercent == null) return null
  const denom = 100 - moisturePercent
  if (denom <= 0) return null
  return (asFedPercent / denom) * 100
}

// daily intake percent -> status
export function intakeStatus(dailyKcal, targetKcal, settings) {
  const normal = settings?.normalIntakePercent ?? 90
  const warn = settings?.lowIntakeWarningPercent ?? 70
  if (!targetKcal || targetKcal <= 0) return { label: '—', tone: 'neutral', percent: 0 }
  const percent = (dailyKcal / targetKcal) * 100
  let label = 'Normal'
  let tone = 'ok'
  if (percent < warn) {
    label = 'Needs attention'
    tone = 'danger'
  } else if (percent < normal) {
    label = 'Watch'
    tone = 'warn'
  }
  return { label, tone, percent }
}

// Aggregate one day's logs into a summary.
export function summarizeDay(logs, foods, date = new Date()) {
  const key = dayKey(date)
  const todays = logs.filter((l) => dayKey(new Date(l.timestamp)) === key)

  let kcal = 0
  let protein = 0
  let waterMl = 0
  let feedCount = 0
  let peeCount = 0
  let poopCount = 0
  let vomitCount = 0

  for (const l of todays) {
    switch (l.type) {
      case 'food_remaining': {
        // Intake-resolving event; kcal/protein already calculated at log time.
        if (l.calculatedKcal != null) kcal += l.calculatedKcal
        if (l.calculatedProtein != null) protein += l.calculatedProtein
        break
      }
      case 'dry_food_offered':
      case 'wet_food_offered':
        feedCount += 1
        break
      case 'water_added':
        if (l.amount != null) waterMl += l.amount
        break
      case 'pee':
        peeCount += 1
        break
      case 'poop':
        poopCount += 1
        break
      case 'vomit':
        vomitCount += 1
        break
      default:
        break
    }
  }

  return { key, kcal, protein, waterMl, feedCount, peeCount, poopCount, vomitCount }
}

export function seriesLastNDays(logs, foods, n) {
  return lastNDays(n).map((d) => {
    const s = summarizeDay(logs, foods, d)
    return {
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      kcal: Math.round(s.kcal),
      protein: Math.round(s.protein * 10) / 10,
      water: Math.round(s.waterMl),
      pee: s.peeCount,
      poop: s.poopCount,
    }
  })
}
