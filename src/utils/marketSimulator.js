// Market Simulator - generates realistic stock data

export const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 185, volume: 55000000, marketCap: 2900000000000 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', basePrice: 220, volume: 95000000, marketCap: 700000000000 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', basePrice: 185, volume: 35000000, marketCap: 1900000000000 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', basePrice: 415, volume: 22000000, marketCap: 3100000000000 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication', basePrice: 165, volume: 25000000, marketCap: 2050000000000 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', basePrice: 875, volume: 42000000, marketCap: 2150000000000 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Communication', basePrice: 520, volume: 18000000, marketCap: 1350000000000 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', basePrice: 185, volume: 55000000, marketCap: 300000000000 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication', basePrice: 650, volume: 7000000, marketCap: 285000000000 },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Financials', basePrice: 65, volume: 15000000, marketCap: 70000000000 },
  { symbol: 'UBER', name: 'Uber Technologies', sector: 'Technology', basePrice: 80, volume: 20000000, marketCap: 165000000000 },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'Financials', basePrice: 190, volume: 12000000, marketCap: 48000000000 },
  { symbol: 'BABA', name: 'Alibaba Group', sector: 'Consumer Discretionary', basePrice: 80, volume: 28000000, marketCap: 180000000000 },
  { symbol: 'SNAP', name: 'Snap Inc.', sector: 'Communication', basePrice: 12, volume: 30000000, marketCap: 20000000000 },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Technology', basePrice: 25, volume: 60000000, marketCap: 54000000000 },
]

// Seeded random to keep data consistent per symbol
function seededRandom(seed) {
  let s = seed
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function generateHistoricalData(symbol, days = 90) {
  const stock = STOCKS.find(s => s.symbol === symbol)
  if (!stock) return []

  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rand = seededRandom(seed)

  const data = []
  let price = stock.basePrice * (0.85 + rand() * 0.15)
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const volatility = 0.02 + rand() * 0.015
    const trend = (rand() - 0.48) * volatility
    const open = price
    const change1 = (rand() - 0.5) * volatility * price
    const change2 = (rand() - 0.5) * volatility * price
    const high = Math.max(open, open + Math.abs(change1) * (0.5 + rand()))
    const low = Math.min(open, open - Math.abs(change2) * (0.5 + rand()))
    const close = open + trend * price
    const clampedClose = Math.max(low, Math.min(high, close))
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(clampedClose.toFixed(2)),
      volume: Math.floor(stock.volume * (0.6 + rand() * 0.8)),
    })
    
    price = clampedClose
  }

  return data
}

let currentPrices = {}

export function initializePrices() {
  STOCKS.forEach(stock => {
    currentPrices[stock.symbol] = {
      ...stock,
      currentPrice: stock.basePrice,
      previousClose: stock.basePrice * (0.98 + Math.random() * 0.04),
      change: 0,
      changePercent: 0,
      iv: 0.25 + Math.random() * 0.3,
    }
  })
  return Object.values(currentPrices)
}

export function updatePrices(stocks) {
  return stocks.map(stock => {
    const volatility = 0.001 + Math.random() * 0.002
    const direction = Math.random() > 0.5 ? 1 : -1
    const changePct = direction * volatility * (0.5 + Math.random())
    const newPrice = Math.max(0.01, stock.currentPrice * (1 + changePct))
    const change = newPrice - stock.previousClose
    const changePercent = (change / stock.previousClose) * 100
    const ivChange = (Math.random() - 0.5) * 0.01
    const newIV = Math.max(0.1, Math.min(0.9, (stock.iv || 0.3) + ivChange))

    return {
      ...stock,
      currentPrice: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(stock.volume * (0.9 + Math.random() * 0.2)),
      iv: parseFloat(newIV.toFixed(4)),
    }
  })
}
