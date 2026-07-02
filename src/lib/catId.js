// 猫咪 ID 的本地存取与生成。
// 完整 ID = 好记前缀 + '-' + 随机码，例如 mimi-7h3k9q2x
const CAT_KEY = 'kitten-tracker:catId'

// 生成随机码（8 位，去掉易混字符）
function randomCode(len = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length]
  return s
}

// 把用户输入的前缀规整为安全字符
export function sanitizePrefix(input) {
  return (input || 'cat')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20) || 'cat'
}

// 由前缀生成完整 ID
export function makeCatId(prefix) {
  return `${sanitizePrefix(prefix)}-${randomCode()}`
}

export function getSavedCatId() {
  return localStorage.getItem(CAT_KEY) || null
}
export function saveCatId(id) {
  localStorage.setItem(CAT_KEY, id)
}
export function clearCatId() {
  localStorage.removeItem(CAT_KEY)
}
