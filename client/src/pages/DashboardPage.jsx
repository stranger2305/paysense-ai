import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/dashboard/Sidebar'
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, Sparkles, Loader2,
} from 'lucide-react'

const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const StatCard = ({ title, value, change, icon, isPositive, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-emerald-400">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-zinc-400 text-sm mb-1">{title}</p>
      <p className="text-white text-2xl font-bold">₹{value.toLocaleString('en-IN')}</p>
    </motion.div>
  )
}

const DashboardPage = () => {
  const { user, logout } = useAuth()

  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [healthScore, setHealthScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, trendsRes] = await Promise.all([
          api.get('/transactions/stats'),
          api.get('/transactions/trends'),
        ])

        setStats(statsRes.data)
        setTrends(trendsRes.data.trends)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    const fetchHealthScore = async () => {
      try {
        const res = await api.get('/ai/health-score')
        setHealthScore(res.data)
      } catch (error) {
        console.error('Failed to load health score:', error)
      } finally {
        setHealthLoading(false)
      }
    }

    fetchHealthScore()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-emerald-500 animate-spin" size={32} />
      </div>
    )
  }

  const pieData = stats?.categoryBreakdown?.map((cat) => ({
    name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
    value: cat.total,
  })) || []

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar user={user} onLogout={logout} activePath="/dashboard" />

      <main className="lg:ml-64 p-6 lg:p-10">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-zinc-400 mt-1">Here's your financial overview for this month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Income This Month"
            value={stats?.thisMonth?.credits || 0}
            change={stats?.changes?.savings}
            isPositive={stats?.changes?.savings >= 0}
            icon={<TrendingUp size={20} />}
            delay={0}
          />
          <StatCard
            title="Expenses This Month"
            value={stats?.thisMonth?.debits || 0}
            change={stats?.changes?.spending}
            isPositive={stats?.changes?.spending <= 0}
            icon={<TrendingDown size={20} />}
            delay={0.05}
          />
          <StatCard
            title="Net Savings"
            value={stats?.thisMonth?.savings || 0}
            icon={<PiggyBank size={20} />}
            delay={0.1}
          />
          <StatCard
            title="Pending Cash Entries"
            value={stats?.pendingCashJournals || 0}
            icon={<Wallet size={20} />}
            delay={0.15}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h3 className="text-white font-semibold mb-1">Income vs Expenses</h3>
            <p className="text-zinc-500 text-sm mb-4">Last 6 months trend</p>

            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDebits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="credits"
                    stroke="#10b981"
                    fill="url(#colorCredits)"
                    strokeWidth={2}
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="debits"
                    stroke="#ef4444"
                    fill="url(#colorDebits)"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-zinc-500 text-sm">
                Upload a bank statement to see trends
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h3 className="text-white font-semibold mb-1">Spending by Category</h3>
            <p className="text-zinc-500 text-sm mb-4">This month</p>

            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-zinc-500 text-sm text-center px-4">
                No spending data yet. Upload a statement to get started.
              </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-emerald-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-emerald-400" />
              <h3 className="text-white font-semibold">AI Financial Health Score</h3>
            </div>

            {healthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-emerald-500 animate-spin" size={24} />
              </div>
            ) : healthScore ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle
                        cx="40" cy="40" r="34"
                        stroke="#27272a" strokeWidth="6" fill="none"
                      />
                      <circle
                        cx="40" cy="40" r="34"
                        stroke="#10b981" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - healthScore.score / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{healthScore.score}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-bold text-lg">Grade {healthScore.grade}</p>
                    <p className="text-zinc-400 text-sm">{healthScore.gradeMessage}</p>
                  </div>
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed">
                  {healthScore.explanation}
                </p>
              </>
            ) : (
              <p className="text-zinc-500 text-sm">Unable to load health score</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Recent Transactions</h3>
              <button
                onClick={() => window.location.assign('/transactions')}
                className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
              >
                View all
              </button>
            </div>

            {stats?.recentTransactions?.length > 0 ? (
              <div className="space-y-1">
                {stats.recentTransactions.map((txn) => (
                  <div
                    key={txn._id}
                    className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          txn.type === 'credit'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {txn.type === 'credit' ? (
                          <ArrowDownRight size={18} />
                        ) : (
                          <ArrowUpRight size={18} />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {txn.title || txn.description}
                        </p>
                        <p className="text-zinc-500 text-xs capitalize">
                          {txn.category} • {new Date(txn.date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold text-sm ${
                        txn.type === 'credit' ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-zinc-500 text-sm mb-1">No transactions yet</p>
                <p className="text-zinc-600 text-xs">Upload a bank statement to get started</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage