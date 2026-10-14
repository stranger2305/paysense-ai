import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/dashboard/Sidebar'
import {
  Send, Sparkles, Loader2, Bot, User, PieChart, Wallet,
} from 'lucide-react'

const MessageBubble = ({ role, content, isLoading }) => {
  const isUser = role === 'user'

  const renderContent = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-zinc-700' : 'bg-emerald-500'
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-black" />
        )}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-emerald-500 text-black rounded-tr-sm'
            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent(content)}
          </p>
        )}
      </div>
    </div>
  )
}

const QuickActionCard = ({ icon, title, description, onClick, loading }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 text-left transition-colors disabled:opacity-50"
    >
      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-3">
        {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      </div>
      <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
      <p className="text-zinc-500 text-xs">{description}</p>
    </button>
  )
}

const AiCoachPage = () => {
  const { user, logout } = useAuth()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your PaySense AI Coach. I know your real spending data, so ask me anything — how to save more, where you're overspending, or what to do with this month's surplus.`,
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [quickActionLoading, setQuickActionLoading] = useState(null)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || sending) return

    const userMessage = { role: 'user', content: trimmedInput }

    const updatedMessages = [...messages, userMessage]
    setMessages([...updatedMessages, { role: 'assistant', content: '', loading: true }])
    setInput('')
    setSending(true)

    try {
      const response = await api.post('/ai/chat', {
        messages: updatedMessages.map(({ role, content }) => ({ role, content })),
      })

      setMessages([...updatedMessages, { role: 'assistant', content: response.data.message }])
    } catch (error) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSpendingAnalysis = async () => {
    setQuickActionLoading('analysis')
    const placeholderMsg = { role: 'user', content: '📊 Give me a spending analysis' }
    setMessages((prev) => [...prev, placeholderMsg, { role: 'assistant', content: '', loading: true }])

    try {
      const response = await api.get('/ai/spending-analysis')
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: response.data.analysis },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Could not generate analysis right now. Please try again.' },
      ])
    } finally {
      setQuickActionLoading(null)
    }
  }

  const handleBudgetPlan = async () => {
    setQuickActionLoading('budget')
    const placeholderMsg = { role: 'user', content: '💰 Create a personalized budget plan for me' }
    setMessages((prev) => [...prev, placeholderMsg, { role: 'assistant', content: '', loading: true }])

    try {
      const response = await api.get('/ai/budget-recommendation')
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: response.data.recommendation },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Could not generate a budget plan right now. Please try again.' },
      ])
    } finally {
      setQuickActionLoading(null)
    }
  }

  const starterPrompts = [
    'How can I save more this month?',
    'Am I spending too much on food?',
    'Should I invest in SIP or FD?',
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar user={user} onLogout={logout} activePath="/ai-coach" />

      <main className="lg:ml-64 flex flex-col h-screen">

        <div className="border-b border-zinc-800 px-6 lg:px-10 py-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold">PaySense AI Coach</h1>
              <p className="text-zinc-500 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Powered by Llama 3.3 via Groq
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <QuickActionCard
              icon={<PieChart size={18} />}
              title="Spending Analysis"
              description="Get a full breakdown of where your money goes"
              onClick={handleSpendingAnalysis}
              loading={quickActionLoading === 'analysis'}
            />
            <QuickActionCard
              icon={<Wallet size={18} />}
              title="Budget Plan"
              description="Get a personalized 50/30/20 budget"
              onClick={handleBudgetPlan}
              loading={quickActionLoading === 'budget'}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-4 space-y-5">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble role={msg.role} content={msg.content} isLoading={msg.loading} />
            </motion.div>
          ))}

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pl-11">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-400 hover:text-white px-3 py-2 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-zinc-800 px-6 lg:px-10 py-4 flex-shrink-0">
          <div className="flex items-end gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-emerald-500 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your spending, savings, or investments..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm px-3 py-2.5 focus:outline-none resize-none max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black p-3 rounded-xl transition-colors flex-shrink-0"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          <p className="text-zinc-600 text-xs mt-2 text-center">
            PaySense AI can make mistakes. Consider verifying important financial decisions.
          </p>
        </div>
      </main>
    </div>
  )
}

export default AiCoachPage