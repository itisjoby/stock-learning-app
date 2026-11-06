import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency, formatShortDate } from '../../utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  const isUp = d.close >= d.open

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">Open</span>
        <span className="text-white font-medium">{formatCurrency(d.open)}</span>
        <span className="text-gray-400">High</span>
        <span className="text-green-400 font-medium">{formatCurrency(d.high)}</span>
        <span className="text-gray-400">Low</span>
        <span className="text-red-400 font-medium">{formatCurrency(d.low)}</span>
        <span className="text-gray-400">Close</span>
        <span className={`font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(d.close)}</span>
        <span className="text-gray-400">Volume</span>
        <span className="text-blue-400 font-medium">{(d.volume / 1e6).toFixed(2)}M</span>
      </div>
    </div>
  )
}

// Custom candlestick bar shape
function CandlestickBar(props) {
  const { x, y, width, height, payload } = props
  if (!payload) return null

  const { open, close, high, low } = payload
  const isUp = close >= open
  const color = isUp ? '#22c55e' : '#ef4444'

  const bodyTop = isUp ? y : y + height - ((close - open) / (high - low)) * height
  const bodyHeight = Math.max(1, Math.abs(close - open) / (high - low) * height)
  const wickX = x + width / 2

  // Map high/low to pixel coords
  const totalRange = high - low
  if (totalRange === 0) return null

  const highY = y
  const lowY = y + height
  const openY = y + height - ((open - low) / totalRange) * height
  const closeY = y + height - ((close - low) / totalRange) * height

  const bodyTopY = Math.min(openY, closeY)
  const bodyBotY = Math.max(openY, closeY)
  const bodyH = Math.max(1, bodyBotY - bodyTopY)

  return (
    <g>
      {/* Upper wick */}
      <line x1={wickX} y1={highY} x2={wickX} y2={bodyTopY} stroke={color} strokeWidth={1.5} />
      {/* Body */}
      <rect x={x + 1} y={bodyTopY} width={width - 2} height={bodyH} fill={color} fillOpacity={0.85} rx={1} />
      {/* Lower wick */}
      <line x1={wickX} y1={bodyBotY} x2={wickX} y2={lowY} stroke={color} strokeWidth={1.5} />
    </g>
  )
}

export default function CandlestickChart({ data, height = 300 }) {
  if (!data || data.length === 0) return null

  const displayData = data.slice(-60)
  const prices = displayData.flatMap(d => [d.high, d.low])
  const minPrice = Math.min(...prices) * 0.998
  const maxPrice = Math.max(...prices) * 1.002
  const maxVol = Math.max(...displayData.map(d => d.volume))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="70%">
        <ComposedChart data={displayData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            interval={Math.floor(displayData.length / 6)}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v.toFixed(0)}`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="high"
            shape={<CandlestickBar />}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume chart */}
      <ResponsiveContainer width="100%" height="28%">
        <ComposedChart data={displayData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[0, maxVol * 1.5]} />
          <Bar
            dataKey="volume"
            isAnimationActive={false}
            radius={[1, 1, 0, 0]}
            fill="#3b82f6"
            fillOpacity={0.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
