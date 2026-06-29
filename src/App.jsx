import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/auth/Login'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Navbar from './components/Navbar'
import Dashboard from './components/admin/Dashboard'
import ClientList from './components/clients/ClientList'
import ClientDetail from './components/clients/ClientDetail'
import ClientForm from './components/clients/ClientForm'
import UserManagement from './components/admin/UserManagement'

function AppRoutes() {
  const { user, isAdmin } = useAuth()

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App;
