import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function OrderList({ orders, onStatusChange, onEdit }) {
  const [loading, setLoading] = useState(null)
  const { isAdmin } = useAuth()

  const handleStatusUpdate = async (orderId, newStatus) => {
    setLoading(orderId)
    try {
      const updateData = { status: newStatus, updated_at: new Date() }
      if (newStatus === 'delivered' || newStatus === 'completed') {
        updateData.delivery_date = new Date().toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error
      onStatusChange()
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders for this client yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{order.topic}</h3>
              <p className="text-gray-600 text-sm mt-1">{order.description}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Order Date:</span>
                  <span className="ml-2">{new Date(order.order_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-semibold">₹{order.total_price}</span>
                </div>
                <div>
                  <span className="text-gray-500">Advance:</span>
                  <span className="ml-2">₹{order.advance_payment}</span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining:</span>
                  <span className="ml-2 font-semibold text-red-600">₹{order.remaining_payment}</span>
                </div>
                {order.delivery_date && (
                  <div>
                    <span className="text-gray-500">Delivered:</span>
                    <span className="ml-2">{new Date(order.delivery_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2 ml-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
              
              {order.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'completed')}
                    disabled={loading === order.id}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    disabled={loading === order.id}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Deliver
                  </button>
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => onEdit(order)}
                  className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-100 transition-colors"
                >
                  Edit Order
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
