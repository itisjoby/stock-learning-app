import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import SimulationBar from './SimulationBar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <SimulationBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
