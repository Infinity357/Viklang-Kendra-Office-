import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useAuth } from '../../context/AuthContext'

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { isAdmin } = useAuth()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,mobile_no.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    fetchClients()
  }

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-500 mt-1">Manage all your clients and their orders</p>
          </div>
          <Link
            to="/clients/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Client
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Client Grid */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500">Add your first client to get started</p>
            <Link
              to="/clients/new"
              className="inline-block mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Add Client
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all hover:scale-105 transform duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-indigo-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-indigo-600 transition-colors">
                      View →
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {client.mobile_no}
                  </p>
                  {client.address && (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-1">{client.address}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
