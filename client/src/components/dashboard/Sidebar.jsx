import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, LogOut, Receipt, MessageCircle, LayoutDashboard, Users,
} from 'lucide-react'

// ── Shared Sidebar Navigation ──
// Used across DashboardPage, TransactionsPage, AiCoachPage, FamilyHubPage
const Sidebar = ({ user, onLogout, activePath }) => {
  const navigate = useNavigate()

  const navItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Receipt size={18} />, label: 'Transactions', path: '/transactions' },
    { icon: <MessageCircle size={18} />, label: 'AI Coach', path: '/ai-coach' },
    { icon: <Users size={18} />, label: 'Family Hub', path: '/family' },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-zinc-950 border-r border-zinc-800 p-6 fixed left-0 top-0">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <TrendingUp size={16} className="text-black" />
        </div>
        <span className="font-bold text-lg text-white">PaySense AI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              item.path === activePath
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-zinc-500 text-xs truncate capitalize">
              {user?.persona === 'genz' ? 'Gen Z' : 'Family'} Plan
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar