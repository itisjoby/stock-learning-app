import { useState, useMemo, useEffect } from 'react'
import useStore from '../store/useStore'
import { formatCurrency, formatPercent, getChangeColor } from '../utils/formatters'
import { generateOptionsChain, getExpiryDates, generatePayoffData, blackScholes } from '../utils/blackScholes'
import PayoffDiagram from '../components/charts/PayoffDiagram'
import Modal from '../components/common/Modal'
import Badge from '../components/common/Badge'
import Tooltip from '../components/common/Tooltip'
import { ChevronDown, ChevronUp, Info, CheckCircle, AlertCircle } from 'lucide-react'

const GREEK_INFO = {
  delta: 'Delta measures how much the option price changes for a $1 move in the stock. Delta 0.5 means the option gains $0.50 for every $1 the stock rises.',
  gamma: 'Gamma measures the rate of change in delta. High gamma means delta changes quickly, common near expiry.',
  theta: 'Theta is time decay — how much the option loses each day. Options lose value daily even if the stock doesn\'t move.',
  vega: 'Vega measures sensitivity to implied volatility. Options gain value when IV rises (even without stock movement).',
}

function GreekCard({ name, value, description }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <Tooltip content={description}>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{name}</span>
        </Tooltip>
      </div>
      <div className="text-lg font-bold text-white">{typeof value === 'number' ? value.toFixed(4) : value}</div>
    </div>
  )
}

function EducationCard({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-700 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

export default function OptionsCenter() {
  const { stocks, selectedStock: storeSelected, setSelectedStock, buyOption, balance } = useStore()
  const [symbol, setSymbol] = useState(storeSelected || 'AAPL')
  const [selectedExpiry, setSelectedExpiry] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [contracts, setContracts] = useState(1)
  const [side, setSide] = useState('BUY')
  const [modalOpen, setModalOpen] = useState(false)
  const [result, setResult] = useState(null)
  const [ivOverride, setIVOverride] = useState(null)
  const [scenarioPrice, setScenarioPrice] = useState('')

  const stock = stocks.find(s => s.symbol === symbol)
  const expiryDates = useMemo(() => getExpiryDates(), [])

  useEffect(() => {
    if (storeSelected) setSymbol(storeSelected)
  }, [storeSelected])

  const chain = useMemo(() => {
    if (!stock) return {}
    const iv = ivOverride ?? stock.iv ?? 0.3
    return generateOptionsChain(stock.currentPrice, iv, expiryDates)
  }, [stock, expiryDates, ivOverride])

  const currentChain = chain[expiryDates[selectedExpiry]] || []
  const S = stock?.currentPrice || 0

  const payoffResult = useMemo(() => {
    if (!selectedOption) return null
    const premium = selectedOption.type === 'call' ? selectedOption.call.last : selectedOption.put.last
    return generatePayoffData(S, selectedOption.strike, premium, selectedOption.type, contracts)
  }, [selectedOption, S, contracts])

  const scenarioPnL = useMemo(() => {
    if (!selectedOption || !scenarioPrice) return null
    const targetPrice = parseFloat(scenarioPrice)
    if (isNaN(targetPrice)) return null
    const premium = selectedOption.type === 'call' ? selectedOption.call.last : selectedOption.put.last
    const intrinsic = selectedOption.type === 'call'
      ? Math.max(0, targetPrice - selectedOption.strike)
      : Math.max(0, selectedOption.strike - targetPrice)
    return (intrinsic - premium) * 100 * contracts
  }, [selectedOption, scenarioPrice, contracts])

  const handleBuy = () => setModalOpen(true)

  const handleConfirm = () => {
    if (!selectedOption || !stock) return
    const opt = selectedOption.type === 'call' ? selectedOption.call : selectedOption.put
    const res = buyOption(
      symbol,
      selectedOption.strike,
      selectedOption.expiry,
      selectedOption.type,
      contracts,
      opt.ask
    )
    setResult(res)
    setModalOpen(false)
  }

  if (!stock) return <div className="text-gray-400">Loading...</div>

  const selectedOptData = selectedOption
    ? (selectedOption.type === 'call' ? selectedOption.call : selectedOption.put)
    : null

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Left Panel */}
        <div className="w-56 flex-shrink-0 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-3">Stock</h3>
            <select
              value={symbol}
              onChange={e => { setSymbol(e.target.value); setSelectedStock(e.target.value); setSelectedOption(null) }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {stocks.map(s => (
                <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
              ))}
            </select>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{formatCurrency(S)}</div>
              <div className={`text-xs ${getChangeColor(stock.changePercent)}`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400">Implied Volatility</label>
              <span className="text-xs text-blue-400">{((ivOverride ?? stock.iv ?? 0.3) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={Math.round((ivOverride ?? stock.iv ?? 0.3) * 100)}
              onChange={e => setIVOverride(parseInt(e.target.value) / 100)}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>10%</span><span>100%</span>
            </div>
          </div>

          {/* Expiry Selector */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-2">Expiry</h3>
            {expiryDates.map((d, i) => (
              <button
                key={d}
                onClick={() => setSelectedExpiry(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  selectedExpiry === i ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="text-xs text-gray-600 block">{[30, 60, 90][i]} DTE</span>
              </button>
            ))}
          </div>
        </div>

        {/* Options Chain */}
        <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">Options Chain — {symbol}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Expiry: {expiryDates[selectedExpiry]} • Click any row to analyze
            </p>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900 z-10 border-b border-gray-700">
                <tr>
                  {/* Calls */}
                  <th className="text-green-400 py-2 px-2 text-left bg-green-500/5" colSpan={5}>CALLS</th>
                  <th className="py-2 px-4 text-center text-white font-bold bg-blue-500/10">STRIKE</th>
                  {/* Puts */}
                  <th className="text-red-400 py-2 px-2 text-right bg-red-500/5" colSpan={5}>PUTS</th>
                </tr>
                <tr className="text-gray-500">
                  <th className="py-1.5 px-2 text-left bg-green-500/5">Bid</th>
                  <th className="py-1.5 px-2 text-left bg-green-500/5">Ask</th>
                  <th className="py-1.5 px-2 text-left bg-green-500/5">IV</th>
                  <th className="py-1.5 px-2 text-left bg-green-500/5">Δ</th>
                  <th className="py-1.5 px-2 text-left bg-green-500/5">OI</th>
                  <th className="py-1.5 px-4 text-center bg-blue-500/10 text-white">Strike</th>
                  <th className="py-1.5 px-2 text-right bg-red-500/5">Bid</th>
                  <th className="py-1.5 px-2 text-right bg-red-500/5">Ask</th>
                  <th className="py-1.5 px-2 text-right bg-red-500/5">IV</th>
                  <th className="py-1.5 px-2 text-right bg-red-500/5">Δ</th>
                  <th className="py-1.5 px-2 text-right bg-red-500/5">OI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {currentChain.map(row => {
                  const isCallITM = row.call.itm
                  const isPutITM = row.put.itm
                  const isATM = Math.abs(row.strike - S) < (S * 0.025)
                  const isCallSelected = selectedOption?.strike === row.strike && selectedOption?.type === 'call'
                  const isPutSelected = selectedOption?.strike === row.strike && selectedOption?.type === 'put'

                  return (
                    <tr key={row.strike} className={isATM ? 'ring-1 ring-blue-500/50' : ''}>
                      {/* Call side */}
                      <td
                        colSpan={5}
                        className={`cursor-pointer transition-colors ${
                          isCallSelected ? 'bg-green-500/20' :
                          isCallITM ? 'bg-green-500/8 hover:bg-green-500/15' : 'hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedOption({ strike: row.strike, expiry: row.expiry, type: 'call', call: row.call, put: row.put })}
                      >
                        <div className="flex">
                          <span className="px-2 py-2 text-green-300">{row.call.bid.toFixed(2)}</span>
                          <span className="px-2 py-2 text-green-400 font-medium">{row.call.ask.toFixed(2)}</span>
                          <span className="px-2 py-2 text-gray-500">{(row.call.iv * 100).toFixed(0)}%</span>
                          <span className="px-2 py-2 text-blue-400">{row.call.delta.toFixed(2)}</span>
                          <span className="px-2 py-2 text-gray-500">{(row.call.oi / 1000).toFixed(1)}k</span>
                        </div>
                      </td>

                      {/* Strike */}
                      <td className={`py-2 px-4 text-center font-bold bg-blue-500/10 ${isATM ? 'text-blue-400' : 'text-white'}`}>
                        {row.strike}
                        {isATM && <span className="block text-xs text-blue-400 font-normal">ATM</span>}
                      </td>

                      {/* Put side */}
                      <td
                        colSpan={5}
                        className={`cursor-pointer transition-colors ${
                          isPutSelected ? 'bg-red-500/20' :
                          isPutITM ? 'bg-red-500/8 hover:bg-red-500/15' : 'hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedOption({ strike: row.strike, expiry: row.expiry, type: 'put', call: row.call, put: row.put })}
                      >
                        <div className="flex justify-end">
                          <span className="px-2 py-2 text-gray-500">{(row.put.oi / 1000).toFixed(1)}k</span>
                          <span className="px-2 py-2 text-blue-400">{row.put.delta.toFixed(2)}</span>
                          <span className="px-2 py-2 text-gray-500">{(row.put.iv * 100).toFixed(0)}%</span>
                          <span className="px-2 py-2 text-red-400 font-medium">{row.put.ask.toFixed(2)}</span>
                          <span className="px-2 py-2 text-red-300">{row.put.bid.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Option Detail */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {selectedOption && selectedOptData ? (
            <>
              {/* Option Info */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={selectedOption.type === 'call' ? 'call' : 'put'}>
                    {selectedOption.type.toUpperCase()}
                  </Badge>
                  <span className="text-white font-bold">{symbol}</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Strike</span>
                    <span className="text-white font-semibold">${selectedOption.strike}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expiry</span>
                    <span className="text-white">{new Date(selectedOption.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Premium</span>
                    <span className="text-green-400 font-bold">{formatCurrency(selectedOptData.ask)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Cost per contract</span>
                    <span className="text-gray-400">{formatCurrency(selectedOptData.ask * 100)}</span>
                  </div>
                </div>
              </div>

              {/* Greeks */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-400 mb-3">Greeks</h3>
                <div className="grid grid-cols-2 gap-2">
                  <GreekCard name="Delta" value={selectedOptData.delta} description={GREEK_INFO.delta} />
                  <GreekCard name="Gamma" value={selectedOptData.gamma} description={GREEK_INFO.gamma} />
                  <GreekCard name="Theta" value={selectedOptData.theta} description={GREEK_INFO.theta} />
                  <GreekCard name="Vega" value={selectedOptData.vega} description={GREEK_INFO.vega} />
                </div>
              </div>

              {/* P&L Calculator */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-400 mb-3">P&L Calculator</h3>
                <div className="mb-2">
                  <label className="text-xs text-gray-500 block mb-1">If stock goes to...</label>
                  <input
                    type="number"
                    step="1"
                    placeholder={`Current: $${S.toFixed(0)}`}
                    value={scenarioPrice}
                    onChange={e => setScenarioPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {scenarioPnL !== null && (
                  <div className={`p-3 rounded-lg text-sm font-semibold text-center ${
                    scenarioPnL >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    P&L: {scenarioPnL >= 0 ? '+' : ''}{formatCurrency(scenarioPnL)}
                  </div>
                )}
              </div>

              {/* Payoff Diagram */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Payoff at Expiry</h3>
                {payoffResult && (
                  <PayoffDiagram data={payoffResult.data} breakeven={payoffResult.breakeven} height={160} />
                )}
                <div className="text-xs text-gray-500 text-center mt-1">
                  Breakeven: <span className="text-yellow-400">{formatCurrency(payoffResult?.breakeven)}</span>
                </div>
              </div>

              {/* Buy/Sell */}
              {result && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {result.success ? 'Order placed!' : result.error}
                </div>
              )}

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contracts</label>
                  <input
                    type="number"
                    min={1}
                    value={contracts}
                    onChange={e => setContracts(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Total cost: {formatCurrency(selectedOptData.ask * 100 * contracts)}
                  </div>
                </div>
                <button
                  onClick={handleBuy}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  BUY {contracts} Contract{contracts > 1 ? 's' : ''}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
              <div className="text-gray-600 text-4xl mb-3">📊</div>
              <p className="text-gray-500 text-sm">Click any option in the chain to analyze it</p>
            </div>
          )}
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" /> Options Education
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <EducationCard title="📞 Calls vs Puts" defaultOpen>
            <p className="mb-2"><strong className="text-green-400">Call Option:</strong> Gives you the right (not obligation) to BUY 100 shares at the strike price. Profit when stock rises.</p>
            <p><strong className="text-red-400">Put Option:</strong> Gives you the right to SELL 100 shares at the strike price. Profit when stock falls.</p>
          </EducationCard>

          <EducationCard title="🎯 Strike Price & Moneyness">
            <p className="mb-2"><strong className="text-green-400">ITM (In The Money):</strong> Call when stock &gt; strike. Put when stock &lt; strike. Has intrinsic value.</p>
            <p className="mb-2"><strong className="text-blue-400">ATM (At The Money):</strong> Strike ≈ current stock price. Highest time value.</p>
            <p><strong className="text-gray-400">OTM (Out of The Money):</strong> No intrinsic value — only time value. Cheaper but needs bigger move.</p>
          </EducationCard>

          <EducationCard title="⏰ Time Value & Expiration">
            <p className="mb-2">Option premium = <strong className="text-white">Intrinsic Value + Time Value</strong></p>
            <p className="mb-2">Time value decays as expiration approaches (Theta decay). The last 30 days see the fastest decay.</p>
            <p>Longer expiry = more expensive but more time for the trade to work.</p>
          </EducationCard>

          <EducationCard title="📈 Covered Call Strategy">
            <p className="mb-2"><strong>Setup:</strong> Own 100 shares + sell 1 OTM call against them.</p>
            <p className="mb-2"><strong>When to use:</strong> Neutral to slightly bullish. Collect premium income.</p>
            <p className="mb-2"><strong>Max profit:</strong> Premium received + stock appreciation to strike.</p>
            <p><strong>Risk:</strong> Stock falls — but you still own shares (offset by premium).</p>
          </EducationCard>

          <EducationCard title="🛡️ Bull Call Spread">
            <p className="mb-2"><strong>Setup:</strong> Buy lower strike call + Sell higher strike call (same expiry).</p>
            <p className="mb-2"><strong>When to use:</strong> Moderately bullish. Reduces cost vs buying a naked call.</p>
            <p className="mb-2"><strong>Max profit:</strong> (Width of strikes − debit paid) × 100</p>
            <p><strong>Max loss:</strong> Debit paid (what you paid for the spread).</p>
          </EducationCard>

          <EducationCard title="🦅 Iron Condor">
            <p className="mb-2"><strong>Setup:</strong> Sell OTM call + buy further OTM call + sell OTM put + buy further OTM put.</p>
            <p className="mb-2"><strong>When to use:</strong> Low volatility environment. Stock stays range-bound.</p>
            <p className="mb-2"><strong>Max profit:</strong> Net premium received. Collected if stock stays between short strikes.</p>
            <p><strong>Max loss:</strong> Width of either spread − net premium received.</p>
          </EducationCard>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Option Order">
        {selectedOption && selectedOptData && (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <div className="text-green-400 font-bold text-lg">
                BUY {contracts} Contract{contracts > 1 ? 's' : ''}
              </div>
              <div className="text-white mt-1">
                {symbol} {selectedOption.type.toUpperCase()} ${selectedOption.strike} — {selectedOption.expiry}
              </div>
              <div className="text-gray-400 text-sm mt-1">Premium: {formatCurrency(selectedOptData.ask)}/share</div>
              <div className="text-white font-bold text-xl mt-2">
                Total: {formatCurrency(selectedOptData.ask * 100 * contracts)}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">Cancel</button>
              <button onClick={handleConfirm} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg">Confirm Buy</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
