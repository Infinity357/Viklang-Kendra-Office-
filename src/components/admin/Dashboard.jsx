import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [directRole, setDirectRole] = useState(null)
  const [stats, setStats] = useState({
    clients: 0,
    activeOrders: 0,
    deliveryPending: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [showOrders, setShowOrders] = useState(false)
  const [orders, setOrders] = useState([])
  const [orderType, setOrderType] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    const fetchDirectRole = async () => {
      if (!user) return
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error) {
        const { data: byEmail, error: emailError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('email', user.email)
          .single()
        
        if (!emailError && byEmail) {
          setDirectRole(byEmail.role)
        }
      } else {
        setDirectRole(data?.role)
      }
      setLoading(false)
    }
    
    fetchDirectRole()
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      const { data: orders } = await supabase
        .from('orders')
        .select('is_completed, is_delivered')

      const pendingOrders = orders?.filter(o => !o.is_completed).length || 0
      const deliveryPendingOrders = orders?.filter(o => o.is_completed && !o.is_delivered).length || 0
      const completedOrders = orders?.filter(o => o.is_completed && o.is_delivered).length || 0

      setStats({
        clients: clientsCount || 0,
        activeOrders: pendingOrders,
        deliveryPending: deliveryPendingOrders,
        completed: completedOrders
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshProfile()
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (data) setDirectRole(data.role)
    }
    setRefreshing(false)
  }

  const fetchOrders = async (type, pageNum = 1, search = '') => {
    setLoadingOrders(true)
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          clients (
            name,
            mobile_no
          )
        `)

      if (type === 'pending') {
        query = query.eq('is_completed', false)
      } else if (type === 'delivery') {
        query = query.eq('is_completed', true).eq('is_delivered', false)
      } else if (type === 'completed') {
        query = query.eq('is_completed', true).eq('is_delivered', true)
      }

      if (search && search.trim() !== '') {
        const searchTermTrimmed = search.trim()
        
        const { data: matchingClients } = await supabase
          .from('clients')
          .select('id')
          .or(`name.ilike.%${searchTermTrimmed}%,mobile_no.ilike.%${searchTermTrimmed}%`)

        const clientIds = matchingClients?.map(c => c.id) || []

        if (clientIds.length > 0) {
          query = query.or(`topic.ilike.%${searchTermTrimmed}%,client_id.in.(${clientIds.join(',')})`)
        } else {
          query = query.ilike('topic', `%${searchTermTrimmed}%`)
        }
      }

      const from = (pageNum - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      
      query = query
        .order('order_date', { ascending: false })
        .range(from, to)

      const { data, error } = await query

      if (error) throw error

      let countQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
      
      if (type === 'pending') {
        countQuery = countQuery.eq('is_completed', false)
      } else if (type === 'delivery') {
        countQuery = countQuery.eq('is_completed', true).eq('is_delivered', false)
      } else if (type === 'completed') {
        countQuery = countQuery.eq('is_completed', true).eq('is_delivered', true)
      }

      if (search && search.trim() !== '') {
        const searchTermTrimmed = search.trim()
        
        const { data: matchingClients } = await supabase
          .from('clients')
          .select('id')
          .or(`name.ilike.%${searchTermTrimmed}%,mobile_no.ilike.%${searchTermTrimmed}%`)

        const clientIds = matchingClients?.map(c => c.id) || []

        if (clientIds.length > 0) {
          countQuery = countQuery.or(`topic.ilike.%${searchTermTrimmed}%,client_id.in.(${clientIds.join(',')})`)
        } else {
          countQuery = countQuery.ilike('topic', `%${searchTermTrimmed}%`)
        }
      }

      const { count } = await countQuery

      setHasMore(data.length === ITEMS_PER_PAGE && (from + ITEMS_PER_PAGE) < (count || 0))
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleViewOrders = (type) => {
    setOrderType(type)
    setShowOrders(true)
    setPage(1)
    setSearchTerm('')
    fetchOrders(type, 1, '')
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchOrders(orderType, nextPage, searchTerm)
  }

  const handleSearch = () => {
    setSearching(true)
    setPage(1)
    fetchOrders(orderType, 1, searchTerm)
    setSearching(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleOrderClick = (order) => {
    if (order.client_id) {
      navigate(`/clients/${order.client_id}`)
    }
  }

  const isAdmin = directRole === 'admin' || 
                  profile?.role === 'admin' || 
                  user?.email === 'admin@gmail.com' ||
                  user?.email === 'admin@company.com'

  const statCards = [
    { 
      label: 'Total Clients', 
      value: stats.clients, 
      icon: '👥', 
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      onClick: () => navigate('/clients')
    },
    { 
      label: 'Active Orders', 
      value: stats.activeOrders, 
      icon: '📋', 
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      onClick: () => handleViewOrders('pending')
    },
    { 
      label: 'Delivery Pending', 
      value: stats.deliveryPending, 
      icon: '🚚', 
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      onClick: () => handleViewOrders('delivery')
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      icon: '✅', 
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      onClick: () => handleViewOrders('completed')
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
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.email?.split('@')[0] || 'User'}!
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
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
                <span className="text-indigo-200 text-xs bg-white/10 px-3 py-1 rounded-full">
                  {user?.email}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <svg className="h-12 w-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow border border-gray-100 ${
                stat.onClick ? 'cursor-pointer hover:scale-105 transform duration-200' : ''
              }`}
              onClick={stat.onClick}
            >
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

        {/* Order List Modal */}
        {showOrders && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {orderType === 'pending' ? 'Active Orders' : 
                   orderType === 'delivery' ? 'Delivery Pending Orders' : 
                   'Completed Orders'}
                </h2>
                <button
                  onClick={() => setShowOrders(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 border-b">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by order topic, client name, or mobile number..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || loadingOrders}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Search
                  </button>
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setPage(1)
                        fetchOrders(orderType, 1, '')
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingOrders ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No orders found</p>
                    {searchTerm && (
                      <p className="text-gray-400 text-sm mt-2">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => handleOrderClick(order)}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {order.topic}
                              </h3>
                              <div className="flex gap-2 flex-wrap">
                                {order.is_completed && (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    COMPLETED
                                  </span>
                                )}
                                {order.is_delivered && (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    DELIVERED
                                  </span>
                                )}
                                {!order.is_completed && (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    PENDING
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <p className="text-sm text-gray-500">Client</p>
                                <p className="font-medium text-gray-900">
                                  {order.clients?.name || 'Unknown'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Mobile</p>
                                <p className="font-medium text-gray-900">
                                  {order.clients?.mobile_no || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Order Date</p>
                                <p className="text-gray-900">
                                  {new Date(order.order_date).toLocaleDateString()}
                                </p>
                              </div>
                              {order.delivery_date && (
                                <div>
                                  <p className="text-sm text-gray-500">Delivery Date</p>
                                  <p className="text-gray-900">
                                    {new Date(order.delivery_date).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-gray-500">Total Price</p>
                                <p className="font-semibold text-gray-900">
                                  Rs {order.total_price}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Advance Payment</p>
                                <p className="text-gray-900">
                                  Rs {order.advance_payment}
                                </p>
                              </div>
                              {order.remaining_payment > 0 && (
                                <div>
                                  <p className="text-sm text-gray-500">Remaining</p>
                                  <p className="font-semibold text-red-600">
                                    Rs {order.remaining_payment}
                                  </p>
                                </div>
                              )}
                            </div>
                            {order.description && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500">Description</p>
                                <p className="text-gray-600 text-sm">{order.description}</p>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMore && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingOrders}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {loadingOrders ? 'Loading...' : 'Load More Orders'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {isAdmin && (
            <Link
              to="/admin/users"
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-200 border border-gray-100"
            >
              <div className="flex items-start">
                <div className="bg-purple-50 rounded-xl p-3 mr-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <p className="text-gray-500 text-sm mt-1">Create and manage employee accounts</p>
                  <span className="inline-flex items-center mt-2 text-purple-600 text-sm font-medium hover:text-purple-700">
                    Manage users →
                  </span>
                </div>
              </div>
            </Link>
          )}

          {!isAdmin && (
            <Link
              to="/clients/new"
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-200 border border-gray-100"
            >
              <div className="flex items-start">
                <div className="bg-green-50 rounded-xl p-3 mr-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Client</h3>
                  <p className="text-gray-500 text-sm mt-1">Add a new client to the system</p>
                  <span className="inline-flex items-center mt-2 text-green-600 text-sm font-medium hover:text-green-700">
                    Add client →
                  </span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
