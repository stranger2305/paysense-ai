import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  Sparkles, Users, Plane, Smartphone,
  ShieldAlert, GraduationCap, TrendingUp,
  ChevronRight, ChevronLeft, Wallet, Check
} from 'lucide-react'

// ── Reusable Option Card ──
const OptionCard = ({ icon, title, description, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            selected ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold">{title}</h3>
          {description && <p className="text-zinc-400 text-sm mt-1">{description}</p>}
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check size={12} className="text-black" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  )
}

// ── Step Progress Indicator ──
const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 <= currentStep ? 'bg-emerald-500 flex-1' : 'bg-zinc-800 flex-1'
          }`}
        />
      ))}
    </div>
  )
}

// ── Main Onboarding Component ──
const OnboardingPage = () => {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [persona, setPersona] = useState(null)
  const [spendingStyle, setSpendingStyle] = useState(null)
  const [savingsGoal, setSavingsGoal] = useState(null)
  const [riskAppetite, setRiskAppetite] = useState(null)
  const [monthlyIncome, setMonthlyIncome] = useState('')

  const totalSteps = 3

  const goNext = () => {
    setError('')
    if (step === 1 && !persona) {
      setError('Please select how you identify')
      return
    }
    if (step === 2 && (!spendingStyle || !savingsGoal || !riskAppetite)) {
      setError('Please answer all 3 questions')
      return
    }
    setStep((prev) => prev + 1)
  }

  const goBack = () => {
    setError('')
    setStep((prev) => prev - 1)
  }

  const handleFinish = async () => {
    if (!monthlyIncome || Number(monthlyIncome) <= 0) {
      setError('Please enter a valid monthly income')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.put('/auth/onboarding', {
        persona,
        personalityTraits: {
          spendingStyle,
          savingsGoal,
          riskAppetite,
        },
        monthlyIncome: Number(monthlyIncome),
      })

      setUser(response.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-black" />
          </div>
          <span className="font-bold text-lg">PaySense AI</span>
        </div>

        {/* Progress Bar */}
        <StepIndicator currentStep={step} totalSteps={totalSteps} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Animated Step Content */}
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Persona Selection ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">Who are you?</h1>
              <p className="text-zinc-400 mb-8">
                This helps PaySense AI tailor its advice and tone to you.
              </p>

              <div className="space-y-4">
                <OptionCard
                  icon={<Sparkles size={20} />}
                  title="Gen Z / Young Professional"
                  description="I'm starting my career, want to save smartly and grow wealth"
                  selected={persona === 'genz'}
                  onClick={() => setPersona('genz')}
                />
                <OptionCard
                  icon={<Users size={20} />}
                  title="Family / Household Manager"
                  description="I manage household finances, EMIs, and family expenses"
                  selected={persona === 'family'}
                  onClick={() => setPersona('family')}
                />
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Personality Quiz ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">Quick questions</h1>
              <p className="text-zinc-400 mb-8">
                Help us understand your money personality.
              </p>

              {/* Question 1 — Spending Style */}
              <div className="mb-6">
                <p className="text-sm font-medium text-zinc-300 mb-3">
                  How would you describe your spending style?
                </p>
                <div className="space-y-3">
                  <OptionCard
                    icon={<Sparkles size={18} />}
                    title="Impulsive"
                    description="I often make spontaneous purchases"
                    selected={spendingStyle === 'impulsive'}
                    onClick={() => setSpendingStyle('impulsive')}
                  />
                  <OptionCard
                    icon={<Wallet size={18} />}
                    title="Calculated"
                    description="I plan and research before every purchase"
                    selected={spendingStyle === 'calculated'}
                    onClick={() => setSpendingStyle('calculated')}
                  />
                  <OptionCard
                    icon={<TrendingUp size={18} />}
                    title="Balanced"
                    description="A mix of both depending on the situation"
                    selected={spendingStyle === 'balanced'}
                    onClick={() => setSpendingStyle('balanced')}
                  />
                </div>
              </div>

              {/* Question 2 — Savings Goal */}
              <div className="mb-6">
                <p className="text-sm font-medium text-zinc-300 mb-3">
                  What's your top savings goal right now?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <OptionCard
                    icon={<Plane size={18} />}
                    title="Travel"
                    selected={savingsGoal === 'travel'}
                    onClick={() => setSavingsGoal('travel')}
                  />
                  <OptionCard
                    icon={<Smartphone size={18} />}
                    title="Gadgets"
                    selected={savingsGoal === 'gadgets'}
                    onClick={() => setSavingsGoal('gadgets')}
                  />
                  <OptionCard
                    icon={<ShieldAlert size={18} />}
                    title="Emergency Fund"
                    selected={savingsGoal === 'emergency'}
                    onClick={() => setSavingsGoal('emergency')}
                  />
                  <OptionCard
                    icon={<TrendingUp size={18} />}
                    title="Investment"
                    selected={savingsGoal === 'investment'}
                    onClick={() => setSavingsGoal('investment')}
                  />
                  <OptionCard
                    icon={<GraduationCap size={18} />}
                    title="Education"
                    selected={savingsGoal === 'education'}
                    onClick={() => setSavingsGoal('education')}
                  />
                </div>
              </div>

              {/* Question 3 — Risk Appetite */}
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-3">
                  How comfortable are you with investment risk?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskAppetite(level)}
                      className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                        riskAppetite === level
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Monthly Income ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">Last step!</h1>
              <p className="text-zinc-400 mb-8">
                Your approximate monthly income helps us build accurate budgets and 
                financial health scores. This stays private and secure.
              </p>

              <div className="mb-2">
                <label className="text-zinc-400 text-sm mb-2 block">Monthly Income (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="25,000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-4 text-white text-lg placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <p className="text-zinc-500 text-xs">
                💡 Don't worry about being exact — you can update this anytime from settings.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation Buttons ── */}
        <div className="flex items-center gap-3 mt-10">
          {step > 1 && (
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-medium px-5 py-3.5 rounded-xl transition-colors"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition-colors"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-bold py-3.5 rounded-xl transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Go to Dashboard
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage