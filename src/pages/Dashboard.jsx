import { Link } from 'react-router-dom'
import { useData } from '../lib/useData'
import { summarizeDay, intakeStatus } from '../lib/calc'
import { PageHeader, StatCard } from '../components/ui'
import { Drop, Bowl } from '../components/icons'

export default function Dashboard() {
  const { logs, foods, settings } = useData()
  const today = summarizeDay(logs, foods, new Date())
  const status = intakeStatus(today.kcal, settings.targetDailyKcal, settings)

  const waterPct = settings.targetDailyWaterMl
    ? Math.round((today.waterMl / settings.targetDailyWaterMl) * 100)
    : 0

  const toneBg = {
    ok: 'bg-ok/10 text-ok',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
    neutral: 'bg-sand text-ink/60',
  }[status.tone]

  return (
    <div>
      <PageHeader
        title={settings.kittenName || 'Today'}
        subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      />

      <div className={`card mb-4 flex items-center justify-between p-4 ${toneBg}`}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Status</div>
          <div className="font-display text-2xl font-semibold">{status.label}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-semibold">{Math.round(status.percent)}%</div>
          <div className="text-xs opacity-70">of kcal target</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Energy"
          value={Math.round(today.kcal)}
          unit={`/ ${settings.targetDailyKcal} kcal`}
          tone={status.tone}
          big
        />
        <StatCard
          label="Protein"
          value={Math.round(today.protein * 10) / 10}
          unit="g"
          sub="from calculated feeds"
        />
        <StatCard
          label="Water"
          value={today.waterMl}
          unit={`/ ${settings.targetDailyWaterMl} ml`}
          sub={`${waterPct}% of target`}
          tone={waterPct >= 90 ? 'ok' : waterPct >= 60 ? 'warn' : 'danger'}
        />
        <StatCard label="Feeds" value={today.feedCount} unit="times" />
        <StatCard label="Pee" value={today.peeCount} unit="times" tone={today.peeCount === 0 ? 'warn' : 'neutral'} />
        <StatCard label="Poop" value={today.poopCount} unit="times" tone={today.poopCount === 0 ? 'warn' : 'neutral'} />
      </div>

      {today.vomitCount > 0 && (
        <div className="card mt-3 bg-danger/10 p-4 text-sm font-semibold text-danger">
          ⚠ {today.vomitCount} vomit event{today.vomitCount > 1 ? 's' : ''} logged today.
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link to="/log" className="btn-primary">
          <Bowl className="h-5 w-5" /> Quick log
        </Link>
        <Link to="/log?type=water_added" className="btn-soft">
          <Drop className="h-5 w-5" /> Add water
        </Link>
      </div>
    </div>
  )
}
