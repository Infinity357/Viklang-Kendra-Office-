import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    clients: 0,
    activeOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get total clients
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      // Get orders stats
      const { data: orders } = await supabase
        .from('orders')
        .select('status')

      const activeOrders = orders?.filter(o => o.status === 'pending').length || 0
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0
      const deliveredOrders = orders?.filter(o => o.status === 'delivered').length || 0

      setStats({
        clients: clientsCount || 0,
        activeOrders: activeOrders,
        pendingOrders: activeOrders,
        completedOrders: completedOrders + deliveredOrders
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      label: 'Total Clients', 
      value: stats.clients, 
      icon: '👥', 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Active Orders', 
      value: stats.activeOrders, 
      icon: '📋', 
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: 'Pending Orders', 
      value: stats.pendingOrders, 
      icon: '⏳', 
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    { 
      label: 'Completed', 
      value: stats.completedOrders, 
      icon: '✅', 
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {profile?.email?.split('@')[0] || 'User'}! 👋
              </h1>
              <div className="mt-3 flex items-center space-x-3">
                <span className="text-indigo-100">Role:</span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  isAdmin ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'
                }`}>
                  {isAdmin ? 'ADMIN' : 'EMPLOYEE'}
                </span>
                {isAdmin && (
                  <span className="bg-green-400/20 text-green-100 px-3 py-1 rounded-full text-xs">
                    Full Access
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <svg className="h-12 w-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow border border-gray-100">
              <div className="flex items-center">
                <div className={`${stat.bgColor} rounded-xl p-3 mr-4`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/clients"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-200 border border-gray-100"
          >
            <div className="flex items-start">
              <div className="bg-blue-50 rounded-xl p-3 mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clients</h3>
                <p className="text-gray-500 text-sm mt-1">Manage your clients and their orders</p>
                <span className="inline-flex items-center mt-2 text-blue-600 text-sm font-medium hover:text-blue-700">
                  View all →
                </span>
              </div>
            </div>
          </Link>

          <Link
            to={isAdmin ? "/admin/users" : "/clients/new"}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-200 border border-gray-100"
          >
            <div className="flex items-start">
              <div className={`${isAdmin ? 'bg-purple-50' : 'bg-green-50'} rounded-xl p-3 mr-4`}>
                {isAdmin ? (
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isAdmin ? 'User Management' : 'Add Client'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {isAdmin ? 'Create and manage employee accounts' : 'Add a new client to the system'}
                </p>
                <span className={`inline-flex items-center mt-2 text-sm font-medium ${
                  isAdmin ? 'text-purple-600 hover:text-purple-700' : 'text-green-600 hover:text-green-700'
                }`}>
                  {isAdmin ? 'Manage users →' : 'Add client →'}
                </span>
              </div>
            </div>
          </Link>

          {!isAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start">
                <div className="bg-indigo-50 rounded-xl p-3 mr-4">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
                  <p className="text-gray-500 text-sm mt-1">Contact your administrator for assistance</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
