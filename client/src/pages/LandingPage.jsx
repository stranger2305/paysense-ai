import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, Shield, Zap, Brain, 
  ChevronRight, X, Eye, EyeOff 
} from 'lucide-react'

// ── Login/Register Modal ──
const AuthModal = ({ mode, onClose, onSwitch }) => {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(formData.email, formData.password)
        if (user.isOnboarded) navigate('/dashboard')
        else navigate('/onboarding')
      } else {
        await register(formData.name, formData.email, formData.password)
        navigate('/onboarding')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-black" />
            </div>
            <span className="text-white font-bold text-lg">PaySense AI</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            {mode === 'login'
              ? 'Sign in to your financial dashboard'
              : 'Start your journey to financial freedom'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Full Name</label>
              <input
                type="text"
                placeholder="Yash Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-semibold rounded-xl py-3 mt-6 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
              <ChevronRight size={16} />
            </>
          )}
        </button>

        {/* Switch Mode */}
        <p className="text-center text-zinc-400 text-sm mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={onSwitch}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Main Landing Page ──
const LandingPage = () => {
  const [authModal, setAuthModal] = useState(null) // 'login' | 'register' | null

  const features = [
    {
      icon: <Brain size={24} />,
      title: 'AI Finance Coach',
      description: 'Personalized advice powered by Llama 3.3 — knows your actual spending habits.',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Smart Analytics',
      description: 'Beautiful charts showing where your money goes — categorized automatically.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      icon: <Shield size={24} />,
      title: 'Bank Statement Parser',
      description: 'Upload any Indian bank PDF — we extract and categorize every transaction.',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      icon: <Zap size={24} />,
      title: 'Health Score',
      description: 'Your personal financial health score — like CIBIL but for overall wellness.',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
  ]

  const stats = [
    { value: '10+', label: 'Indian Banks Supported' },
    { value: 'AI', label: 'Powered by Llama 3.3' },
    { value: '100%', label: 'Free to Use' },
    { value: '₹', label: 'Built for India' },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800/50 bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-black" />
            </div>
            <span className="font-bold text-lg">PaySense AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthModal('login')}
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthModal('register')}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">
                AI-Powered Personal Finance for India
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Your Money.{' '}
              <span className="text-emerald-400">
                Finally
              </span>
              <br />
              Under Control.
            </h1>

            {/* Subheadline */}
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your bank statement, get instant AI insights, and talk to your 
              personal finance coach — all built for the Indian middle class.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setAuthModal('register')}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Start for Free
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setAuthModal('login')}
                className="border border-zinc-700 hover:border-zinc-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all w-full sm:w-auto"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-12 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-zinc-500 text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to master your finances
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Built specifically for Indian users — from SBI to HDFC, UPI to cash transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`${feature.bg} border ${feature.border} rounded-2xl p-8 hover:scale-[1.02] transition-transform`}
              >
                <div className={`${feature.color} mb-4`}>{feature.icon}</div>
                <h3 className="text-white font-bold text-xl mb-2">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to take control?
            </h2>
            <p className="text-zinc-400 mb-8">
              Join thousands of Indians who are finally understanding where their money goes.
            </p>
            <button
              onClick={() => setAuthModal('register')}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              Get Started Free
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
              <TrendingUp size={12} className="text-black" />
            </div>
            <span className="font-bold">PaySense AI</span>
          </div>
          <p className="text-zinc-500 text-sm">
            Built with ❤️ for India's financial future
          </p>
        </div>
      </footer>

      {/* ── Auth Modal ── */}
      <AnimatePresence>
        {authModal && (
          <AuthModal
            mode={authModal}
            onClose={() => setAuthModal(null)}
            onSwitch={() => setAuthModal(authModal === 'login' ? 'register' : 'login')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default LandingPage