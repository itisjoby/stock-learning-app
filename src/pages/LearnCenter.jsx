import { useState, useEffect } from 'react'
import { CheckCircle, Circle, ChevronDown, ChevronUp, Trophy, BookOpen, BarChart2, TrendingUp, Zap } from 'lucide-react'

const MODULES = [
  {
    id: 'basics',
    title: 'Module 1: Stock Market Basics',
    icon: BookOpen,
    color: 'blue',
    description: 'Learn how stock markets work, what stocks represent, and key metrics every investor should know.',
    lessons: [
      {
        id: 'what-is-stock-market',
        title: 'What is the Stock Market?',
        content: `The stock market is a marketplace where buyers and sellers trade shares of publicly listed companies. When a company wants to raise capital, it can list its shares on a stock exchange (like NYSE or NASDAQ) through an Initial Public Offering (IPO).

**Key Points:**
• Stock exchanges facilitate price discovery through supply and demand
• Prices fluctuate based on company performance, economic factors, and investor sentiment
• You can earn returns through price appreciation (capital gains) or dividends
• The S&P 500, Dow Jones, and NASDAQ are major market indices tracking overall performance

**Why Stocks?**
Historically, stocks have returned ~10% annually (before inflation), outperforming most other asset classes over long periods. However, they come with higher short-term volatility.`,
      },
      {
        id: 'how-stocks-work',
        title: 'How Stocks Work',
        content: `When you buy a stock, you become a partial owner (shareholder) of that company. If you own 100 shares of Apple and Apple has 15 billion shares outstanding, you own a tiny fraction of the company.

**Types of Stock:**
• **Common Stock:** Most common. Voting rights + potential dividends. Last in line during bankruptcy.
• **Preferred Stock:** Priority dividends, no voting rights. More bond-like.

**How You Make Money:**
1. **Capital Gains:** Buy at $10, sell at $15 = $5 gain per share
2. **Dividends:** Companies like Coca-Cola pay quarterly cash distributions

**Stock Price Drivers:**
• Earnings (EPS) growth
• Revenue growth
• Macroeconomic conditions
• Interest rates (higher rates = lower valuations)
• Investor sentiment and momentum`,
      },
      {
        id: 'reading-charts',
        title: 'Reading Stock Charts',
        content: `Stock charts display price history. Learning to read them helps you understand trends and time your trades.

**Chart Types:**
• **Line Chart:** Just closing prices. Good for overview.
• **Candlestick Chart:** Shows open, high, low, close (OHLC). Most popular among traders.
• **Bar Chart:** Similar to candlestick but lines instead of bodies.

**Candlestick Anatomy:**
• **Body:** Distance between open and close
• **Green/White candle:** Close > Open (bullish)
• **Red/Black candle:** Close < Open (bearish)
• **Wicks/Shadows:** High and low beyond the body

**Key Chart Elements:**
• **Trend lines:** Connect highs or lows to show direction
• **Support:** Price level where stock tends to bounce up
• **Resistance:** Price level where stock tends to reverse down
• **Volume:** Number of shares traded. High volume confirms moves.`,
      },
      {
        id: 'key-metrics',
        title: 'Key Metrics: P/E, EPS, Market Cap',
        content: `These fundamental metrics help you evaluate whether a stock is fairly valued.

**EPS (Earnings Per Share):**
Net Income ÷ Shares Outstanding
Example: Apple earns $100B with 15B shares = $6.67 EPS

**P/E Ratio (Price-to-Earnings):**
Stock Price ÷ EPS
Example: Apple @ $185 ÷ $6.67 = 27.7x P/E
• High P/E: Growth expectations are high
• Low P/E: Value stock or company struggling
• S&P 500 historical average: ~16-18x

**Market Cap:**
Stock Price × Shares Outstanding
• Large-cap: >$10B (more stable)
• Mid-cap: $2B–$10B
• Small-cap: <$2B (higher growth potential, more risk)

**Other Key Metrics:**
• **P/B Ratio:** Price vs. book value of assets
• **Dividend Yield:** Annual dividend ÷ Stock price
• **Debt-to-Equity:** How leveraged the company is`,
      },
    ],
    quiz: [
      { q: 'What does it mean to own a stock?', options: ['You own a bond', 'You own partial ownership in a company', 'You lend money to a company', 'You own the company\'s debt'], answer: 1 },
      { q: 'What is the P/E ratio?', options: ['Profit/Expenses', 'Price/Earnings', 'Performance/Earnings', 'Price/Equity'], answer: 1 },
      { q: 'A green candlestick means:', options: ['High volume', 'Stock is up for the year', 'Close price was higher than open', 'Stock hit resistance'], answer: 2 },
      { q: 'Market Cap is calculated as:', options: ['Revenue × Profit', 'Stock Price × Shares Outstanding', 'EPS × P/E Ratio', 'All of the above'], answer: 1 },
      { q: 'Support is a price level where the stock:', options: ['Tends to reverse downward', 'Tends to bounce upward', 'Always stops trading', 'Splits its shares'], answer: 1 },
    ],
  },
  {
    id: 'trading-basics',
    title: 'Module 2: Trading Basics',
    icon: TrendingUp,
    color: 'green',
    description: 'Understand different order types, risk management strategies, and portfolio diversification.',
    lessons: [
      {
        id: 'order-types',
        title: 'Market vs. Limit Orders',
        content: `Order types determine HOW and WHEN your trade executes.

**Market Order:**
• Executes immediately at the best available price
• Guarantees execution, NOT price
• Best for: Liquid stocks, urgent trades
• Risk: Slippage (paying more than expected in volatile markets)

**Limit Order:**
• Sets a maximum price to buy or minimum price to sell
• Guarantees price, NOT execution
• Buy limit: Order fills only at your price or lower
• Sell limit: Order fills only at your price or higher
• Best for: Illiquid stocks, specific entry/exit targets

**Example:**
Stock trading at $100. You place a buy limit at $98.
• If stock drops to $98 → order fills
• If stock never drops → order never fills

**Stop Orders:**
• Stop-Loss: Automatically sell if stock falls to your trigger price
• Stop-Limit: Becomes a limit order at the trigger price
• Trailing Stop: Stop price moves up as stock rises`,
      },
      {
        id: 'risk-management',
        title: 'Risk Management & Position Sizing',
        content: `Risk management is what separates surviving traders from those who blow up their accounts.

**The 1-2% Rule:**
Never risk more than 1-2% of your portfolio on a single trade.
• $100,000 portfolio → Max $1,000-$2,000 at risk per trade

**Position Sizing Formula:**
Position Size = (Account × Risk %) ÷ (Entry Price − Stop Loss)
Example:
• Account: $50,000
• Risk: 2% = $1,000
• Entry: $50, Stop: $45 → Risk per share: $5
• Position size: $1,000 ÷ $5 = 200 shares

**Key Risk Concepts:**
• **Stop Loss:** Pre-defined exit if trade goes wrong
• **Risk/Reward Ratio:** Risk $1 to make $3 (1:3 ratio)
• **Correlation:** Owning 10 tech stocks is NOT diversification
• **Never average down blindly:** Adding to losing positions can amplify losses`,
      },
      {
        id: 'diversification',
        title: 'Portfolio Diversification',
        content: `"Don't put all your eggs in one basket" — diversification reduces risk without proportionally reducing returns.

**Types of Diversification:**

1. **Sector Diversification:**
   Mix Technology, Healthcare, Financials, Consumer Staples, Energy, etc.

2. **Market Cap Diversification:**
   Mix large-cap (stability) with small-cap (growth potential)

3. **Geographic Diversification:**
   US + International markets reduce country-specific risk

4. **Asset Class Diversification:**
   Stocks + Bonds + REITs + Commodities

**Modern Portfolio Theory:**
Adding assets with low correlation reduces portfolio volatility without reducing expected returns. A 60/40 stock/bond portfolio historically provides smoother returns than 100% stocks.

**Concentration Risk:**
If 50% of your portfolio is in one stock and it drops 50%, your portfolio drops 25%. Limit any single position to 5-10% max.`,
      },
    ],
    quiz: [
      { q: 'A limit buy order at $50 on a stock trading at $55 will:', options: ['Execute immediately at $55', 'Execute only if the price drops to $50', 'Execute at any price below $55', 'Never execute'], answer: 1 },
      { q: 'The 2% rule means:', options: ['Never lose more than 2% per year', 'Risk max 2% of portfolio per trade', 'Take profit at 2% gain', 'Only trade with 2% of savings'], answer: 1 },
      { q: 'A stop-loss order:', options: ['Guarantees maximum profit', 'Automatically sells when price falls to trigger', 'Prevents all losses', 'Only works in bull markets'], answer: 1 },
      { q: 'Owning 10 tech stocks provides:', options: ['Full diversification', 'Sector diversification only', 'Geographic diversification', 'No risk reduction'], answer: 1 },
      { q: 'Risk/Reward ratio of 1:3 means:', options: ['Risk $3 to make $1', 'Risk $1 to potentially make $3', '3% risk on each trade', '1% loss maximum'], answer: 1 },
    ],
  },
  {
    id: 'options-101',
    title: 'Module 3: Options 101',
    icon: BarChart2,
    color: 'purple',
    description: 'Introduction to options contracts — what they are, how they work, and why traders use them.',
    lessons: [
      {
        id: 'what-are-options',
        title: 'What Are Options?',
        content: `An option is a contract giving you the RIGHT (but not the obligation) to buy or sell 100 shares of stock at a specific price, before a specific date.

**Key Terms:**
• **Premium:** Price you pay for the option contract
• **Strike Price:** The price at which you can buy/sell the stock
• **Expiration Date:** When the option contract expires
• **Underlying:** The stock the option is based on

**Why Options?**
1. **Leverage:** Control $10,000 of stock for $500 in premium
2. **Defined Risk:** Max loss on a long option = premium paid
3. **Income:** Sell options to collect premium
4. **Hedging:** Protect existing positions

**One Contract = 100 Shares:**
If AAPL call costs $3.00 premium, you pay:
$3.00 × 100 = $300 per contract

**Long vs Short Options:**
• **Long (Buy):** Pay premium, have the right
• **Short (Sell):** Receive premium, have the obligation`,
      },
      {
        id: 'calls-puts',
        title: 'Calls vs Puts Explained',
        content: `**CALL Options — Bet on Stock Rising:**
Gives you the RIGHT to BUY 100 shares at the strike price.

Example: AAPL @ $185. Buy AAPL $190 call for $3.00.
• If AAPL rises to $200: 
  - Intrinsic value: $200 - $190 = $10
  - Paid: $3.00
  - Profit: ($10 - $3) × 100 = $700 ✓
• If AAPL stays at $185:
  - Option expires worthless
  - Loss: $3.00 × 100 = $300 ✗

**PUT Options — Bet on Stock Falling:**
Gives you the RIGHT to SELL 100 shares at the strike price.

Example: AAPL @ $185. Buy AAPL $180 put for $2.50.
• If AAPL falls to $170:
  - Intrinsic value: $180 - $170 = $10
  - Paid: $2.50
  - Profit: ($10 - $2.50) × 100 = $750 ✓
• If AAPL stays above $180:
  - Option expires worthless
  - Loss: $2.50 × 100 = $250 ✗

**Key Insight:** Options provide leverage and defined risk!`,
      },
      {
        id: 'intrinsic-extrinsic',
        title: 'Time Value & Extrinsic Value',
        content: `Option Price = Intrinsic Value + Time Value (Extrinsic Value)

**Intrinsic Value:**
The "real" value if exercised right now.
• Call: Max(0, Stock Price - Strike)
• Put: Max(0, Strike - Stock Price)

Example: AAPL @ $195, $190 call
Intrinsic = $195 - $190 = $5.00

**Time Value (Extrinsic):**
The extra premium above intrinsic value. Reflects:
• Time remaining to expiration
• Implied volatility
• Interest rates

If the $190 call costs $7.50:
Time Value = $7.50 - $5.00 = $2.50

**Time Decay (Theta):**
Options lose value as expiration approaches — even if the stock doesn't move. This decay accelerates in the final 30 days. This is why buying options too far OTM too close to expiry is risky.

**Moneyness:**
• ITM: Has intrinsic value
• ATM: Strike ≈ stock price (most time value)
• OTM: No intrinsic value (pure time value)`,
      },
    ],
    quiz: [
      { q: 'An option contract typically controls how many shares?', options: ['10', '50', '100', '1000'], answer: 2 },
      { q: 'A call option gives you the right to:', options: ['Sell stock at the strike price', 'Buy stock at the strike price', 'Borrow stock from a broker', 'Short the stock'], answer: 1 },
      { q: 'If you buy a put option and the stock rises, your maximum loss is:', options: ['Unlimited', 'The premium paid', 'The strike price', 'Zero'], answer: 1 },
      { q: 'An ITM call option has a strike price that is:', options: ['Above the stock price', 'Below the stock price', 'Equal to the stock price', 'Irrelevant to the stock price'], answer: 1 },
      { q: 'Time value is highest for options that are:', options: ['Deep ITM', 'ATM', 'Deep OTM', 'Near expiration'], answer: 1 },
    ],
  },
  {
    id: 'greeks',
    title: 'Module 4: Options Greeks',
    icon: Zap,
    color: 'orange',
    description: 'Master the Greeks — the risk measures that every options trader must understand.',
    lessons: [
      {
        id: 'delta',
        title: 'Delta: Directional Exposure',
        content: `Delta measures how much an option's price changes for every $1 move in the stock.

**Delta Values:**
• Call options: 0 to +1.0
• Put options: -1.0 to 0
• ATM options: ~0.50 for calls, ~-0.50 for puts

**Interpretation:**
• Delta 0.70 call: Option gains $0.70 for each $1 rise in stock
• Delta -0.30 put: Option gains $0.30 for each $1 fall in stock

**Delta as Probability Proxy:**
Delta ≈ probability of the option expiring ITM.
• Delta 0.50 call → ~50% chance of expiring ITM
• Delta 0.20 call → ~20% chance (deep OTM)
• Delta 0.80 call → ~80% chance (deep ITM)

**Delta for Hedging:**
To hedge 100 shares of stock (delta 1.0):
Buy 2 puts with delta -0.50 each = total delta of -1.0
This creates a "delta neutral" position.

**Practical Use:**
• High delta options (0.70+): More stock-like, expensive
• Low delta options (0.10-0.30): Cheap lottery tickets, high risk/reward`,
      },
      {
        id: 'gamma',
        title: 'Gamma: Delta\'s Rate of Change',
        content: `Gamma measures how much delta changes for a $1 move in the stock. It's the "acceleration" of delta.

**Key Properties:**
• Always positive for long options (both calls and puts)
• Highest for ATM options
• Increases dramatically near expiration

**Example:**
• You hold a call with delta 0.50 and gamma 0.05
• Stock rises $1 → new delta = 0.50 + 0.05 = 0.55
• Stock rises another $1 → delta = 0.55 + 0.05 = 0.60

**Gamma Risk:**
Short option sellers HATE gamma. As expiration approaches:
• ATM options' gamma spikes dramatically
• Small stock moves = large swings in delta
• This is why selling weekly ATM options is very risky

**Gamma Squeeze:**
When market makers who sold options must buy stock to hedge rapidly changing deltas, it can accelerate stock moves. This is what happened with GameStop (GME) in 2021.

**Long Gamma:** You benefit from large moves in either direction.
**Short Gamma:** You benefit from the stock staying flat (time decay).`,
      },
      {
        id: 'theta',
        title: 'Theta: Time Decay',
        content: `Theta tells you how much your option loses each calendar day, all else equal.

**Key Properties:**
• Always negative for long options (you lose money as time passes)
• Always positive for short options (you gain money as time passes)
• Accelerates in the final 30 days before expiration

**Example:**
• Option premium: $5.00, Theta: -0.05
• After 1 day: $5.00 - $0.05 = $4.95 (all else equal)
• After 10 days: Approximately $4.50

**The Weekend Effect:**
Markets are closed on weekends but theta still accrues. Friday's close to Monday's open → 3 days of theta decay!

**Who Benefits from Theta?**
Option sellers (like covered call writers) collect theta.
"Be the house, not the gambler" — selling options means time is on your side.

**Theta vs. Expiration:**
• 90 DTE: Low theta (slow decay)
• 30 DTE: Moderate theta
• 7 DTE: High theta (rapid decay)
• 0 DTE: Theta collapses to zero instantly`,
      },
      {
        id: 'vega',
        title: 'Vega: Volatility Sensitivity',
        content: `Vega measures how much an option's price changes for every 1% change in implied volatility (IV).

**Key Properties:**
• Always positive for long options
• Higher for longer-dated options
• Highest for ATM options

**Example:**
• Option premium: $5.00, Vega: 0.10
• IV increases 1% → option gains $0.10 → new price: $5.10
• IV decreases 1% → option loses $0.10 → new price: $4.90

**Implied Volatility (IV):**
IV is the market's forecast of future volatility — derived from option prices.
• High IV → expensive options (market expects big moves)
• Low IV → cheap options (market expects calm)

**IV Crush:**
After major events (earnings, FDA approvals), IV collapses. Even if the stock moves in your direction, options can LOSE value. This is "IV crush."

Strategy: Sell options before earnings to profit from IV crush.

**VIX:**
The "fear index" — measures S&P 500 implied volatility. VIX >30 = high fear. VIX <15 = complacency.`,
      },
    ],
    quiz: [
      { q: 'An ATM call option has approximately what delta?', options: ['0.10', '0.50', '0.80', '1.00'], answer: 1 },
      { q: 'Gamma is highest for which options?', options: ['Deep ITM options', 'Deep OTM options', 'ATM options near expiration', 'Long-dated options'], answer: 2 },
      { q: 'Theta is -0.05. This means the option loses how much per day?', options: ['$0.005', '$0.05', '$5.00', '$0.50'], answer: 1 },
      { q: 'An "IV crush" typically happens:', options: ['During low volume periods', 'Right after major news events', 'When markets are closed', 'During a bull market'], answer: 1 },
      { q: 'If Vega is 0.20 and IV rises 2%, the option price increases by:', options: ['$0.20', '$0.40', '$0.02', '$2.00'], answer: 1 },
    ],
  },
]

function QuizSection({ quiz, moduleId }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const handleSubmit = () => {
    let s = 0
    quiz.forEach((q, i) => { if (answers[i] === q.answer) s++ })
    setScore(s)
    setSubmitted(true)
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
    existing[moduleId] = { score: s, total: quiz.length }
    localStorage.setItem('quiz_scores', JSON.stringify(existing))
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-semibold">Module Quiz</h3>
      </div>

      {submitted && (
        <div className={`p-4 rounded-lg mb-4 text-center ${score >= quiz.length * 0.8 ? 'bg-green-500/15 border border-green-500/30' : 'bg-yellow-500/15 border border-yellow-500/30'}`}>
          <div className={`text-2xl font-bold mb-1 ${score >= quiz.length * 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
            {score}/{quiz.length}
          </div>
          <div className="text-sm text-gray-400">
            {score >= quiz.length * 0.8 ? '🎉 Excellent! Module Complete!' : '📚 Review the material and try again.'}
          </div>
          <button onClick={handleReset} className="mt-2 text-xs text-blue-400 hover:text-blue-300">Retry Quiz</button>
        </div>
      )}

      <div className="space-y-5">
        {quiz.map((q, i) => (
          <div key={i}>
            <p className="text-sm text-white mb-2 font-medium">{i + 1}. {q.q}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, j) => {
                let cls = 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                if (answers[i] === j) cls = 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                if (submitted) {
                  if (j === q.answer) cls = 'bg-green-500/20 text-green-400 border border-green-500/30'
                  else if (answers[i] === j && j !== q.answer) cls = 'bg-red-500/20 text-red-400 border border-red-500/30'
                  else cls = 'bg-gray-700 text-gray-500'
                }
                return (
                  <button
                    key={j}
                    onClick={() => !submitted && setAnswers(a => ({ ...a, [i]: j }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${cls}`}
                    disabled={submitted}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < quiz.length}
          className="mt-4 w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Submit ({Object.keys(answers).length}/{quiz.length} answered)
        </button>
      )}
    </div>
  )
}

function LessonContent({ lesson }) {
  const lines = lesson.content.split('\n')
  return (
    <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h4 key={i} className="text-white font-semibold mt-3 mb-1">{line.slice(2, -2)}</h4>
        }
        if (line.startsWith('• ')) {
          return <div key={i} className="flex gap-2 ml-2"><span className="text-blue-400 mt-0.5">•</span><span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</span></div>
        }
        if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) {
          return <div key={i} className="flex gap-2 ml-2"><span className="text-blue-400">{line[0]}.</span><span>{line.slice(3).replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</span></div>
        }
        if (line.trim() === '') return <div key={i} className="h-1" />
        // Bold inline
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <p key={i}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part)}
          </p>
        )
      })}
    </div>
  )
}

export default function LearnCenter() {
  const [openModule, setOpenModule] = useState('basics')
  const [openLesson, setOpenLesson] = useState(null)
  const [completedLessons, setCompletedLessons] = useState(() => {
    return JSON.parse(localStorage.getItem('completed_lessons') || '{}')
  })
  const [quizScores] = useState(() => {
    return JSON.parse(localStorage.getItem('quiz_scores') || '{}')
  })

  const markComplete = (lessonId) => {
    const updated = { ...completedLessons, [lessonId]: true }
    setCompletedLessons(updated)
    localStorage.setItem('completed_lessons', JSON.stringify(updated))
  }

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedCount = Object.keys(completedLessons).length

  const colorMap = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', btn: 'bg-blue-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', btn: 'bg-green-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', btn: 'bg-purple-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', btn: 'bg-orange-500' },
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Learn Center</h1>
            <p className="text-gray-400 text-sm mt-1">Master the stock market from basics to advanced options strategies</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{completedCount}/{totalLessons}</div>
            <div className="text-xs text-gray-500">lessons complete</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalLessons) * 100}%` }}
          />
        </div>
      </div>

      {/* Modules */}
      {MODULES.map(module => {
        const c = colorMap[module.color]
        const Icon = module.icon
        const isOpen = openModule === module.id
        const moduleCompleted = module.lessons.every(l => completedLessons[l.id])
        const quizScore = quizScores[module.id]
        const lessonsCompleted = module.lessons.filter(l => completedLessons[l.id]).length

        return (
          <div key={module.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Module Header */}
            <button
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/50 transition-colors"
              onClick={() => setOpenModule(isOpen ? null : module.id)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} border ${c.border}`}>
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-white font-semibold">{module.title}</h2>
                  {moduleCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-xs text-gray-500">{module.description}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className={`font-semibold ${c.text}`}>{lessonsCompleted}/{module.lessons.length}</div>
                  <div className="text-xs text-gray-600">lessons</div>
                </div>
                {quizScore && (
                  <div className="text-right">
                    <div className="font-semibold text-yellow-400">{quizScore.score}/{quizScore.total}</div>
                    <div className="text-xs text-gray-600">quiz</div>
                  </div>
                )}
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {/* Module Content */}
            {isOpen && (
              <div className="border-t border-gray-800 p-5 space-y-3">
                {/* Lessons */}
                {module.lessons.map(lesson => {
                  const isLessonOpen = openLesson === lesson.id
                  const isDone = completedLessons[lesson.id]
                  return (
                    <div key={lesson.id} className="border border-gray-700 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-800/50 transition-colors"
                        onClick={() => setOpenLesson(isLessonOpen ? null : lesson.id)}
                      >
                        <div className="flex-shrink-0">
                          {isDone
                            ? <CheckCircle className="w-5 h-5 text-green-400" />
                            : <Circle className="w-5 h-5 text-gray-600" />
                          }
                        </div>
                        <span className="text-sm font-medium text-white flex-1">{lesson.title}</span>
                        {isLessonOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>

                      {isLessonOpen && (
                        <div className="border-t border-gray-700 p-4">
                          <LessonContent lesson={lesson} />
                          {!isDone && (
                            <button
                              onClick={() => markComplete(lesson.id)}
                              className={`mt-4 px-4 py-2 ${c.btn} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark as Complete
                            </button>
                          )}
                          {isDone && (
                            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" /> Completed!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Quiz */}
                <QuizSection quiz={module.quiz} moduleId={module.id} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
