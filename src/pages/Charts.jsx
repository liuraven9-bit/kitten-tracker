import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { useData } from '../lib/useData'
import { seriesLastNDays } from '../lib/calc'
import { PageHeader } from '../components/ui'

function ChartCard({ title, children }) {
  return (
    <div className="card mb-4 p-3">
      <h3 className="mb-2 px-1 text-sm font-semibold text-ink/70">{title}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  )
}

const axis = { fontSize: 11, stroke: '#9a958a' }

export default function Charts() {
  const { logs, foods } = useData()
  const data = seriesLastNDays(logs, foods, 7)

  return (
    <div>
      <PageHeader title="Trends" subtitle="Last 7 days" />

      <ChartCard title="Energy intake (kcal)">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d4" />
          <XAxis dataKey="day" tick={axis} />
          <YAxis tick={axis} />
          <Tooltip />
          <Line type="monotone" dataKey="kcal" stroke="#3f6b52" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Protein intake (g)">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d4" />
          <XAxis dataKey="day" tick={axis} />
          <YAxis tick={axis} />
          <Tooltip />
          <Line type="monotone" dataKey="protein" stroke="#c8775a" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Water (ml)">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d4" />
          <XAxis dataKey="day" tick={axis} />
          <YAxis tick={axis} />
          <Tooltip />
          <Line type="monotone" dataKey="water" stroke="#3b82a6" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Litter box (times)">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d4" />
          <XAxis dataKey="day" tick={axis} />
          <YAxis tick={axis} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="pee" name="Pee" fill="#d9a441" radius={[4, 4, 0, 0]} />
          <Bar dataKey="poop" name="Poop" fill="#8a6d3b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  )
}
