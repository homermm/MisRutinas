import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/layout'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { RoutinesPage } from './pages/RoutinesPage'
import { LibraryPage } from './pages/LibraryPage'
import { TimerPage } from './pages/TimerPage'
import { HistoryPage } from './pages/HistoryPage'
import { StatsPage } from './pages/StatsPage'
import { ComparePage } from './pages/ComparePage'
import { ExerciseProgressPage } from './pages/ExerciseProgressPage'
import { GoalsPage } from './pages/GoalsPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { ActiveSessionPage } from './pages/ActiveSessionPage'
import { Loader2 } from 'lucide-react'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Route */}
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines"
        element={
          <ProtectedRoute>
            <Layout>
              <RoutinesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Layout>
              <LibraryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/timer"
        element={
          <ProtectedRoute>
            <Layout>
              <TimerPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <HistoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Active Session (no layout wrapper - full screen) */}
      <Route
        path="/session/:routineId"
        element={
          <ProtectedRoute>
            <ActiveSessionPage />
          </ProtectedRoute>
        }
      />

      {/* Stats Page */}
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <Layout>
              <StatsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Compare Sessions Page */}
      <Route
        path="/compare"
        element={
          <ProtectedRoute>
            <Layout>
              <ComparePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Exercise Progress Page */}
      <Route
        path="/exercise/:exerciseId"
        element={
          <ProtectedRoute>
            <Layout>
              <ExerciseProgressPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Goals Page */}
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <Layout>
              <GoalsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Calculator Page */}
      <Route
        path="/calculator"
        element={
          <ProtectedRoute>
            <Layout>
              <CalculatorPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Legacy routes redirect */}
      <Route path="/categories" element={<Navigate to="/library" replace />} />
      <Route path="/exercises" element={<Navigate to="/library" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
