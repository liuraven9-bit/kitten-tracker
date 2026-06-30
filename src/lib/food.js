import { uid } from './store'
import { dryMatterPercent } from './calc'

export const FOOD_TYPES = ['dry', 'wet', 'treat', 'raw', 'supplement']

// Build a blank food card with all fields present.
export function blankFood(patch = {}) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    barcode: '',
    brand: '',
    productName: '',
    name: '', // legacy alias used by simple food DB / feeding picker
    foodType: 'dry',
    type: 'dry', // legacy alias
    kcalPerGram: null,
    kcalPerKg: null,
    kcalPerCan: null,
    kcalPerCup: null,
    canWeightGram: null,
    cupWeightGram: null,
    defaultServingGram: null,
    crudeProteinPercentAsFed: null,
    crudeFatPercentAsFed: null,
    crudeFiberPercentAsFed: null,
    moisturePercent: null,
    taurinePercent: null,
    dryMatterProteinPercent: null,
    dryMatterFatPercent: null,
    source: 'manual', // manual | barcode | ocr
    imageDataUrl: null,
    createdAt: now,
    updatedAt: now,
    notes: '',
    ...patch,
  }
}

// Recompute derived fields. Returns a NEW object plus a list of warnings.
export function recomputeFood(food) {
  const f = { ...food }
  const warnings = []

  // kcalPerGram from kcalPerKg if provided
  if (f.kcalPerKg != null && f.kcalPerKg !== '' && !Number.isNaN(Number(f.kcalPerKg))) {
    f.kcalPerGram = Number(f.kcalPerKg) / 1000
  }

  // Keep legacy aliases in sync
  if (f.productName && !f.name) f.name = f.productName
  if (f.name && !f.productName) f.productName = f.name
  if (f.foodType && !f.type) f.type = f.foodType
  if (f.type && !f.foodType) f.foodType = f.type

  // Dry matter only when moisture present
  if (f.moisturePercent == null || f.moisturePercent === '') {
    f.dryMatterProteinPercent = null
    f.dryMatterFatPercent = null
  } else {
    f.dryMatterProteinPercent = dryMatterPercent(num(f.crudeProteinPercentAsFed), num(f.moisturePercent))
    f.dryMatterFatPercent = dryMatterPercent(num(f.crudeFatPercentAsFed), num(f.moisturePercent))
  }

  // Sanity check on kcalPerGram. Reasonable range ~0.5–6 kcal/g.
  const kpg = num(f.kcalPerGram)
  if (kpg != null && (kpg < 0.3 || kpg > 8)) {
    warnings.push(`kcal/gram = ${kpg.toFixed(2)} looks unusual — please double-check.`)
  }
  if (num(f.moisturePercent) == null) {
    warnings.push('Moisture missing — dry-matter values will not be calculated.')
  }
  if (num(f.crudeProteinPercentAsFed) == null) {
    warnings.push('Crude protein missing — protein intake will not be calculated for feeds.')
  }

  f.updatedAt = new Date().toISOString()
  return { food: f, warnings }
}

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// ---------- Barcode lookup (Open Food Facts / Open Pet Food Facts) ----------
// Free, no key. Pet products live on openpetfoodfacts; we try both.
export async function lookupBarcode(barcode) {
  const endpoints = [
    `https://world.openpetfoodfacts.org/api/v2/product/${barcode}.json`,
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
  ]
  for (const url of endpoints) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const json = await res.json()
      if (json && json.status === 1 && json.product) {
        return mapOFFProduct(json.product, barcode)
      }
    } catch (e) {
      // try next endpoint
    }
  }
  return null
}

function mapOFFProduct(p, barcode) {
  const n = p.nutriments || {}
  // OFF "energy-kcal_100g" is per 100g as sold.
  const kcal100 = n['energy-kcal_100g'] ?? null
  const patch = {
    barcode,
    brand: (p.brands || '').split(',')[0]?.trim() || '',
    productName: p.product_name || p.generic_name || '',
    source: 'barcode',
    kcalPerGram: kcal100 != null ? Number(kcal100) / 100 : null,
    crudeProteinPercentAsFed: n['proteins_100g'] ?? null,
    crudeFatPercentAsFed: n['fat_100g'] ?? null,
    crudeFiberPercentAsFed: n['fiber_100g'] ?? null,
    imageDataUrl: p.image_front_url || p.image_url || null,
  }
  return recomputeFood(blankFood(patch)).food
}

// ---------- OCR text field extraction ----------
// Pulls common pet-food label numbers out of raw OCR text.
export function parseLabelText(text) {
  const t = text.replace(/\u00a0/g, ' ')
  const out = {}

  const grab = (re) => {
    const m = t.match(re)
    return m ? parseFloat(m[1].replace(',', '.')) : null
  }

  out.kcalPerKg = grab(/([\d.,]+)\s*kcal\s*\/?\s*kg/i) ?? grab(/([\d.,]+)\s*kcal\s*per\s*kg/i)
  out.kcalPerCan = grab(/([\d.,]+)\s*kcal\s*\/?\s*can/i)
  out.kcalPerCup = grab(/([\d.,]+)\s*kcal\s*\/?\s*cup/i)
  const calsGeneric = grab(/([\d.,]+)\s*kcal\b/i)
  if (out.kcalPerKg == null && out.kcalPerCan == null && out.kcalPerCup == null && calsGeneric != null) {
    out.caloriesGeneric = calsGeneric
  }

  out.crudeProteinPercentAsFed =
    grab(/crude\s*protein[^%\d]*(?:min[^%\d]*)?([\d.,]+)\s*%/i) ??
    grab(/protein[^%\d]*([\d.,]+)\s*%/i)
  out.crudeFatPercentAsFed =
    grab(/crude\s*fat[^%\d]*(?:min[^%\d]*)?([\d.,]+)\s*%/i) ??
    grab(/fat[^%\d]*([\d.,]+)\s*%/i)
  out.crudeFiberPercentAsFed =
    grab(/crude\s*fib(?:er|re)[^%\d]*(?:max[^%\d]*)?([\d.,]+)\s*%/i) ??
    grab(/fib(?:er|re)[^%\d]*([\d.,]+)\s*%/i)
  out.moisturePercent =
    grab(/moisture[^%\d]*(?:max[^%\d]*)?([\d.,]+)\s*%/i)
  out.taurinePercent =
    grab(/taurine[^%\d]*([\d.,]+)\s*%/i)

  // Drop nulls
  Object.keys(out).forEach((k) => out[k] == null && delete out[k])
  return out
}
