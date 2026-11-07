import { useState } from 'react'
import useStore from '../../store/useStore'
import { formatCurrency, formatPercent } from '../../utils/formatters'
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sliders,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
} from 'lucide-react'

export default function SimulationBar() {
  const {
    stocks,
    selectedStock,
    currentDate,
    isSimulationRunning,
    manualOverrideStocks,
    toggleSimulation,
    advanceTimeDays,
    resetTime,
    setStockPrice,
    nudgeStockPrice,
    releaseStockControl,
    releaseAllStockControl,
  } = useStore()

  const [expanded, setExpanded] = useState(false)
  const [targetSymbol, setTargetSymbol] = useState(selectedStock || 'AAPL')
  const [customPrice, setCustomPrice] = useState('')

  const activeStock = stocks.find(s => s.symbol === targetSymbol) || stocks[0]
  const isManuallyControlled = !!manualOverrideStocks[targetSymbol]

  const dateObj = new Date(currentDate)
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // How many days into the future compared to real today
  const realToday = new Date()
  const daysDiff = Math.round((dateObj - realToday) / (1000 * 60 * 60 * 24))

  const handleApplyCustomPrice = (e) => {
    e?.preventDefault()
    const val = parseFloat(customPrice)
    if (!isNaN(val) && val > 0) {
      setStockPrice(targetSymbol, val)
      setCustomPrice('')
    }
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-blue-950/40 border-b border-blue-900/30 px-6 py-2.5 text-xs text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Simulation Time & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Learning Simulator</span>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-1.5 bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-700/60">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-white">{formattedDate}</span>
            {daysDiff > 0 && (
              <span className="ml-1 bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded text-[10px] font-bold">
                +{daysDiff}d future
              </span>
            )}
          </div>

          {/* Fast forward time buttons */}
          <div className="flex items-center gap-1 bg-gray-800/60 p-0.5 rounded-md border border-gray-700/50">
            <span className="text-[11px] text-gray-400 px-1.5 font-medium flex items-center gap-1">
              <FastForward className="w-3 h-3 text-purple-400" /> Time Jump:
            </span>
            <button
              onClick={() => advanceTimeDays(1)}
              title="Skip 1 day"
              className="px-2 py-0.5 bg-gray-700/60 hover:bg-gray-700 text-gray-200 hover:text-white rounded text-[11px] font-medium transition-colors"
            >
              +1d
            </button>
            <button
              onClick={() => advanceTimeDays(7)}
              title="Skip 1 week"
              className="px-2 py-0.5 bg-gray-700/60 hover:bg-gray-700 text-gray-200 hover:text-white rounded text-[11px] font-medium transition-colors"
            >
              +7d
            </button>
            <button
              onClick={() => advanceTimeDays(30)}
              title="Skip 30 days to see option expiration results"
              className="px-2 py-0.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 hover:text-purple-100 border border-purple-500/30 rounded text-[11px] font-semibold transition-colors"
            >
              +30d (Expiry)
            </button>
            {daysDiff > 0 && (
              <button
                onClick={resetTime}
                title="Reset time to Today"
                className="px-1.5 py-0.5 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Pause / Play market ticks */}
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
              isSimulationRunning
                ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {isSimulationRunning ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Auto-Market: Running</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>Auto-Market: Paused</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Quick Price Control Dropdown / Button */}
        <div className="flex items-center gap-2">
          {/* Quick nudge for currently selected stock */}
          <div className="flex items-center gap-1 bg-gray-800/80 px-2 py-1 rounded-md border border-gray-700/60">
            <span className="font-bold text-white mr-1">{activeStock?.symbol}</span>
            <span className="text-gray-300 font-mono mr-1.5">{formatCurrency(activeStock?.currentPrice || 0)}</span>

            <button
              onClick={() => nudgeStockPrice(activeStock.symbol, 5)}
              className="px-1.5 py-0.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded text-[10px] font-bold flex items-center gap-0.5"
              title="Pump price +5%"
            >
              <TrendingUp className="w-2.5 h-2.5" /> +5%
            </button>
            <button
              onClick={() => nudgeStockPrice(activeStock.symbol, -5)}
              className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-[10px] font-bold flex items-center gap-0.5"
              title="Dump price -5%"
            >
              <TrendingDown className="w-2.5 h-2.5" /> -5%
            </button>
          </div>

          <button
            onClick={() => setExpanded(e => !e)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium border transition-colors ${
              expanded
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-gray-800 hover:bg-gray-750 text-gray-200 border-gray-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Price Controller</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Control Drawer */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Col 1: Select Stock & Status */}
          <div className="space-y-2">
            <label className="text-[11px] text-gray-400 block font-medium">Select Stock to Jack or Lower</label>
            <div className="flex gap-2">
              <select
                value={targetSymbol}
                onChange={(e) => setTargetSymbol(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {stocks.map(s => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name} (${s.currentPrice})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
              <span>Current: <strong className="text-white">{formatCurrency(activeStock?.currentPrice || 0)}</strong></span>
              <span>
                Status:{' '}
                {isManuallyControlled ? (
                  <span className="text-amber-400 font-semibold">User Overridden</span>
                ) : (
                  <span className="text-green-400 font-semibold">Automatic Sim</span>
                )}
              </span>
            </div>
          </div>

          {/* Col 2: Quick Jump & Custom Price */}
          <div className="space-y-2">
            <label className="text-[11px] text-gray-400 block font-medium">Quick Up / Down Price Movers</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => nudgeStockPrice(targetSymbol, 10)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded text-xs font-bold"
              >
                +10%
              </button>
              <button
                onClick={() => nudgeStockPrice(targetSymbol, 20)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded text-xs font-bold"
              >
                +20% 🚀
              </button>
              <button
                onClick={() => nudgeStockPrice(targetSymbol, -10)}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded text-xs font-bold"
              >
                -10%
              </button>
              <button
                onClick={() => nudgeStockPrice(targetSymbol, -20)}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded text-xs font-bold"
              >
                -20% 💥
              </button>
            </div>

            <form onSubmit={handleApplyCustomPrice} className="flex gap-1.5 pt-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder={`Set exact $ (e.g. 200)`}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-2.5 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition-colors"
              >
                Set
              </button>
            </form>
          </div>

          {/* Col 3: Hand Control Back to App */}
          <div className="space-y-2 flex flex-col justify-between">
            <div>
              <label className="text-[11px] text-gray-400 block font-medium">Hand Control Back to App</label>
              <p className="text-[11px] text-gray-400 leading-snug mt-1">
                Once you finish testing your price movement, release control so the automatic market continues running naturally from your new price level.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => releaseStockControl(targetSymbol)}
                disabled={!isManuallyControlled}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                  isManuallyControlled
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    : 'bg-gray-800/40 text-gray-600 border-gray-800 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                Resume {targetSymbol}
              </button>

              <button
                onClick={releaseAllStockControl}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md text-xs font-medium border border-gray-700 transition-colors"
                title="Release all stocks back to automatic market"
              >
                Resume All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
