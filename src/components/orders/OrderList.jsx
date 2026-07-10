// src/components/orders/OrderList.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { toDisplayDate } from '../../utils/dateUtils'

export default function OrderList({ orders, onStatusChange, onEdit, onDelete, showClientInfo = false }) {
  const [loading, setLoading] = useState(null)
  const [editingPayment, setEditingPayment] = useState(null)
  const [paymentData, setPaymentData] = useState({
    advance_payment: '',
    remaining_payment: ''
  })
  const { isAdmin } = useAuth()

  const handleComplete = async (orderId) => {
    setLoading(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          is_completed: true,
          is_delivered: false,
          updated_at: new Date()
        })
        .eq('id', orderId)

      if (error) throw error
      onStatusChange()
    } catch (error) {
      console.error('Error marking order as completed:', error)
      alert('Failed to mark order as completed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleDeliver = async (orderId) => {
    setLoading(orderId)
    try {
      const order = orders.find(o => o.id === orderId)
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          is_completed: true,
          is_delivered: true,
          delivery_date: new Date().toISOString().split('T')[0],
          advance_payment: order.total_price,
          remaining_payment: 0,
          updated_at: new Date()
        })
        .eq('id', orderId)

      if (error) throw error
      onStatusChange()
    } catch (error) {
      console.error('Error marking order as delivered:', error)
      alert('Failed to mark order as delivered. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handlePaymentUpdate = async (orderId) => {
    setLoading(orderId)
    try {
      const order = orders.find(o => o.id === orderId)
      const newAdvance = parseFloat(paymentData.advance_payment) || 0
      const newRemaining = Math.max(0, order.total_price - newAdvance)

      const { error } = await supabase
        .from('orders')
        .update({
          advance_payment: newAdvance,
          remaining_payment: newRemaining,
          updated_at: new Date()
        })
        .eq('id', orderId)

      if (error) throw error
      setEditingPayment(null)
      onStatusChange()
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Failed to update payment. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const openPaymentEditor = (order) => {
    setEditingPayment(order.id)
    setPaymentData({
      advance_payment: order.advance_payment,
      remaining_payment: order.remaining_payment
    })
  }

  const getStatusBadge = (order) => {
    if (order.is_delivered) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          DELIVERED
        </span>
      )
    } else if (order.is_completed) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          COMPLETED
        </span>
      )
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          PENDING
        </span>
      )
    }
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders found.
      </div>
    )
  }

  // Sort orders by order_date in descending order (newest first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.order_date)
    const dateB = new Date(b.order_date)
    return dateB - dateA
  })

  return (
    <div className="space-y-4">
      {sortedOrders.map((order) => {
        // Format dates using toDisplayDate
        const formattedOrderDate = toDisplayDate(order.order_date)
        const formattedDeliveryDate = order.delivery_date ? toDisplayDate(order.delivery_date) : null
        
        return (
          <div key={order.id} className="bg-white rounded-lg shadow p-4 relative">
            {/* Delete Button - Top Right */}
            <button
              onClick={() => onDelete(order)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
              title="Delete Order"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <div className="flex flex-col pr-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{order.topic}</h3>
                  {/* Registration No. - 85% size of topic (text-base) and Bold */}
                  {order.registration_no && (
                    <p className="text-base font-bold text-gray-700 mt-0.5">
                      Reg No: {order.registration_no}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {getStatusBadge(order)}
                </div>
              </div>

              {/* Client Info */}
              {showClientInfo && order.clients && (
                <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Client:</span> {order.clients.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Mobile:</span> {order.clients.mobile_no}
                  </p>
                </div>
              )}

              {/* Description */}
              <p className="text-gray-600 text-sm mt-1">{order.description}</p>

              {/* Details Grid - USING FORMATTED DATES */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Order Date:</span>
                  <span className="ml-2 font-medium">
                    {formattedOrderDate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    Rs {order.total_price}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Advance:</span>
                  <span className="ml-2">Rs {order.advance_payment}</span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining:</span>
                  <span className={`ml-2 font-semibold ${
                    order.remaining_payment > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Rs {order.remaining_payment}
                  </span>
                </div>
                {formattedDeliveryDate && (
                  <div className="col-span-full">
                    <span className="text-gray-500">Delivery Date:</span>
                    <span className="ml-2 font-medium">
                      {formattedDeliveryDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Editor */}
              {editingPayment === order.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold mb-2">Update Payment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600">Advance Payment</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={order.total_price}
                        className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                        value={paymentData.advance_payment}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          const maxVal = order.total_price
                          const newAdvance = Math.min(val, maxVal)
                          setPaymentData({
                            advance_payment: newAdvance,
                            remaining_payment: Math.max(0, order.total_price - newAdvance)
                          })
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Remaining Payment</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-gray-100"
                        value={paymentData.remaining_payment}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handlePaymentUpdate(order.id)}
                      disabled={loading === order.id}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      {loading === order.id ? 'Updating...' : 'Update Payment'}
                    </button>
                    <button
                      onClick={() => setEditingPayment(null)}
                      className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end mt-4">
                {!order.is_completed && (
                  <>
                    <button
                      onClick={() => handleComplete(order.id)}
                      disabled={loading === order.id}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleDeliver(order.id)}
                      disabled={loading === order.id}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Deliver
                    </button>
                    <button
                      onClick={() => openPaymentEditor(order)}
                      disabled={loading === order.id}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Adjust Payment
                    </button>
                    <button
                      onClick={() => onEdit(order)}
                      className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Edit Order
                    </button>
                  </>
                )}
                
                {order.is_completed && !order.is_delivered && (
                  <>
                    <button
                      onClick={() => handleDeliver(order.id)}
                      disabled={loading === order.id}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Mark as Delivered
                    </button>
                    <button
                      onClick={() => openPaymentEditor(order)}
                      disabled={loading === order.id}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Adjust Payment
                    </button>
                    <button
                      onClick={() => onEdit(order)}
                      className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Edit Order
                    </button>
                  </>
                )}

                {order.is_completed && order.is_delivered && (
                  <>
                    <span className="text-xs text-green-600 font-medium px-2 py-1">
                      Payment Completed
                    </span>
                    <button
                      onClick={() => onEdit(order)}
                      className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Edit Order
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
