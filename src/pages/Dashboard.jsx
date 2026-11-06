import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import useStore from '../store/useStore'
import {
  formatCurrency, formatPercent, formatNumber, formatShortDate, getChangeColor, getChangeBg
} from '../utils/formatters'
import { TrendingUp, TrendingDown, DollarSign, Activity, Briefcase, ArrowUpRight, ArrowDownRight } from 'lucide-react'

function StatCard({ title, value, sub, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function SparkLine({ data, positive }) {
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={positive ? '#22c55e' : '#ef4444'}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function Dashboard() {
  const { balance, stocks, portfolio, orders, watchlist, portfolioHistory } = useStore()

  const totalInvested = portfolio
    .filter(p => p.type === 'stock')
    .reduce((sum, p) => sum + (p.marketValue || 0), 0)
  const totalCost = portfolio
    .filter(p => p.type === 'stock')
    .reduce((sum, p) => sum + p.avgPrice * p.shares, 0)
  const totalPnL = totalInvested - totalCost
  const totalValue = balance + totalInvested

  // Day's P&L (simulate)
  const dayPnL = stocks
    .filter(s => portfolio.some(p => p.symbol === s.symbol && p.type === 'stock'))
    .reduce((sum, s) => {
      const pos = portfolio.find(p => p.symbol === s.symbol && p.type === 'stock')
      return sum + (pos ? s.change * pos.shares : 0)
    }, 0)

  const watchlistStocks = useMemo(() =>
    watchlist.map(sym => stocks.find(s => s.symbol === sym)).filter(Boolean),
    [watchlist, stocks]
  )

  const sortedByGain = [...stocks].sort((a, b) => b.changePercent - a.changePercent)
  const gainers = sortedByGain.slice(0, 3)
  const losers = sortedByGain.slice(-3).reverse()

  // Generate sparkline data for watchlist
  const sparklineData = useMemo(() => {
    const data = {}
    watchlist.forEach(sym => {
      data[sym] = Array.from({ length: 20 }, (_, i) => ({ v: 100 + Math.sin(i * 0.5 + sym.charCodeAt(0)) * 5 + Math.random() * 3 }))
    })
    return data
  }, [watchlist])

  const recentOrders = orders.slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(totalValue)}
          sub="Cash + Positions"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Total P&L"
          value={formatCurrency(Math.abs(totalPnL))}
          sub={`${totalPnL >= 0 ? 'Gain' : 'Loss'} on positions`}
          icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
          color={totalPnL >= 0 ? 'green' : 'red'}
          trend={totalCost > 0 ? (totalPnL / totalCost) * 100 : 0}
        />
        <StatCard
          title="Day's P&L"
          value={formatCurrency(Math.abs(dayPnL))}
          sub="Today's change"
          icon={Activity}
          color={dayPnL >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Open Positions"
          value={portfolio.length}
          sub={`${portfolio.filter(p => p.type === 'stock').length} stocks, ${portfolio.filter(p => p.type === 'option').length} options`}
          icon={Briefcase}
          color="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Watchlist</h2>
            <Link to="/markets" className="text-xs text-blue-400 hover:text-blue-300">View All →</Link>
          </div>
          <div className="space-y-3">
            {watchlistStocks.map(stock => (
              <div key={stock.symbol} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">{stock.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{stock.symbol}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[80px]">{stock.sector}</div>
                  </div>
                </div>
                <SparkLine data={sparklineData[stock.symbol] || []} positive={stock.changePercent >= 0} />
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{formatCurrency(stock.currentPrice)}</div>
                  <div className={`text-xs font-medium ${getChangeColor(stock.changePercent)}`}>
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
            {watchlistStocks.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No stocks in watchlist</p>
            )}
          </div>
        </div>

        {/* Portfolio Chart */}
        <div className="xl:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Portfolio Value</h2>
            <span className="text-xs text-gray-500">30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={portfolioHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => formatShortDate(v)}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#3b82f6' }}
                formatter={v => [formatCurrency(v), 'Value']}
                labelFormatter={v => formatShortDate(v)}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Movers + Recent Trades */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gainers & Losers */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-white font-semibold mb-4">Market Movers</h2>
          <div className="mb-4">
            <div className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Top Gainers
            </div>
            {gainers.map(s => (
              <div key={s.symbol} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{s.symbol}</span>
                  <span className="text-xs text-gray-500">{formatCurrency(s.currentPrice)}</span>
                </div>
                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  +{s.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-4">
            <div className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Top Losers
            </div>
            {losers.map(s => (
              <div key={s.symbol} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{s.symbol}</span>
                  <span className="text-xs text-gray-500">{formatCurrency(s.currentPrice)}</span>
                </div>
                <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {s.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="xl:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Trades</h2>
            <Link to="/portfolio" className="text-xs text-blue-400 hover:text-blue-300">View All →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No trades yet. Start trading!</p>
              <Link to="/trading" className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300">
                Go to Trading Terminal →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left pb-2">Symbol</th>
                    <th className="text-left pb-2">Action</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Price</th>
                    <th className="text-right pb-2">Total</th>
                    <th className="text-right pb-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentOrders.map(o => (
                    <tr key={o.id} className="text-xs">
                      <td className="py-2 font-semibold text-white">{o.symbol}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          o.action === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>{o.action}</span>
                      </td>
                      <td className="py-2 text-right text-gray-300">
                        {o.type === 'option' ? `${o.contracts}c` : o.shares}
                      </td>
                      <td className="py-2 text-right text-gray-300">{formatCurrency(o.price)}</td>
                      <td className="py-2 text-right text-white font-medium">{formatCurrency(o.total)}</td>
                      <td className="py-2 text-right text-gray-500">
                        {new Date(o.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
