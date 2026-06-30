import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lookupBarcode, parseLabelText, blankFood, recomputeFood } from '../lib/food'
import { FoodEditor } from './Foods'
import { PageHeader, Field } from '../components/ui'
import { Scan, Camera, X } from '../components/icons'

// Detect a barcode from a video stream using BarcodeDetector,
// falling back to the `barcode-detector` polyfill (ZXing-based) if missing.
async function getDetector() {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats?.()
      if (!formats || formats.length) return new window.BarcodeDetector()
    } catch (_) { /* fall through */ }
  }
  const mod = await import('barcode-detector')
  const Ponyfill = mod.BarcodeDetector || mod.default?.BarcodeDetector || mod.default
  return new Ponyfill()
}

export default function AddFoodByScan() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('menu') // menu | barcode | manualCode | ocr
  const [status, setStatus] = useState('')
  const [pendingFood, setPendingFood] = useState(null)

  return (
    <div>
      <PageHeader
        title="Add by scan"
        subtitle="Barcode · label photo · manual"
        action={<button className="btn-ghost px-2 py-2" onClick={() => navigate('/foods')}><X className="h-5 w-5" /></button>}
      />

      {mode === 'menu' && (
        <div className="grid gap-3">
          <button className="btn-primary h-20 text-lg" onClick={() => setMode('barcode')}>
            <Scan className="h-6 w-6" /> Scan barcode
          </button>
          <button className="btn-soft h-20 text-lg" onClick={() => setMode('ocr')}>
            <Camera className="h-6 w-6" /> Photograph nutrition label (OCR)
          </button>
          <button className="btn-ghost h-16" onClick={() => setMode('manualCode')}>Enter barcode manually</button>
          <button className="btn-ghost h-16" onClick={() => setPendingFood(blankFood())}>Add blank food card</button>
          <p className="px-1 text-center text-xs text-ink/45">
            All scanned and online results must be confirmed before saving.
          </p>
        </div>
      )}

      {mode === 'barcode' && (
        <BarcodeScanner
          onCancel={() => setMode('menu')}
          onCode={async (code) => {
            setStatus('Looking up ' + code + ' …')
            setMode('menu')
            const found = await lookupBarcode(code)
            if (found) {
              setStatus('')
              setPendingFood({ ...found, barcode: code })
            } else {
              setStatus('No product found for ' + code + '. Try a label photo or edit manually.')
              setPendingFood(recomputeFood(blankFood({ barcode: code, source: 'barcode' })).food)
            }
          }}
        />
      )}

      {mode === 'manualCode' && (
        <ManualCode
          onCancel={() => setMode('menu')}
          onSubmit={async (code) => {
            setStatus('Looking up ' + code + ' …')
            setMode('menu')
            const found = await lookupBarcode(code)
            setStatus(found ? '' : 'No product found — please fill in the card.')
            setPendingFood(found ? { ...found, barcode: code } : recomputeFood(blankFood({ barcode: code, source: 'barcode' })).food)
          }}
        />
      )}

      {mode === 'ocr' && (
        <OcrCapture
          onCancel={() => setMode('menu')}
          onResult={(patch, imageDataUrl) => {
            setMode('menu')
            const f = recomputeFood(blankFood({ ...patch, imageDataUrl, source: 'ocr' })).food
            setPendingFood(f)
          }}
        />
      )}

      {status && <p className="mt-4 rounded-xl bg-sand p-3 text-sm">{status}</p>}

      {pendingFood && (
        <>
          <div className="mt-4 rounded-xl bg-warn/10 p-3 text-sm font-semibold text-warn">
            Please confirm — review every field before saving.
          </div>
          <FoodEditor
            food={pendingFood}
            confirmLabel="Confirm & save"
            onClose={() => { setPendingFood(null); navigate('/foods') }}
          />
        </>
      )}
    </div>
  )
}

function BarcodeScanner({ onCode, onCancel }) {
  const videoRef = useRef(null)
  const [err, setErr] = useState('')
  const stopRef = useRef(() => {})

  useEffect(() => {
    let active = true
    let raf
    ;(async () => {
      try {
        const detector = await getDetector()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return }
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        stopRef.current = () => stream.getTracks().forEach((t) => t.stop())

        const tick = async () => {
          if (!active) return
          try {
            const codes = await detector.detect(video)
            if (codes && codes.length) {
              const value = codes[0].rawValue
              active = false
              stopRef.current()
              onCode(value)
              return
            }
          } catch (_) { /* ignore frame errors */ }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch (e) {
        setErr('Camera unavailable: ' + e.message + '. You can enter the barcode manually.')
      }
    })()
    return () => { active = false; cancelAnimationFrame(raf); stopRef.current() }
  }, [onCode])

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-ink">
        <video ref={videoRef} className="h-72 w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-clay/80" />
        <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-cream/70" />
      </div>
      {err && <p className="mt-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{err}</p>}
      <p className="mt-3 text-center text-sm text-ink/55">Point the camera at the barcode.</p>
      <button className="btn-soft mt-3 w-full" onClick={onCancel}>Cancel</button>
    </div>
  )
}

function ManualCode({ onSubmit, onCancel }) {
  const [code, setCode] = useState('')
  return (
    <div className="space-y-3">
      <Field label="Barcode (EAN/UPC)">
        <input className="field" inputMode="numeric" autoFocus value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 3182550702171" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-soft" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={() => code && onSubmit(code)} disabled={!code}>Look up</button>
      </div>
    </div>
  )
}

function OcrCapture({ onResult, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setImageDataUrl(dataUrl)
    setBusy(true)
    setProgress(0)
    try {
      const Tesseract = (await import('tesseract.js')).default
      const { data } = await Tesseract.recognize(dataUrl, 'eng', {
        logger: (m) => { if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100)) },
      })
      setRawText(data.text)
      setParsed(parseLabelText(data.text))
    } catch (err) {
      setRawText('OCR failed: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {!imageDataUrl && (
        <button className="btn-primary h-20 w-full text-lg" onClick={() => fileRef.current?.click()}>
          <Camera className="h-6 w-6" /> Take / choose label photo
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {imageDataUrl && <img src={imageDataUrl} alt="label" className="h-44 w-full rounded-xl object-cover" />}

      {busy && (
        <div className="card p-3 text-sm">
          Reading label… {progress}%
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-moss transition-all" style={{ width: progress + '%' }} />
          </div>
        </div>
      )}

      {parsed && (
        <div className="card bg-cream/60 p-3 text-sm">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/45">Detected (confirm next)</div>
          {Object.keys(parsed).length === 0 && <div className="text-ink/55">No fields recognised — you can still edit manually.</div>}
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="text-ink/55">{k}</span><b>{v}</b></div>
          ))}
        </div>
      )}

      {rawText && (
        <details className="card p-3 text-xs text-ink/55">
          <summary className="cursor-pointer font-semibold">Raw OCR text</summary>
          <pre className="mt-2 whitespace-pre-wrap">{rawText}</pre>
        </details>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-soft" onClick={onCancel}>Cancel</button>
        <button
          className="btn-primary"
          disabled={busy || !parsed}
          onClick={() => onResult(parsed || {}, imageDataUrl)}
        >
          Use & confirm
        </button>
      </div>
    </div>
  )
}

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}
