// Black-Scholes Option Pricing Model

// Cumulative Normal Distribution using Hart's approximation
function cnd(x) {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1.0 + sign * y)
}

// Standard normal PDF
function pdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

/**
 * Black-Scholes option pricing
 * @param {number} S - Current stock price
 * @param {number} K - Strike price
 * @param {number} T - Time to expiry in years
 * @param {number} r - Risk-free rate (e.g. 0.05)
 * @param {number} sigma - Implied volatility (e.g. 0.3)
 * @param {string} type - 'call' or 'put'
 * @returns {number} Option price
 */
export function blackScholes(S, K, T, r, sigma, type) {
  if (T <= 0) {
    if (type === 'call') return Math.max(0, S - K)
    return Math.max(0, K - S)
  }

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)

  if (type === 'call') {
    return S * cnd(d1) - K * Math.exp(-r * T) * cnd(d2)
  } else {
    return K * Math.exp(-r * T) * cnd(-d2) - S * cnd(-d1)
  }
}

/**
 * Calculate all Greeks for an option
 * @param {number} S - Current stock price
 * @param {number} K - Strike price
 * @param {number} T - Time to expiry in years
 * @param {number} r - Risk-free rate
 * @param {number} sigma - Implied volatility
 * @param {string} type - 'call' or 'put'
 * @returns {object} Greeks: delta, gamma, theta, vega, rho
 */
export function calculateGreeks(S, K, T, r, sigma, type) {
  if (T <= 0) {
    return { delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0, price: blackScholes(S, K, T, r, sigma, type) }
  }

  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const nd1 = pdf(d1)
  const price = blackScholes(S, K, T, r, sigma, type)

  // Delta
  const delta = type === 'call' ? cnd(d1) : cnd(d1) - 1

  // Gamma (same for calls and puts)
  const gamma = nd1 / (S * sigma * sqrtT)

  // Theta (per day, divide annual by 365)
  const thetaCall = (-(S * nd1 * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * cnd(d2)) / 365
  const thetaPut = (-(S * nd1 * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * T) * cnd(-d2)) / 365
  const theta = type === 'call' ? thetaCall : thetaPut

  // Vega (per 1% change in IV)
  const vega = (S * nd1 * sqrtT) / 100

  // Rho (per 1% change in rate)
  const rhoCCall = K * T * Math.exp(-r * T) * cnd(d2) / 100
  const rhoPut = -K * T * Math.exp(-r * T) * cnd(-d2) / 100
  const rho = type === 'call' ? rhoCCall : rhoPut

  return {
    price: parseFloat(price.toFixed(4)),
    delta: parseFloat(delta.toFixed(4)),
    gamma: parseFloat(gamma.toFixed(6)),
    theta: parseFloat(theta.toFixed(4)),
    vega: parseFloat(vega.toFixed(4)),
    rho: parseFloat(rho.toFixed(4)),
    d1: parseFloat(d1.toFixed(4)),
    d2: parseFloat(d2.toFixed(4)),
  }
}

/**
 * Generate payoff diagram data for an option at expiry
 */
export function generatePayoffData(S, K, premium, type, numContracts = 1) {
  const multiplier = 100 * numContracts
  const range = S * 0.3
  const steps = 50
  const stepSize = (range * 2) / steps
  const data = []

  for (let i = 0; i <= steps; i++) {
    const stockPrice = S - range + i * stepSize
    let intrinsicValue = 0

    if (type === 'call') {
      intrinsicValue = Math.max(0, stockPrice - K)
    } else {
      intrinsicValue = Math.max(0, K - stockPrice)
    }

    const pnl = (intrinsicValue - premium) * multiplier

    data.push({
      stockPrice: parseFloat(stockPrice.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
    })
  }

  // Find breakeven
  const breakeven = type === 'call' ? K + premium : K - premium

  return { data, breakeven: parseFloat(breakeven.toFixed(2)) }
}

/**
 * Get option expiry dates relative to a reference date
 * @param {Date|string} refDate - Reference date (defaults to now)
 */
export function getExpiryDates(refDate = new Date()) {
  const dates = []
  const base = new Date(refDate)
  
  ;[30, 60, 90].forEach(days => {
    const d = new Date(base)
    d.setDate(d.getDate() + days)
    // Move to next Friday if not already
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1)
    dates.push(d.toISOString().split('T')[0])
  })
  
  return dates
}

/**
 * Generate options chain for a stock
 */
export function generateOptionsChain(S, iv, expiryDates, r = 0.05, currentDate = new Date()) {
  const chain = {}
  const now = new Date(currentDate)

  expiryDates.forEach(expiry => {
    const expiryDate = new Date(expiry)
    const diffMs = expiryDate - now
    const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24))
    const T = diffDays / 365
    const isExpired = diffDays <= 0
    
    // Generate strikes around current price (5% intervals)
    const strikeStep = S > 100 ? 5 : S > 50 ? 2.5 : 1
    const numStrikes = 7
    const strikes = []
    
    for (let i = -numStrikes; i <= numStrikes; i++) {
      const strike = Math.round((S + i * strikeStep) / strikeStep) * strikeStep
      if (strike > 0) strikes.push(strike)
    }

    chain[expiry] = strikes.map(K => {
      const callGreeks = calculateGreeks(S, K, T, r, iv, 'call')
      const putGreeks = calculateGreeks(S, K, T, r, iv, 'put')
      
      const callBid = Math.max(0, callGreeks.price * 0.97)
      const callAsk = callGreeks.price * 1.03
      const putBid = Math.max(0, putGreeks.price * 0.97)
      const putAsk = putGreeks.price * 1.03

      return {
        strike: K,
        expiry,
        T,
        call: {
          bid: parseFloat(callBid.toFixed(2)),
          ask: parseFloat(callAsk.toFixed(2)),
          last: parseFloat(callGreeks.price.toFixed(2)),
          iv: parseFloat((iv + (Math.random() - 0.5) * 0.05).toFixed(2)),
          delta: callGreeks.delta,
          gamma: callGreeks.gamma,
          theta: callGreeks.theta,
          vega: callGreeks.vega,
          volume: Math.floor(Math.random() * 2000 + 10),
          oi: Math.floor(Math.random() * 10000 + 100),
          itm: S > K,
        },
        put: {
          bid: parseFloat(putBid.toFixed(2)),
          ask: parseFloat(putAsk.toFixed(2)),
          last: parseFloat(putGreeks.price.toFixed(2)),
          iv: parseFloat((iv + (Math.random() - 0.5) * 0.05).toFixed(2)),
          delta: putGreeks.delta,
          gamma: putGreeks.gamma,
          theta: putGreeks.theta,
          vega: putGreeks.vega,
          volume: Math.floor(Math.random() * 2000 + 10),
          oi: Math.floor(Math.random() * 10000 + 100),
          itm: S < K,
        },
      }
    })
  })

  return chain
}
