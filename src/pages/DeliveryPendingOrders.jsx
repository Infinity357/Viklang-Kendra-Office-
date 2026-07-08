import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import OrderList from '../components/orders/OrderList'
import SearchBar from '../components/clients/SearchBar'

export default function DeliveryPendingOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          clients:client_id (
            name,
            mobile_no,
            address
          )
        `)
        .eq('is_completed', true)
        .eq('is_delivered', false)
        .order('order_date', { ascending: false })

      if (searchTerm) {
        query = query.or(`topic.ilike.%${searchTerm}%,clients.name.ilike.%${searchTerm}%,clients.mobile_no.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching delivery pending orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    fetchOrders()
  }

  const handleStatusChange = () => {
    fetchOrders()
  }

  const handleEditOrder = (order) => {
    window.location.href = `/clients/${order.client_id}`
  }

  if (loading) {
    return <div className="text-center py-8">Loading delivery pending orders...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Delivery Pending Orders</h1>
      
      <SearchBar onSearch={handleSearch} placeholder="Search by order topic, client name, or mobile number..." />
      
      <div className="mt-6">
        <OrderList
          orders={orders}
          onStatusChange={handleStatusChange}
          onEdit={handleEditOrder}
          showClientInfo={true}
        />
      </div>
    </div>
  )
}
