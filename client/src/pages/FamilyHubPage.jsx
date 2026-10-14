import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/dashboard/Sidebar'
import {
  Users, Loader2, Plus, KeyRound, Copy, Check, LogOutIcon, Crown,
} from 'lucide-react'

const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const NoFamilyGroupState = ({ onGroupJoined }) => {
  const [mode, setMode] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please enter a family group name')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/family/create', { name: groupName.trim() })
      onGroupJoined()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/family/join', { inviteCode: inviteCode.trim() })
      onGroupJoined()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users size={28} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Family Finance Hub</h1>
        <p className="text-zinc-400 mb-8">
          Track household spending together. Create a group or join one with an invite code.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!mode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('create')}
              className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-colors text-left"
            >
              <Plus size={22} className="text-emerald-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Create Group</h3>
              <p className="text-zinc-500 text-xs">Start a new family group and invite others</p>
            </button>
            <button
              onClick={() => setMode('join')}
              className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-colors text-left"
            >
              <KeyRound size={22} className="text-emerald-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Join Group</h3>
              <p className="text-zinc-500 text-xs">Enter an invite code from a family member</p>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-left">
            <label className="text-zinc-400 text-sm mb-2 block">Family Group Name</label>
            <input
              type="text"
              placeholder="e.g. Sharma Family"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode(null)}
                className="px-5 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Group'}
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-left">
            <label className="text-zinc-400 text-sm mb-2 block">Invite Code</label>
            <input
              type="text"
              placeholder="e.g. 90FD63"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 mb-4 tracking-widest font-mono uppercase focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode(null)}
                className="px-5 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Join Group'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

const InviteCodeCard = ({ code }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-zinc-400 text-xs mb-1">Invite Code — share with family</p>
        <p className="text-emerald-400 font-mono font-bold text-2xl tracking-widest">{code}</p>
      </div>
      <button
        onClick={handleCopy}
        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white p-3 rounded-xl transition-colors"
      >
        {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
      </button>
    </div>
  )
}

const FamilyHubPage = () => {
  const { user, logout } = useAuth()

  const [familyData, setFamilyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasGroup, setHasGroup] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const fetchFamilyDashboard = async () => {
    setLoading(true)
    try {
      const response = await api.get('/family/dashboard')
      setFamilyData(response.data)
      setHasGroup(true)
    } catch (error) {
      if (error.response?.status === 404) {
        setHasGroup(false)
      } else {
        console.error('Failed to fetch family dashboard:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilyDashboard()
  }, [])

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this family group?')) return

    setLeaving(true)
    try {
      await api.post('/family/leave')
      setHasGroup(false)
      setFamilyData(null)
    } catch (error) {
      console.error('Failed to leave group:', error)
    } finally {
      setLeaving(false)
    }
  }

  const pieData = familyData?.categoryBreakdown?.map((cat) => ({
    name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
    value: cat.total,
  })) || []

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar user={user} onLogout={logout} activePath="/family" />

      <main className="lg:ml-64 p-6 lg:p-10">

        {loading ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <Loader2 className="text-emerald-500 animate-spin" size={32} />
          </div>
        ) : !hasGroup ? (
          <NoFamilyGroupState onGroupJoined={fetchFamilyDashboard} />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">{familyData.familyGroup.name}</h1>
                <p className="text-zinc-400 mt-1">
                  {familyData.memberCount} member{familyData.memberCount !== 1 ? 's' : ''} • Combined household spending
                </p>
              </div>
              <button
                onClick={handleLeaveGroup}
                disabled={leaving}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                {leaving ? <Loader2 size={16} className="animate-spin" /> : <LogOutIcon size={16} />}
                Leave Group
              </button>
            </div>

            <div className="mb-8">
              <InviteCodeCard code={familyData.familyGroup.inviteCode} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
              <p className="text-zinc-400 text-sm mb-1">Total Household Spending This Month</p>
              <p className="text-4xl font-bold text-white">
                ₹{familyData.householdTotal.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Member Breakdown</h3>
                <div className="space-y-4">
                  {familyData.memberBreakdown.map((member) => {
                    const percentage = familyData.householdTotal > 0
                      ? ((member.totalSpent / familyData.householdTotal) * 100).toFixed(0)
                      : 0

                    return (
                      <div key={member._id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium flex items-center gap-1.5">
                                {member.name}
                                {member._id === familyData.familyGroup.createdBy && (
                                  <Crown size={12} className="text-amber-400" />
                                )}
                              </p>
                              <p className="text-zinc-500 text-xs">
                                {member.transactionCount} transaction{member.transactionCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <p className="text-white font-semibold text-sm">
                            ₹{member.totalSpent.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-1">Spending by Category</h3>
                <p className="text-zinc-500 text-sm mb-4">Combined household</p>

                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
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
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-zinc-500 text-sm text-center px-4">
                    No spending data yet this month
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default FamilyHubPage