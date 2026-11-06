import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import TradingTerminal from './pages/TradingTerminal'
import OptionsCenter from './pages/OptionsCenter'
import Portfolio from './pages/Portfolio'
import LearnCenter from './pages/LearnCenter'
import { useEffect } from 'react'
import useStore from './store/useStore'

export default function App() {
  const updatePrices = useStore(s => s.updatePrices)

  useEffect(() => {
    const interval = setInterval(() => {
      updatePrices()
    }, 3000)
    return () => clearInterval(interval)
  }, [updatePrices])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="markets" element={<Markets />} />
          <Route path="trading" element={<TradingTerminal />} />
          <Route path="options" element={<OptionsCenter />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="learn" element={<LearnCenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
