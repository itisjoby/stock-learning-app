import useStore from '../../store/useStore'
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export default function Header() {
  const { balance, portfolio, stocks } = useStore()

  const totalInvested = portfolio
    .filter(p => p.type === 'stock')
    .reduce((sum, p) => sum + (p.marketValue || 0), 0)

  const totalCost = portfolio
    .filter(p => p.type === 'stock')
    .reduce((sum, p) => sum + (p.avgPrice * p.shares), 0)

  const optionsCost = portfolio
    .filter(p => p.type === 'option')
    .reduce((sum, p) => sum + (p.avgPremium * 100 * p.contracts), 0)

  const totalValue = balance + totalInvested
  const totalPnL = totalInvested - totalCost
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div className="text-sm text-gray-400">
        <span className="text-gray-500">Paper Money — </span>
        <span className="text-white font-medium">Real Education</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Total Portfolio Value */}
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs text-gray-500">Portfolio Value</div>
            <div className="text-sm font-bold text-white">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-700" />

        {/* Cash Balance */}
        <div>
          <div className="text-xs text-gray-500">Cash</div>
          <div className="text-sm font-semibold text-white">{formatCurrency(balance)}</div>
        </div>

        <div className="w-px h-8 bg-gray-700" />

        {/* P&L */}
        <div>
          <div className="text-xs text-gray-500">Total P&L</div>
          <div className={`text-sm font-semibold flex items-center gap-1 ${getChangeColor(totalPnL)}`}>
            {totalPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatCurrency(Math.abs(totalPnL))}
            <span className="text-xs">({formatPercent(totalPnLPercent)})</span>
          </div>
        </div>
      </div>
    </header>
  )
}
