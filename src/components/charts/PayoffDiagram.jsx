import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const pnl = payload[0]?.value
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">Stock @ {formatCurrency(label)}</p>
      <p className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        P&L: {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
      </p>
    </div>
  )
}

export default function PayoffDiagram({ data, breakeven, height = 200 }) {
  if (!data || data.length === 0) return null

  const pnlValues = data.map(d => d.pnl)
  const minPnL = Math.min(...pnlValues)
  const maxPnL = Math.max(...pnlValues)
  const padding = (maxPnL - minPnL) * 0.1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="stockPrice"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `$${v.toFixed(0)}`}
          interval={Math.floor(data.length / 5)}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v >= 0 ? `+$${v.toFixed(0)}` : `-$${Math.abs(v).toFixed(0)}`}
          domain={[minPnL - padding, maxPnL + padding]}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="4 4" />
        {breakeven && (
          <ReferenceLine
            x={breakeven}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: `BE: $${breakeven}`, fill: '#f59e0b', fontSize: 10 }}
          />
        )}
        <Line
          type="monotone"
          dataKey="pnl"
          dot={false}
          strokeWidth={2}
          stroke="#3b82f6"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
