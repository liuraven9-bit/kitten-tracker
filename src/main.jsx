import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import CatGate from './pages/CatGate'
import { getSavedCatId } from './lib/catId'
import { initCat } from './lib/store'
import './index.css'

// 检测本地是否有旧版数据（用于提示迁移）
function hasLocalLegacyData() {
  try {
    const raw = localStorage.getItem('kitten-tracker:v1')
    if (!raw) return false
    const d = JSON.parse(raw)
    return (d.foods?.length || d.logs?.length)
  } catch { return false }
}

function Root() {
  const [catId, setCatId] = useState(getSavedCatId())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (catId) {
      initCat(catId).then(() => setReady(true))
    }
  }, [catId])

  if (!catId) {
    return <CatGate onReady={setCatId} hasLocalData={hasLocalLegacyData()} />
  }
  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-ink/50">云端同步中…</div>
  }
  return (
    <HashRouter>
      <App />
    </HashRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
