// 数据库用下划线命名，前端用驼峰。这里做双向转换。

export function foodFromDb(r) {
  if (!r) return null
  return {
    id: r.id,
    catId: r.cat_id,
    barcode: r.barcode || '',
    brand: r.brand || '',
    productName: r.product_name || '',
    name: r.product_name || '',
    foodType: r.food_type || 'dry',
    type: r.food_type || 'dry',
    lifeStage: r.life_stage || '',
    kcalPerGram: r.kcal_per_gram,
    kcalPerKg: r.kcal_per_kg,
    kcalPerCan: r.kcal_per_can,
    kcalPerCup: r.kcal_per_cup,
    canWeightGram: r.can_weight_gram,
    cupWeightGram: r.cup_weight_gram,
    crudeProteinPercentAsFed: r.crude_protein_percent_as_fed,
    crudeFatPercentAsFed: r.crude_fat_percent_as_fed,
    crudeFiberPercentAsFed: r.crude_fiber_percent_as_fed,
    moisturePercent: r.moisture_percent,
    taurinePercent: r.taurine_percent,
    dryMatterProteinPercent: r.dry_matter_protein_percent,
    dryMatterFatPercent: r.dry_matter_fat_percent,
    source: r.source || 'manual',
    nutritionConfirmed: r.nutrition_confirmed,
    imageDataUrl: r.image_data_url,
    notes: r.notes || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function foodToDb(f, catId) {
  return {
    id: f.id,
    cat_id: catId,
    barcode: f.barcode || null,
    brand: f.brand || null,
    product_name: f.productName || f.name || null,
    food_type: f.foodType || f.type || 'dry',
    life_stage: f.lifeStage || null,
    kcal_per_gram: numOrNull(f.kcalPerGram),
    kcal_per_kg: numOrNull(f.kcalPerKg),
    kcal_per_can: numOrNull(f.kcalPerCan),
    kcal_per_cup: numOrNull(f.kcalPerCup),
    can_weight_gram: numOrNull(f.canWeightGram),
    cup_weight_gram: numOrNull(f.cupWeightGram),
    crude_protein_percent_as_fed: numOrNull(f.crudeProteinPercentAsFed),
    crude_fat_percent_as_fed: numOrNull(f.crudeFatPercentAsFed),
    crude_fiber_percent_as_fed: numOrNull(f.crudeFiberPercentAsFed),
    moisture_percent: numOrNull(f.moisturePercent),
    taurine_percent: numOrNull(f.taurinePercent),
    dry_matter_protein_percent: numOrNull(f.dryMatterProteinPercent),
    dry_matter_fat_percent: numOrNull(f.dryMatterFatPercent),
    source: f.source || 'manual',
    nutrition_confirmed: !!f.nutritionConfirmed,
    image_data_url: f.imageDataUrl || null,
    notes: f.notes || null,
    updated_at: new Date().toISOString(),
  }
}

export function logFromDb(r) {
  if (!r) return null
  return {
    id: r.id,
    catId: r.cat_id,
    type: r.log_type,
    timestamp: r.timestamp,
    foodId: r.food_card_id,
    amount: r.amount,
    unit: r.unit,
    remainingAmount: r.remaining_gram,
    offeredGram: r.offered_gram,
    calculatedIntake: r.intake_gram,
    calculatedKcal: r.kcal,
    calculatedProtein: r.protein_gram,
    note: r.note || '',
  }
}

export function logToDb(l, catId) {
  return {
    id: l.id,
    cat_id: catId,
    log_type: l.type,
    timestamp: l.timestamp || new Date().toISOString(),
    food_card_id: l.foodId || null,
    amount: numOrNull(l.amount),
    unit: l.unit || null,
    offered_gram: numOrNull(l.offeredGram ?? l.amount),
    remaining_gram: numOrNull(l.remainingAmount),
    intake_gram: numOrNull(l.calculatedIntake),
    kcal: numOrNull(l.calculatedKcal),
    protein_gram: numOrNull(l.calculatedProtein),
    note: l.note || null,
    updated_at: new Date().toISOString(),
  }
}

export function catFromDb(r) {
  if (!r) return null
  return {
    catId: r.cat_id,
    kittenName: r.name || '',
    birthDate: r.birth_date || '',
    currentWeightKg: r.current_weight_kg || 0,
    sex: r.sex || '',
    spayedNeutered: r.spayed_neutered,
    notes: r.notes || '',
    targetDailyKcal: r.target_daily_kcal ?? 200,
    targetDailyWaterMl: r.target_daily_water_ml ?? 150,
    lowIntakeWarningPercent: r.low_intake_warning_percent ?? 70,
    normalIntakePercent: r.normal_intake_percent ?? 90,
  }
}

export function settingsToCatDb(s) {
  const out = {}
  if (s.kittenName !== undefined) out.name = s.kittenName
  if (s.birthDate !== undefined) out.birth_date = s.birthDate || null
  if (s.currentWeightKg !== undefined) out.current_weight_kg = numOrNull(s.currentWeightKg)
  if (s.targetDailyKcal !== undefined) out.target_daily_kcal = numOrNull(s.targetDailyKcal)
  if (s.targetDailyWaterMl !== undefined) out.target_daily_water_ml = numOrNull(s.targetDailyWaterMl)
  if (s.lowIntakeWarningPercent !== undefined) out.low_intake_warning_percent = numOrNull(s.lowIntakeWarningPercent)
  if (s.normalIntakePercent !== undefined) out.normal_intake_percent = numOrNull(s.normalIntakePercent)
  out.updated_at = new Date().toISOString()
  return out
}

function numOrNull(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}
