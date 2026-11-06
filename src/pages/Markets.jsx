import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useStore from '../store/useStore'
import { formatCurrency, formatPercent, formatNumber, getChangeColor } from '../utils/formatters'
import { generateHistoricalData } from '../utils/marketSimulator'
import { Search, TrendingUp, TrendingDown, Eye, EyeOff, ArrowUpDown, Zap } from 'lucide-react'

function MiniChart({ symbol, positive }) {
  const data = useMemo(() => {
    const hist = generateHistoricalData(symbol, 20)
    return hist.slice(-15)
  }, [symbol])

  return (
    <ResponsiveContainer width={80} height={28}>
      <ComposedChart data={data}>
        <Line
          type="monotone"
          dataKey="close"
          stroke={positive ? '#22c55e' : '#ef4444'}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default function Markets() {
  const navigate = useNavigate()
  const { stocks, watchlist, addToWatchlist, removeFromWatchlist, setSelectedStock } = useStore()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('symbol')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedStock, setSelected] = useState(null)
  const [histData, setHistData] = useState([])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let arr = stocks.filter(s =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sector.toLowerCase().includes(search.toLowerCase())
    )

    arr.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (typeof va === 'string') va = va.toLowerCase(), vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return arr
  }, [stocks, search, sortKey, sortDir])

  const selectStock = (stock) => {
    setSelected(stock)
    const h = generateHistoricalData(stock.symbol, 90)
    setHistData(h.slice(-60))
  }

  const SortHeader = ({ label, k }) => (
    <th
      className="text-left pb-3 cursor-pointer select-none hover:text-white group"
      onClick={() => handleSort(k)}
    >
      <span className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-300">
        {label}
        <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
        {sortKey === k && <span className="text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  )

  return (
    <div className="flex gap-6 h-full">
      {/* Stock List */}
      <div className={`${selectedStock ? 'flex-1' : 'w-full'} bg-gray-900 rounded-xl border border-gray-800 flex flex-col`}>
        {/* Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white">Markets</h1>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search stocks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="border-b border-gray-800 px-5">
                <th className="pl-5 pb-3 text-left text-xs text-gray-500">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                    Symbol {sortKey === 'symbol' && <span className="text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <SortHeader label="Name" k="name" />
                <SortHeader label="Price" k="currentPrice" />
                <SortHeader label="Change" k="change" />
                <SortHeader label="Change %" k="changePercent" />
                <SortHeader label="Volume" k="volume" />
                <SortHeader label="Market Cap" k="marketCap" />
                <th className="pb-3 text-xs text-gray-500 text-center pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(stock => {
                const inWatchlist = watchlist.includes(stock.symbol)
                const isSelected = selectedStock?.symbol === stock.symbol
                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => selectStock(stock)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/10' : 'hover:bg-gray-800/50'}`}
                  >
                    <td className="py-3 pl-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-500/20 rounded-md flex items-center justify-center">
                          <span className="text-blue-400 text-xs font-bold">{stock.symbol[0]}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{stock.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-400 max-w-[160px] truncate">{stock.name}</td>
                    <td className="py-3 text-sm font-semibold text-white">{formatCurrency(stock.currentPrice)}</td>
                    <td className={`py-3 text-sm font-medium ${getChangeColor(stock.change)}`}>
                      {stock.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(stock.change))}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        stock.changePercent >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400">{formatNumber(stock.volume)}</td>
                    <td className="py-3 text-sm text-gray-400">{formatNumber(stock.marketCap)}</td>
                    <td className="py-3 pr-5">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            inWatchlist ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol)
                          }}
                          className="p-1.5 rounded-md text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                          title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                        >
                          {inWatchlist ? <Eye className="w-3.5 h-3.5 text-yellow-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedStock(stock.symbol)
                            navigate('/trading')
                          }}
                          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedStock && (
        <div className="w-96 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
          {/* Stock Header */}
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 font-bold">{selectedStock.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{selectedStock.symbol}</div>
                    <div className="text-xs text-gray-500">{selectedStock.name}</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mt-2">{formatCurrency(selectedStock.currentPrice)}</div>
                <div className={`flex items-center gap-1 mt-1 ${getChangeColor(selectedStock.changePercent)}`}>
                  {selectedStock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {selectedStock.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(selectedStock.change))}
                    ({formatPercent(selectedStock.changePercent)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={histData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#6b7280', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v.toFixed(0)}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Key Stats */}
          <div className="px-5 pb-5 space-y-3 flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-white">Key Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Prev Close', formatCurrency(selectedStock.previousClose)],
                ['Volume', formatNumber(selectedStock.volume)],
                ['Market Cap', formatNumber(selectedStock.marketCap)],
                ['Sector', selectedStock.sector],
                ['52W High', formatCurrency(selectedStock.basePrice * 1.35)],
                ['52W Low', formatCurrency(selectedStock.basePrice * 0.65)],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-sm font-semibold text-white truncate">{val}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedStock(selectedStock.symbol)
                navigate('/trading')
              }}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Trade {selectedStock.symbol}
            </button>
            <button
              onClick={() => {
                setSelectedStock(selectedStock.symbol)
                navigate('/options')
              }}
              className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium rounded-lg transition-colors border border-purple-500/30"
            >
              View Options Chain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
