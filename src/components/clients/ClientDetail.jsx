import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrderList from '../orders/OrderList'
import OrderForm from '../orders/OrderForm'
import { useAuth } from '../../context/AuthContext'
import { toDisplayDate } from '../../utils/dateUtils'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [isEditingClient, setIsEditingClient] = useState(false)
  const [editClientData, setEditClientData] = useState({
    name: '',
    mobile_no: '',
    address: ''
  })
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const { isAdmin } = useAuth()

  useEffect(() => {
    fetchClientData()
  }, [id])

  const fetchClientData = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (clientError) throw clientError
      setClient(clientData)
      setEditClientData({
        name: clientData.name,
        mobile_no: clientData.mobile_no,
        address: clientData.address || ''
      })

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
        .order('order_date', { ascending: false })

      if (ordersError) throw ordersError
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching client data:', error)
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderCreated = () => {
    setShowOrderForm(false)
    setEditingOrder(null)
    fetchClientData()
  }

  const handleOrderUpdated = () => {
    setEditingOrder(null)
    fetchClientData()
  }

  const handleOrderStatusChange = () => {
    fetchClientData()
  }

  const handleEditOrderClick = (order) => {
    setShowOrderForm(false)
    setEditingOrder(order)
  }

  const handleNewOrderClick = () => {
    setEditingOrder(null)
    setShowOrderForm(!showOrderForm)
  }

  const handleCancelForm = () => {
    setShowOrderForm(false)
    setEditingOrder(null)
  }

  const handleEditClientClick = () => {
    setIsEditingClient(true)
    setEditClientData({
      name: client.name,
      mobile_no: client.mobile_no,
      address: client.address || ''
    })
    setEditError('')
    setEditSuccess('')
  }

  const handleEditClientCancel = () => {
    setIsEditingClient(false)
    setEditError('')
    setEditSuccess('')
  }

  const handleEditClientChange = (e) => {
    setEditClientData({
      ...editClientData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditClientSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: editClientData.name.trim(),
          mobile_no: editClientData.mobile_no.trim(),
          address: editClientData.address.trim(),
          updated_at: new Date()
        })
        .eq('id', id)
        .select()

      if (error) {
        if (error.code === '23505') {
          throw new Error('This mobile number is already registered to another client')
        }
        throw error
      }

      setClient(data[0])
      setEditSuccess('Client information updated successfully!')
      
      setTimeout(() => {
        setIsEditingClient(false)
        setEditSuccess('')
        fetchClientData()
      }, 1500)
    } catch (error) {
      console.error('Error updating client:', error)
      setEditError(error.message || 'Failed to update client information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!client) {
    return <div className="text-center py-8">Client not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/clients')}
        className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
      >
        <span className="mr-2">←</span> Back to Clients
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {!isEditingClient ? (
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Phone:</span> {client.mobile_no}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Address:</span> {client.address}
              </p>
            </div>
            <button
              onClick={handleEditClientClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Client
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Client Information</h2>
              <button
                onClick={handleEditClientCancel}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {editSuccess}
              </div>
            )}

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {editError}
              </div>
            )}

            <form onSubmit={handleEditClientSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={editClientData.name}
                  onChange={handleEditClientChange}
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile_no"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={editClientData.mobile_no}
                  onChange={handleEditClientChange}
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={editClientData.address}
                  onChange={handleEditClientChange}
                  placeholder="Enter client address"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleEditClientCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Orders</h2>
        <button
          onClick={handleNewOrderClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          {showOrderForm ? 'Cancel' : 'Add New Order'}
        </button>
      </div>

      {(showOrderForm || editingOrder) && (
        <div className="mb-6">
          <OrderForm
            clientId={id}
            order={editingOrder}
            onSuccess={editingOrder ? handleOrderUpdated : handleOrderCreated}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      <OrderList
        orders={orders}
        onStatusChange={handleOrderStatusChange}
        onEdit={handleEditOrderClick}
        clientId={id}
      />
    </div>
  )
}
