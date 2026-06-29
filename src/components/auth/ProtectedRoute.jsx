// src/components/auth/ProtectedRoute.jsx
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />
  }

  return children
}
