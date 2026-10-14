import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/dashboard/Sidebar'
import {
  Upload, FileText, Search, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Receipt, Loader2, X,
  CheckCircle2, AlertCircle, Pencil, Check,
} from 'lucide-react'

// ── Upload Modal (unchanged) ──
const UploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0])
  }

  const validateAndSetFile = (selectedFile) => {
    setError('')
    if (selectedFile.type !== 'application/pdf') { setError('Please upload a PDF file only'); return }
    if (selectedFile.size > 10 * 1024 * 1024) { setError('File size must be under 10MB'); return }
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('statement', file)
    try {
      const response = await api.post('/statements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(response.data.statement)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process statement')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 20 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {result ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Statement Processed!</h3>
            <p className="text-zinc-400 text-sm mb-6">Found {result.transactionCount} transactions from {result.bankName}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-1">Total Credits</p>
                <p className="text-emerald-400 font-bold">₹{result.totalCredits.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-1">Total Debits</p>
                <p className="text-white font-bold">₹{result.totalDebits.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {result.atmWithdrawalsFound > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 text-left">
                <p className="text-amber-400 text-xs">💡 Found {result.atmWithdrawalsFound} ATM withdrawal(s). Track cash in your Cash Journal.</p>
              </div>
            )}
            <button onClick={onSuccess} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors">
              View Transactions
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-1">Upload Bank Statement</h2>
            <p className="text-zinc-400 text-sm mb-6">We support SBI, HDFC, ICICI, Axis, Kotak and 5+ more Indian banks.</p>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <input type="file" accept="application/pdf" id="file-upload" className="hidden"
                onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={24} className="text-emerald-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-zinc-500 text-xs">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ) : (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={32} className="text-zinc-500 mx-auto mb-3" />
                  <p className="text-zinc-300 text-sm font-medium mb-1">Drag & drop your PDF here</p>
                  <p className="text-zinc-500 text-xs">or click to browse (max 10MB)</p>
                </label>
              )}
            </div>
            <button
              onClick={handleUpload} disabled={!file || uploading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl mt-6 transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? <><Loader2 size={18} className="animate-spin" />Processing Statement...</> : 'Upload & Process'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── NEW: Edit Transaction Modal ──
// This is the new feature — lets users tag ambiguous UPI transactions
// with the correct category and a personal note like "Rajesh vada pav stall"
const EditTransactionModal = ({ transaction, onClose, onSaved }) => {
  const categories = [
    'food', 'transport', 'shopping', 'entertainment', 'healthcare',
    'education', 'utilities', 'rent', 'salary', 'investment',
    'transfer', 'cash', 'other',
  ]

  // Pre-fill with existing values so user sees current state
  const [category, setCategory] = useState(transaction.category || 'other')
  const [notes, setNotes] = useState(transaction.notes || '')
  const [title, setTitle] = useState(transaction.title || transaction.description || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      // PUT /api/transactions/:id — already built in your backend!
      await api.put(`/transactions/${transaction._id}`, {
        category,
        notes,
        title,
      })
      // Tell the parent component to refresh the list and close modal
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 20 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Tag Transaction</h2>
          <p className="text-zinc-500 text-sm">
            Clarify this UPI payment so your AI coach understands it better
          </p>
        </div>

        {/* Original transaction info — read only, for context */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-zinc-400 text-xs mb-1">Original bank description</p>
          <p className="text-white text-sm font-medium">{transaction.description}</p>
          <p className="text-zinc-500 text-xs mt-1">
            ₹{transaction.amount.toLocaleString('en-IN')} •{' '}
            {new Date(transaction.date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Friendly name — replaces the cryptic UPI string in the list */}
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">
              What was this payment for? <span className="text-zinc-600">(display name)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rajesh bhaiya vada pav stall"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category picker */}
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium capitalize transition-all ${
                    category === cat
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {category === cat && <Check size={10} className="inline mr-1" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Personal note */}
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">
              Personal note <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weekly vegetables from corner stall, near office tailor, etc."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-bold py-3.5 rounded-xl mt-6 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Save Changes</>}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Main Transactions Page ──
const TransactionsPage = () => {
  const { user, logout } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // NEW: which transaction is being edited
  const [editingTransaction, setEditingTransaction] = useState(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const categories = [
    'food', 'transport', 'shopping', 'entertainment', 'healthcare',
    'education', 'utilities', 'rent', 'salary', 'investment',
    'transfer', 'cash', 'other',
  ]

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: currentPage, limit: 10 }
      if (categoryFilter) params.category = categoryFilter
      if (typeFilter) params.type = typeFilter
      const response = await api.get('/transactions', { params })
      setTransactions(response.data.transactions)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, categoryFilter, typeFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const filteredTransactions = transactions.filter((txn) =>
    (txn.title || txn.description).toLowerCase().includes(search.toLowerCase())
  )

  const handleFilterChange = (setter) => (value) => {
    setter(value)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar user={user} onLogout={logout} activePath="/transactions" />

      <main className="lg:ml-64 p-6 lg:p-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Transactions</h1>
            <p className="text-zinc-400 mt-1">
              {pagination.total} total transaction{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <Upload size={18} />
            Upload Statement
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange(setTypeFilter)(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(setCategoryFilter)(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm capitalize focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-emerald-500 animate-spin" size={28} />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {filteredTransactions.map((txn, i) => (
                <motion.div
                  key={txn._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        txn.type === 'credit'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {txn.type === 'credit' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {txn.title || txn.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-zinc-500 text-xs capitalize bg-zinc-800 px-2 py-0.5 rounded-full">
                          {txn.category}
                        </span>
                        <span className="text-zinc-600 text-xs">
                          {new Date(txn.date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        {txn.source === 'bank_statement' && (
                          <span className="text-zinc-600 text-xs">• {txn.bankName}</span>
                        )}
                        {/* Show note preview if it exists */}
                        {txn.notes && (
                          <span className="text-zinc-500 text-xs italic">• {txn.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <p className={`font-bold text-sm ${txn.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </p>

                    {/* Edit button — visible on hover */}
                    <button
                      onClick={() => setEditingTransaction(txn)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
                      title="Tag this transaction"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Receipt size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm mb-1">No transactions found</p>
              <p className="text-zinc-600 text-xs">Try adjusting your filters or upload a statement</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-zinc-500 text-sm">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false)
              setCurrentPage(1)
              fetchTransactions()
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onSaved={fetchTransactions}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default TransactionsPage