export function PageHeader({ title, subtitle, action }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink/50">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

const toneMap = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-ink/60',
}

export function StatCard({ label, value, unit, sub, tone = 'neutral', big }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</div>
      <div className={`mt-1 flex items-baseline gap-1 ${big ? 'text-3xl' : 'text-2xl'}`}>
        <span className={`font-display font-semibold ${toneMap[tone]}`}>{value}</span>
        {unit && <span className="text-sm font-medium text-ink/40">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-xs text-ink/45">{sub}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-cream p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 font-display text-2xl font-semibold">{title}</h2>}
        {children}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/40">{hint}</span>}
    </label>
  )
}
