import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import OnboardingPage from './pages/OnboardingPage'
import TransactionsPage from './pages/TransactionsPage'
import AiCoachPage from './pages/AiCoachPage'
import FamilyHubPage from './pages/FamilyHubPage'

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/" replace />
  if (!user.isOnboarded) return <Navigate to="/onboarding" replace />
  return children
}

// Onboarding route — only for logged in but not onboarded users
const OnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  if (user.isOnboarded) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={
        <OnboardingRoute>
          <OnboardingPage />
        </OnboardingRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <TransactionsPage />
        </ProtectedRoute>
      } />
      <Route path="/ai-coach" element={
        <ProtectedRoute>
          <AiCoachPage />
        </ProtectedRoute>
      } />
      <Route path="/family" element={
        <ProtectedRoute>
          <FamilyHubPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App