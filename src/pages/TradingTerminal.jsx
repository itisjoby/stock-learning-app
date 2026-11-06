import { useState, useMemo, useEffect } from 'react'
import useStore from '../store/useStore'
import {
  formatCurrency, formatPercent, getChangeColor
} from '../utils/formatters'
import { generateHistoricalData } from '../utils/marketSimulator'
import CandlestickChart from '../components/charts/CandlestickChart'
import Modal from '../components/common/Modal'
import { ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'

function InfoBox({ title, content, expanded, onToggle }) {
  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
          <Info className="w-4 h-4" />
          {title}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 text-xs text-gray-400 leading-relaxed border-t border-blue-500/20 pt-2">
          {content}
        </div>
      )}
    </div>
  )
}

export default function TradingTerminal() {
  const { stocks, portfolio, selectedStock: storeSelected, setSelectedStock, buyStock, sellStock } = useStore()
  const [symbol, setSymbol] = useState(storeSelected || 'AAPL')
  const [orderType, setOrderType] = useState('Market')
  const [side, setSide] = useState('BUY')
  const [shares, setShares] = useState(1)
  const [limitPrice, setLimitPrice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [result, setResult] = useState(null)
  const [expandedInfo, setExpandedInfo] = useState(null)
  const [histData, setHistData] = useState([])

  const stock = stocks.find(s => s.symbol === symbol)

  useEffect(() => {
    if (storeSelected) setSymbol(storeSelected)
  }, [storeSelected])

  useEffect(() => {
    if (stock) {
      const h = generateHistoricalData(stock.symbol, 90)
      setHistData(h)
    }
  }, [symbol])

  const price = orderType === 'Market' ? (stock?.currentPrice || 0) : (parseFloat(limitPrice) || 0)
  const estimatedCost = shares * price
  const position = portfolio.find(p => p.symbol === symbol && p.type === 'stock')

  const handleSubmit = () => {
    if (!stock || shares <= 0 || price <= 0) return
    setModalOpen(true)
  }

  const handleConfirm = () => {
    let res
    if (side === 'BUY') {
      res = buyStock(symbol, parseInt(shares), price)
    } else {
      res = sellStock(symbol, parseInt(shares), price)
    }
    setResult(res)
    setModalOpen(false)
  }

  const infoBoxes = [
    {
      key: 'market',
      title: 'What is a Market Order?',
      content: 'A market order executes immediately at the current market price. It guarantees execution but not price. Best for liquid stocks when you need immediate execution.',
    },
    {
      key: 'limit',
      title: 'What is a Limit Order?',
      content: 'A limit order sets a maximum price (buy) or minimum price (sell). The order only executes if the market reaches your price. Gives price control but may not execute if the price never reaches your limit.',
    },
    {
      key: 'stop',
      title: 'What is a Stop Order?',
      content: 'A stop order becomes a market order when a trigger price is reached. Used as a stop-loss to limit losses. If you bought at $100, a stop at $90 sells automatically if the price drops to $90.',
    },
  ]

  if (!stock) return <div className="text-gray-400">Loading...</div>

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Chart + Stock Selector */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Stock Selector */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4 flex-wrap">
          {stocks.map(s => (
            <button
              key={s.symbol}
              onClick={() => { setSymbol(s.symbol); setSelectedStock(s.symbol) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                symbol === s.symbol
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {s.symbol}
            </button>
          ))}
        </div>

        {/* Price Header */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-2xl font-bold text-white">{stock.symbol}</span>
              <span className="text-gray-400 ml-2 text-sm">{stock.name}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{formatCurrency(stock.currentPrice)}</div>
              <div className={`text-sm flex items-center gap-1 justify-end ${getChangeColor(stock.changePercent)}`}>
                {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stock.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
              </div>
            </div>
          </div>

          {/* Chart */}
          <CandlestickChart data={histData} height={320} />
        </div>

        {/* Position */}
        {position && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Your Position in {symbol}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500">Shares</div>
                <div className="text-sm font-semibold text-white">{position.shares}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Cost</div>
                <div className="text-sm font-semibold text-white">{formatCurrency(position.avgPrice)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Market Value</div>
                <div className="text-sm font-semibold text-white">{formatCurrency(position.marketValue)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">P&L</div>
                <div className={`text-sm font-semibold ${getChangeColor(position.pnl)}`}>
                  {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Boxes */}
        <div className="space-y-2">
          {infoBoxes.map(box => (
            <InfoBox
              key={box.key}
              title={box.title}
              content={box.content}
              expanded={expandedInfo === box.key}
              onToggle={() => setExpandedInfo(expandedInfo === box.key ? null : box.key)}
            />
          ))}
        </div>
      </div>

      {/* Right: Order Panel */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex-1">
          <h2 className="text-white font-semibold mb-4">Place Order</h2>

          {/* Result message */}
          {result && (
            <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${result.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {result.success ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              {result.success ? 'Order filled successfully!' : result.error}
            </div>
          )}

          {/* Order Type */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Order Type</label>
            <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
              {['Market', 'Limit', 'Stop'].map(t => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    orderType === t ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Buy/Sell */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Side</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSide('BUY')}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  side === 'BUY' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide('SELL')}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  side === 'SELL' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Shares */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Shares</label>
            <input
              type="number"
              min="1"
              value={shares}
              onChange={e => setShares(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Price</label>
            {orderType === 'Market' ? (
              <div className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm">
                {formatCurrency(stock.currentPrice)} (Market)
              </div>
            ) : (
              <input
                type="number"
                step="0.01"
                placeholder={`Enter ${orderType === 'Limit' ? 'limit' : 'stop'} price`}
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Summary */}
          <div className="mb-5 p-3 bg-gray-800 rounded-lg space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Shares</span>
              <span className="text-white">{shares}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Price per share</span>
              <span className="text-white">{formatCurrency(price)}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-gray-700 pt-2">
              <span className="text-gray-400 font-medium">Estimated {side === 'BUY' ? 'Cost' : 'Proceeds'}</span>
              <span className={`font-bold ${side === 'BUY' ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(estimatedCost)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!stock || shares <= 0 || price <= 0}
            className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              side === 'BUY'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {side} {shares} {symbol}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-400 mb-3">Market Info</h3>
          <div className="space-y-2">
            {[
              ['Prev Close', formatCurrency(stock.previousClose)],
              ['Volume', stock.volume?.toLocaleString()],
              ['Market Cap', stock.marketCap >= 1e12 ? `$${(stock.marketCap / 1e12).toFixed(2)}T` : `$${(stock.marketCap / 1e9).toFixed(1)}B`],
              ['Sector', stock.sector],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-300">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Order">
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${side === 'BUY' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="text-center">
              <div className={`text-lg font-bold ${side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                {side} {shares} Shares of {symbol}
              </div>
              <div className="text-gray-400 text-sm mt-1">{orderType} Order • {formatCurrency(price)}/share</div>
              <div className="text-white font-bold text-xl mt-2">{formatCurrency(estimatedCost)}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-2 text-white text-sm font-semibold rounded-lg transition-colors ${
                side === 'BUY' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Confirm {side}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
