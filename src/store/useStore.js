import { create } from 'zustand'
import { initializePrices, updatePrices as simUpdatePrices } from '../utils/marketSimulator'
import { blackScholes } from '../utils/blackScholes'

const initialStocks = initializePrices()

// Helper to recalculate portfolio given stocks and simulated currentDate
function evaluatePortfolio(portfolio, stocks, currentDate) {
  const now = new Date(currentDate)
  return portfolio.map(pos => {
    if (pos.type === 'stock') {
      const stock = stocks.find(s => s.symbol === pos.symbol)
      if (!stock) return pos
      const currentPrice = stock.currentPrice
      const marketValue = currentPrice * pos.shares
      const pnl = (currentPrice - pos.avgPrice) * pos.shares
      const pnlPercent = pos.avgPrice > 0 ? ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100 : 0
      return { ...pos, currentPrice, marketValue, pnl, pnlPercent }
    } else if (pos.type === 'option') {
      const stock = stocks.find(s => s.symbol === pos.symbol)
      if (!stock) return pos
      const expiryDate = new Date(pos.expiry)
      const diffMs = expiryDate - now
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      const isExpired = diffDays <= 0
      const T = Math.max(0, diffDays) / 365

      let currentPremium = 0
      if (isExpired) {
        // At or past expiry: purely intrinsic value
        if (pos.optionType === 'call') {
          currentPremium = Math.max(0, stock.currentPrice - pos.strike)
        } else {
          currentPremium = Math.max(0, pos.strike - stock.currentPrice)
        }
      } else {
        const theoretical = blackScholes(stock.currentPrice, pos.strike, T, 0.05, 0.35, pos.optionType)
        currentPremium = Math.max(0.01, theoretical)
      }
      currentPremium = parseFloat(currentPremium.toFixed(2))

      const marketValue = currentPremium * 100 * pos.contracts
      const costBasis = pos.avgPremium * 100 * pos.contracts
      const pnl = marketValue - costBasis
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0
      const status = isExpired ? (currentPremium > 0 ? 'Expired ITM' : 'Expired Worthless') : 'Active'

      return {
        ...pos,
        currentPremium,
        marketValue,
        pnl,
        pnlPercent,
        status,
        daysToExpiry: Math.max(0, Math.ceil(diffDays)),
        isExpired,
      }
    }
    return pos
  })
}

const useStore = create((set, get) => ({
  balance: 100000,
  stocks: initialStocks,
  portfolio: [],
  orders: [],
  watchlist: ['AAPL', 'TSLA', 'NVDA', 'AMZN'],
  selectedStock: 'AAPL',
  portfolioHistory: generatePortfolioHistory(100000),

  // Simulation controls
  isSimulationRunning: true,
  simSpeed: 1, // 1x, 2x, 5x
  currentDate: new Date().toISOString(),
  manualOverrideStocks: {}, // { [symbol]: true } when user took control

  toggleSimulation: () => {
    set(state => ({ isSimulationRunning: !state.isSimulationRunning }))
  },

  setSimulationRunning: (running) => {
    set({ isSimulationRunning: !!running })
  },

  // Advance simulated time by N days
  advanceTimeDays: (days = 1) => {
    set(state => {
      const current = new Date(state.currentDate)
      current.setDate(current.getDate() + days)
      const newDateIso = current.toISOString()
      const updatedPortfolio = evaluatePortfolio(state.portfolio, state.stocks, newDateIso)
      return {
        currentDate: newDateIso,
        portfolio: updatedPortfolio,
      }
    })
  },

  // Reset simulated date back to real world now
  resetTime: () => {
    const nowIso = new Date().toISOString()
    set(state => ({
      currentDate: nowIso,
      portfolio: evaluatePortfolio(state.portfolio, state.stocks, nowIso),
    }))
  },

  // Control stock price manually: set exact price
  setStockPrice: (symbol, newPrice) => {
    const targetPrice = Math.max(0.01, parseFloat(parseFloat(newPrice).toFixed(2)))
    set(state => {
      const updatedStocks = state.stocks.map(s => {
        if (s.symbol !== symbol) return s
        const prevClose = s.previousClose || s.currentPrice
        const change = targetPrice - prevClose
        const changePercent = (change / prevClose) * 100
        return {
          ...s,
          currentPrice: targetPrice,
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
        }
      })
      const updatedPortfolio = evaluatePortfolio(state.portfolio, updatedStocks, state.currentDate)
      return {
        stocks: updatedStocks,
        portfolio: updatedPortfolio,
        manualOverrideStocks: { ...state.manualOverrideStocks, [symbol]: true },
      }
    })
  },

  // Nudge stock price up or down by percentage (+5%, -5%, +10%, etc.) or dollar amount
  nudgeStockPrice: (symbol, deltaPercent) => {
    set(state => {
      const stock = state.stocks.find(s => s.symbol === symbol)
      if (!stock) return {}
      const targetPrice = Math.max(0.01, stock.currentPrice * (1 + deltaPercent / 100))
      return get().setStockPrice(symbol, targetPrice)
    })
  },

  // Release manual control back to the automatic market simulator
  releaseStockControl: (symbol) => {
    set(state => {
      const nextOverrides = { ...state.manualOverrideStocks }
      delete nextOverrides[symbol]
      return { manualOverrideStocks: nextOverrides }
    })
  },

  releaseAllStockControl: () => {
    set({ manualOverrideStocks: {} })
  },

  // Periodic price updater
  updatePrices: () => {
    const state = get()
    if (!state.isSimulationRunning) return

    const updatedStocks = simUpdatePrices(state.stocks).map(stock => {
      // If user holds manual override on this symbol, preserve user-set price
      if (state.manualOverrideStocks[stock.symbol]) {
        const existing = state.stocks.find(s => s.symbol === stock.symbol)
        return existing || stock
      }
      return stock
    })

    const updatedPortfolio = evaluatePortfolio(state.portfolio, updatedStocks, state.currentDate)
    set({ stocks: updatedStocks, portfolio: updatedPortfolio })
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
          ? { ...p, shares: totalShares, avgPrice, marketValue: totalShares * price, pnl: (price - avgPrice) * totalShares, pnlPercent: ((price - avgPrice) / avgPrice) * 100 }
          : p
      )
    } else {
      newPortfolio = [...state.portfolio, {
        id: Date.now().toString(),
        symbol,
        shares,
        avgPrice: price,
        currentPrice: price,
        marketValue: cost,
        pnl: 0,
        pnlPercent: 0,
        type: 'stock',
        buyDate: state.currentDate,
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
      date: state.currentDate,
      status: 'FILLED',
    }

    set({
      balance: state.balance - cost,
      portfolio: evaluatePortfolio(newPortfolio, state.stocks, state.currentDate),
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
      date: state.currentDate,
      status: 'FILLED',
    }

    set({
      balance: state.balance + proceeds,
      portfolio: evaluatePortfolio(newPortfolio, state.stocks, state.currentDate),
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
        marketValue: cost,
        pnl: 0,
        pnlPercent: 0,
        type: 'option',
        status: 'Active',
        buyDate: state.currentDate,
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
      date: state.currentDate,
      status: 'FILLED',
    }

    const updatedPortfolio = evaluatePortfolio(newPortfolio, state.stocks, state.currentDate)

    set({
      balance: state.balance - cost,
      portfolio: updatedPortfolio,
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
      date: state.currentDate,
      status: 'FILLED',
    }

    set({
      balance: state.balance + proceeds,
      portfolio: evaluatePortfolio(newPortfolio, state.stocks, state.currentDate),
      orders: [order, ...state.orders],
    })
    return { success: true }
  },

  // Exercise an option contract (buy or sell 100 shares at strike)
  exerciseOption: (optionId) => {
    const state = get()
    const existing = state.portfolio.find(p => p.id === optionId && p.type === 'option')
    if (!existing) return { success: false, error: 'Option not found' }

    const stock = state.stocks.find(s => s.symbol === existing.symbol)
    if (!stock) return { success: false, error: 'Stock not found' }

    const sharesToTrade = existing.contracts * 100

    if (existing.optionType === 'call') {
      const exerciseCost = existing.strike * sharesToTrade
      if (state.balance < exerciseCost) {
        return { success: false, error: `Need $${exerciseCost.toLocaleString()} to buy ${sharesToTrade} shares at $${existing.strike}` }
      }
      // Remove option position
      const newPortfolioWithoutOpt = state.portfolio.filter(p => p.id !== optionId)
      // Add stock position
      const existingStock = newPortfolioWithoutOpt.find(p => p.symbol === existing.symbol && p.type === 'stock')
      let newPortfolio
      if (existingStock) {
        const totalShares = existingStock.shares + sharesToTrade
        const avgPrice = (existingStock.avgPrice * existingStock.shares + existing.strike * sharesToTrade) / totalShares
        newPortfolio = newPortfolioWithoutOpt.map(p =>
          p.symbol === existing.symbol && p.type === 'stock'
            ? { ...p, shares: totalShares, avgPrice }
            : p
        )
      } else {
        newPortfolio = [...newPortfolioWithoutOpt, {
          id: Date.now().toString(),
          symbol: existing.symbol,
          shares: sharesToTrade,
          avgPrice: existing.strike,
          currentPrice: stock.currentPrice,
          marketValue: stock.currentPrice * sharesToTrade,
          pnl: (stock.currentPrice - existing.strike) * sharesToTrade,
          pnlPercent: ((stock.currentPrice - existing.strike) / existing.strike) * 100,
          type: 'stock',
          buyDate: state.currentDate,
        }]
      }

      const order = {
        id: Date.now().toString(),
        symbol: existing.symbol,
        type: 'option',
        action: 'EXERCISE',
        optionType: 'call',
        strike: existing.strike,
        expiry: existing.expiry,
        contracts: existing.contracts,
        price: existing.strike,
        total: exerciseCost,
        date: state.currentDate,
        status: 'EXERCISED',
      }

      set({
        balance: state.balance - exerciseCost,
        portfolio: evaluatePortfolio(newPortfolio, state.stocks, state.currentDate),
        orders: [order, ...state.orders],
      })
      return { success: true }
    } else {
      // Put exercise: sell 100 shares at strike
      const existingStock = state.portfolio.find(p => p.symbol === existing.symbol && p.type === 'stock')
      if (!existingStock || existingStock.shares < sharesToTrade) {
        return { success: false, error: `You need ${sharesToTrade} shares of ${existing.symbol} in portfolio to exercise a Put` }
      }
      const proceeds = existing.strike * sharesToTrade
      let newPortfolio = state.portfolio.filter(p => p.id !== optionId)
      if (existingStock.shares === sharesToTrade) {
        newPortfolio = newPortfolio.filter(p => !(p.symbol === existing.symbol && p.type === 'stock'))
      } else {
        newPortfolio = newPortfolio.map(p =>
          p.symbol === existing.symbol && p.type === 'stock'
            ? { ...p, shares: p.shares - sharesToTrade }
            : p
        )
      }

      const order = {
        id: Date.now().toString(),
        symbol: existing.symbol,
        type: 'option',
        action: 'EXERCISE',
        optionType: 'put',
        strike: existing.strike,
        expiry: existing.expiry,
        contracts: existing.contracts,
        price: existing.strike,
        total: proceeds,
        date: state.currentDate,
        status: 'EXERCISED',
      }

      set({
        balance: state.balance + proceeds,
        portfolio: evaluatePortfolio(newPortfolio, state.stocks, state.currentDate),
        orders: [order, ...state.orders],
      })
      return { success: true }
    }
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
