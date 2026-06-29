import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrderList from '../orders/OrderList'
import OrderForm from '../orders/OrderForm'
import { useAuth } from '../../context/AuthContext'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const { isAdmin } = useAuth()

  useEffect(() => {
    fetchClientData()
  }, [id])

  const fetchClientData = async () => {
    try {
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Fetch orders for this client
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
        className="mb-4 text-indigo-600 hover:text-indigo-800"
      >
        ← Back to Clients
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-gray-600">Phone: {client.mobile_no}</p>
          <p className="text-gray-600">Address: {client.address}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Edit Client
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Orders</h2>
        <button
          onClick={handleNewOrderClick}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          {showOrderForm ? 'Cancel' : 'Add New Order'}
        </button>
      </div>

      {showOrderForm && (
        <div className="mb-6">
          <OrderForm
            clientId={id}
            onSuccess={handleOrderCreated}
            onCancel={handleNewOrderClick}
          />
        </div>
      )}

      {editingOrder && (
        <div className="mb-6">
          <OrderForm
            clientId={id}
            order={editingOrder}
            onSuccess={handleOrderUpdated}
            onCancel={() => setEditingOrder(null)}
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
