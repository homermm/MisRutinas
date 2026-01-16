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
import { ProfilePage } from './pages/ProfilePage'
import { FriendsPage } from './pages/FriendsPage'
import { ExerciseHistoryPage } from './pages/ExerciseHistoryPage'
import { MuscleVolumePage } from './pages/MuscleVolumePage'
import { YearInReviewPage } from './pages/YearInReviewPage'
import { ActiveSessionPage } from './pages/ActiveSessionPage'
import { BodyMeasurementsPage } from './pages/BodyMeasurementsPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ActivityFeedPage } from './pages/ActivityFeedPage'
import { SharedRoutinesPage } from './pages/SharedRoutinesPage'
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

      {/* Profile (own) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Profile (public by username) */}
      <Route
        path="/u/:username"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Friends Page */}
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Layout>
              <FriendsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Exercise History */}
      <Route
        path="/exercise/:exerciseId/history"
        element={
          <ProtectedRoute>
            <Layout>
              <ExerciseHistoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Muscle Volume Analytics */}
      <Route
        path="/stats/muscle-volume"
        element={
          <ProtectedRoute>
            <Layout>
              <MuscleVolumePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Year in Review */}
      <Route
        path="/stats/year-review"
        element={
          <ProtectedRoute>
            <Layout>
              <YearInReviewPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Body Measurements */}
      <Route
        path="/body-measurements"
        element={
          <ProtectedRoute>
            <Layout>
              <BodyMeasurementsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Leaderboard */}
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Layout>
              <LeaderboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Activity Feed */}
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Layout>
              <ActivityFeedPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Shared Routines */}
      <Route
        path="/shared-routines"
        element={
          <ProtectedRoute>
            <Layout>
              <SharedRoutinesPage />
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
