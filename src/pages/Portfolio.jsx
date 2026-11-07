import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import useStore from '../store/useStore'
import {
  formatCurrency, formatPercent, formatShortDate, getChangeColor, getChangeBg
} from '../utils/formatters'
import Badge from '../components/common/Badge'
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, Package } from 'lucide-react'

function SummaryCard({ title, value, sub, icon: Icon, color }) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
  }
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-0.5">{title}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Portfolio() {
  const { balance, portfolio, orders, stocks, portfolioHistory, sellOption, sellStock, exerciseOption, currentDate } = useStore()
  const [tab, setTab] = useState('stocks')
  const [orderFilter, setOrderFilter] = useState('all')
  const [actionMessage, setActionMessage] = useState(null)

  const stockPositions = portfolio.filter(p => p.type === 'stock')
  const optionPositions = portfolio.filter(p => p.type === 'option')

  const totalInvested = portfolio.reduce((sum, p) => sum + (p.marketValue || (p.type === 'stock' ? (p.currentPrice || p.avgPrice) * p.shares : (p.currentPremium || p.avgPremium) * 100 * p.contracts)), 0)
  const totalCost = portfolio.reduce((sum, p) => sum + (p.type === 'stock' ? p.avgPrice * p.shares : p.avgPremium * 100 * p.contracts), 0)
  const totalPnL = totalInvested - totalCost
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0
  const totalValue = balance + totalInvested

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'stocks') return o.type === 'stock'
    if (orderFilter === 'options') return o.type === 'option'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard title="Total Value" value={formatCurrency(totalValue)} sub="Cash + Positions" icon={DollarSign} color="blue" />
        <SummaryCard title="Cash Balance" value={formatCurrency(balance)} sub="Available to trade" icon={Briefcase} color="green" />
        <SummaryCard title="Invested" value={formatCurrency(totalInvested)} sub={`${stockPositions.length} positions`} icon={Package} color="purple" />
        <SummaryCard
          title="Total Return"
          value={`${totalPnL >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalPnL))}`}
          sub={`${formatPercent(totalPnLPct)}`}
          icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
          color={totalPnL >= 0 ? 'green' : 'orange'}
        />
      </div>

      {/* Chart */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Performance</h2>
          <span className="text-xs text-gray-500">30 days</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={portfolioHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
              formatter={v => [formatCurrency(v), 'Portfolio Value']}
              labelFormatter={v => formatShortDate(v)}
            />
            <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#pGradient)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Positions Tabs */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center gap-1 p-4 border-b border-gray-800">
          <h2 className="text-white font-semibold mr-4">Positions</h2>
          {['stocks', 'options'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                tab === t ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-blue-400/30' : 'bg-gray-700'}`}>
                {t === 'stocks' ? stockPositions.length : optionPositions.length}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {actionMessage && (
            <div className={`mx-4 my-3 px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
              actionMessage.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              <span>{actionMessage.text}</span>
              <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-white ml-2">✕</button>
            </div>
          )}

          {tab === 'stocks' ? (
            stockPositions.length === 0 ? (
              <div className="p-10 text-center">
                <Package className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No stock positions yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    {['Symbol', 'Shares', 'Avg Cost', 'Current Price', 'Market Value', 'P&L', 'P&L %', 'Action'].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {stockPositions.map(pos => {
                    const stock = stocks.find(s => s.symbol === pos.symbol)
                    const currentPrice = stock?.currentPrice || pos.currentPrice
                    const marketValue = currentPrice * pos.shares
                    const pnl = (currentPrice - pos.avgPrice) * pos.shares
                    const pnlPct = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100
                    return (
                      <tr key={pos.symbol} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-500/20 rounded-md flex items-center justify-center">
                              <span className="text-blue-400 text-xs font-bold">{pos.symbol[0]}</span>
                            </div>
                            <span className="font-bold text-white">{pos.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{pos.shares}</td>
                        <td className="py-3 px-4 text-gray-300">{formatCurrency(pos.avgPrice)}</td>
                        <td className="py-3 px-4 text-white font-medium">{formatCurrency(currentPrice)}</td>
                        <td className="py-3 px-4 text-white">{formatCurrency(marketValue)}</td>
                        <td className={`py-3 px-4 font-semibold ${getChangeColor(pnl)}`}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getChangeBg(pnlPct)}`}>
                            {formatPercent(pnlPct)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => sellStock(pos.symbol, pos.shares, currentPrice)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-semibold transition-all shadow-sm"
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : (
            optionPositions.length === 0 ? (
              <div className="p-10 text-center">
                <Activity className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No option positions yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    {['Symbol', 'Type', 'Strike', 'Expiry', 'Contracts', 'Avg Premium', 'Current', 'Status', 'P&L', 'P&L %', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {optionPositions.map(pos => {
                    const currentPremium = pos.currentPremium ?? pos.avgPremium
                    const pnl = pos.pnl ?? 0
                    const pnlPercent = pos.pnlPercent ?? 0
                    const isExpired = pos.isExpired || (new Date(pos.expiry) <= new Date(currentDate))
                    const canExercise = !isExpired || (pos.status === 'Expired ITM')
                    return (
                      <tr key={pos.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{pos.symbol}</td>
                        <td className="py-3 px-4">
                          <Badge variant={pos.optionType === 'call' ? 'call' : 'put'}>{pos.optionType.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-300">${pos.strike}</td>
                        <td className="py-3 px-4 text-gray-300">
                          {new Date(pos.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {pos.daysToExpiry !== undefined && (
                            <span className="block text-[11px] text-gray-500">
                              {pos.daysToExpiry === 0 ? 'Expires today' : `${pos.daysToExpiry}d left`}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-300">{pos.contracts}</td>
                        <td className="py-3 px-4 text-gray-300">{formatCurrency(pos.avgPremium)}</td>
                        <td className="py-3 px-4 text-white font-medium">{formatCurrency(currentPremium)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            pos.status === 'Active' ? 'success' :
                            pos.status === 'Expired ITM' ? 'call' : 'gray'
                          }>
                            {pos.status}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 font-semibold ${getChangeColor(pnl)}`}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getChangeBg(pnlPercent)}`}>
                            {formatPercent(pnlPercent)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                sellOption(pos.id, pos.contracts, currentPremium)
                                setActionMessage({ success: true, text: `Sold ${pos.contracts} contract(s) of ${pos.symbol} $${pos.strike} for ${formatCurrency(currentPremium * 100 * pos.contracts)}` })
                              }}
                              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-semibold transition-all shadow-sm"
                              title="Sell contract back to market at current value"
                            >
                              Sell to Close
                            </button>
                            {canExercise && (
                              <button
                                onClick={() => {
                                  const res = exerciseOption(pos.id)
                                  if (res.success) {
                                    setActionMessage({ success: true, text: `Successfully exercised ${pos.symbol} $${pos.strike} ${pos.optionType.toUpperCase()}!` })
                                  } else {
                                    setActionMessage({ success: false, text: res.error || 'Failed to exercise' })
                                  }
                                }}
                                className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                title={pos.optionType === 'call' ? `Exercise: Buy 100 shares at $${pos.strike}` : `Exercise: Sell 100 shares at $${pos.strike}`}
                              >
                                Exercise
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center gap-4 p-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Trade History</h2>
          <div className="flex gap-1">
            {['all', 'stocks', 'options'].map(f => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  orderFilter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No trades yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  {['Date', 'Symbol', 'Type', 'Action', 'Qty', 'Price', 'Total', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' '}{new Date(o.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{o.symbol}</td>
                    <td className="py-3 px-4">
                      <Badge variant={o.type === 'option' ? 'info' : 'default'}>
                        {o.type === 'option' ? (o.optionType?.toUpperCase() || 'OPT') : 'STK'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        o.action === 'BUY' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>{o.action}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {o.type === 'option' ? `${o.contracts}c` : o.shares}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{formatCurrency(o.price)}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success">{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
