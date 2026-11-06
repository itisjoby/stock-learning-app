import { create } from 'zustand'
import { initializePrices, updatePrices as simUpdatePrices } from '../utils/marketSimulator'
import { blackScholes } from '../utils/blackScholes'

const initialStocks = initializePrices()

const useStore = create((set, get) => ({
  balance: 100000,
  stocks: initialStocks,
  portfolio: [],
  orders: [],
  watchlist: ['AAPL', 'TSLA', 'NVDA', 'AMZN'],
  selectedStock: 'AAPL',
  portfolioHistory: generatePortfolioHistory(100000),

  // Actions
  updatePrices: () => {
    set(state => {
      const updatedStocks = simUpdatePrices(state.stocks)
      
      // Update portfolio positions with new prices
      const updatedPortfolio = state.portfolio.map(pos => {
        if (pos.type === 'stock') {
          const stock = updatedStocks.find(s => s.symbol === pos.symbol)
          if (!stock) return pos
          const currentPrice = stock.currentPrice
          const marketValue = currentPrice * pos.shares
          const pnl = (currentPrice - pos.avgPrice) * pos.shares
          const pnlPercent = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100
          return { ...pos, currentPrice, marketValue, pnl, pnlPercent }
        } else if (pos.type === 'option') {
          const stock = updatedStocks.find(s => s.symbol === pos.symbol)
          if (!stock) return pos
          const expiryDate = new Date(pos.expiry)
          const now = new Date()
          const diffDays = Math.max(1, (expiryDate - now) / (1000 * 60 * 60 * 24))
          const T = diffDays / 365
          const newPremium = blackScholes(stock.currentPrice, pos.strike, T, 0.05, 0.35, pos.optionType)
          const currentPremium = Math.max(0.01, parseFloat(newPremium.toFixed(2)))
          const marketValue = currentPremium * 100 * pos.contracts
          const costBasis = pos.avgPremium * 100 * pos.contracts
          const pnl = marketValue - costBasis
          const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0
          return { ...pos, currentPremium, marketValue, pnl, pnlPercent }
        }
        return pos
      })

      const totalInvested = updatedPortfolio
        .filter(p => p.type === 'stock')
        .reduce((sum, p) => sum + p.marketValue, 0)
      const totalValue = state.balance + totalInvested

      return { stocks: updatedStocks, portfolio: updatedPortfolio }
    })
  },

  buyStock: (symbol, shares, price) => {
    const cost = shares * price
    const state = get()
    if (state.balance < cost) return { success: false, error: 'Insufficient balance' }

    const existing = state.portfolio.find(p => p.symbol === symbol && p.type === 'stock')
    let newPortfolio

    if (existing) {
      const totalShares = existing.shares + shares
      const avgPrice = (existing.avgPrice * existing.shares + price * shares) / totalShares
      newPortfolio = state.portfolio.map(p =>
        p.symbol === symbol && p.type === 'stock'
          ? { ...p, shares: totalShares, avgPrice, marketValue: totalShares * price, pnl: (price - avgPrice) * totalShares }
          : p
      )
    } else {
      newPortfolio = [...state.portfolio, {
        id: Date.now().toString(),
        symbol,
        shares,
        avgPrice: price,
        currentPrice: price,
        marketValue: shares * price,
        pnl: 0,
        pnlPercent: 0,
        type: 'stock',
        buyDate: new Date().toISOString(),
      }]
    }

    const order = {
      id: Date.now().toString(),
      symbol,
      type: 'stock',
      action: 'BUY',
      shares,
      price,
      total: cost,
      date: new Date().toISOString(),
      status: 'FILLED',
    }

    set({
      balance: state.balance - cost,
      portfolio: newPortfolio,
      orders: [order, ...state.orders],
    })
    return { success: true }
  },

  sellStock: (symbol, shares, price) => {
    const state = get()
    const existing = state.portfolio.find(p => p.symbol === symbol && p.type === 'stock')
    if (!existing) return { success: false, error: 'No position found' }
    if (existing.shares < shares) return { success: false, error: 'Not enough shares' }

    const proceeds = shares * price
    let newPortfolio

    if (existing.shares === shares) {
      newPortfolio = state.portfolio.filter(p => !(p.symbol === symbol && p.type === 'stock'))
    } else {
      newPortfolio = state.portfolio.map(p =>
        p.symbol === symbol && p.type === 'stock'
          ? { ...p, shares: p.shares - shares, marketValue: (p.shares - shares) * price }
          : p
      )
    }

    const order = {
      id: Date.now().toString(),
      symbol,
      type: 'stock',
      action: 'SELL',
      shares,
      price,
      total: proceeds,
      date: new Date().toISOString(),
      status: 'FILLED',
    }

    set({
      balance: state.balance + proceeds,
      portfolio: newPortfolio,
      orders: [order, ...state.orders],
    })
    return { success: true }
  },

  buyOption: (symbol, strike, expiry, optionType, contracts, premium) => {
    const cost = premium * 100 * contracts
    const state = get()
    if (state.balance < cost) return { success: false, error: 'Insufficient balance' }

    const optionId = `${symbol}-${optionType}-${strike}-${expiry}`
    const existing = state.portfolio.find(p => p.id === optionId && p.type === 'option')
    let newPortfolio

    if (existing) {
      const totalContracts = existing.contracts + contracts
      const avgPremium = (existing.avgPremium * existing.contracts + premium * contracts) / totalContracts
      newPortfolio = state.portfolio.map(p =>
        p.id === optionId ? { ...p, contracts: totalContracts, avgPremium } : p
      )
    } else {
      newPortfolio = [...state.portfolio, {
        id: optionId,
        symbol,
        strike,
        expiry,
        optionType,
        contracts,
        avgPremium: premium,
        currentPremium: premium,
        pnl: 0,
        type: 'option',
        status: 'Active',
        buyDate: new Date().toISOString(),
      }]
    }

    const order = {
      id: Date.now().toString(),
      symbol,
      type: 'option',
      action: 'BUY',
      optionType,
      strike,
      expiry,
      contracts,
      price: premium,
      total: cost,
      date: new Date().toISOString(),
      status: 'FILLED',
    }

    set({
      balance: state.balance - cost,
      portfolio: newPortfolio,
      orders: [order, ...state.orders],
    })
    return { success: true }
  },

  sellOption: (optionId, contracts, premium) => {
    const state = get()
    const existing = state.portfolio.find(p => p.id === optionId)
    if (!existing) return { success: false, error: 'Option position not found' }
    if (existing.contracts < contracts) return { success: false, error: 'Not enough contracts' }

    const proceeds = premium * 100 * contracts
    let newPortfolio

    if (existing.contracts === contracts) {
      newPortfolio = state.portfolio.filter(p => p.id !== optionId)
    } else {
      newPortfolio = state.portfolio.map(p =>
        p.id === optionId ? { ...p, contracts: p.contracts - contracts } : p
      )
    }

    const order = {
      id: Date.now().toString(),
      symbol: existing.symbol,
      type: 'option',
      action: 'SELL',
      optionType: existing.optionType,
      strike: existing.strike,
      expiry: existing.expiry,
      contracts,
      price: premium,
      total: proceeds,
      date: new Date().toISOString(),
      status: 'FILLED',
    }

    set({
      balance: state.balance + proceeds,
      portfolio: newPortfolio,
      orders: [order, ...state.orders],
    })
    return { success: true }
  },

  addToWatchlist: (symbol) => {
    set(state => ({
      watchlist: state.watchlist.includes(symbol) ? state.watchlist : [...state.watchlist, symbol],
    }))
  },

  removeFromWatchlist: (symbol) => {
    set(state => ({
      watchlist: state.watchlist.filter(s => s !== symbol),
    }))
  },

  setSelectedStock: (symbol) => {
    set({ selectedStock: symbol })
  },
}))

function generatePortfolioHistory(initialValue) {
  const history = []
  let value = initialValue
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue
    const change = (Math.random() - 0.47) * 0.015
    value = value * (1 + change)
    history.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(value.toFixed(2)),
    })
  }
  return history
}

export default useStore
