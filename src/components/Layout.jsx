import Sidebar from './Sidebar'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f8f7f4]">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}
