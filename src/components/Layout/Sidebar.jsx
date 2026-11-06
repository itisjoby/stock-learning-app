import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Zap,
  BookOpen,
  Briefcase,
  GraduationCap,
  BarChart2
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/markets', icon: TrendingUp, label: 'Markets' },
  { to: '/trading', icon: Zap, label: 'Trading' },
  { to: '/options', icon: BarChart2, label: 'Options' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/learn', icon: GraduationCap, label: 'Learn' },
]

export default function Sidebar() {
  return (
    <aside className="w-20 lg:w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg hidden lg:block">StockLearn</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-800 hidden lg:block">
        <div className="text-xs text-gray-500 text-center">
          Paper Trading Mode
          <div className="mt-1 inline-flex items-center gap-1 bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
            Simulated
          </div>
        </div>
      </div>
    </aside>
  )
}
