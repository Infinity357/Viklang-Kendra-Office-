import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function OrderForm({ clientId, onSuccess, onCancel, order }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    order_date: new Date().toISOString().split('T')[0],
    total_price: '',
    advance_payment: '0',
    remaining_payment: '0',
  })

  // Initialize form with order data if editing
  useEffect(() => {
    if (order) {
      setFormData({
        topic: order.topic || '',
        description: order.description || '',
        order_date: order.order_date || new Date().toISOString().split('T')[0],
        total_price: order.total_price || '',
        advance_payment: order.advance_payment || '0',
        remaining_payment: order.remaining_payment || '0',
      })
    }
  }, [order])

  // Auto-calculate remaining payment when total or advance changes
  useEffect(() => {
    const total = parseFloat(formData.total_price) || 0
    const advance = parseFloat(formData.advance_payment) || 0
    const remaining = Math.max(0, total - advance)
    
    setFormData(prev => ({
      ...prev,
      remaining_payment: remaining.toFixed(2)
    }))
  }, [formData.total_price, formData.advance_payment])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const totalPrice = parseFloat(formData.total_price) || 0
      const advancePayment = parseFloat(formData.advance_payment) || 0
      const remainingPayment = Math.max(0, totalPrice - advancePayment)

      const orderData = {
        topic: formData.topic,
        description: formData.description,
        order_date: formData.order_date,
        total_price: totalPrice,
        advance_payment: advancePayment,
        remaining_payment: remainingPayment,
        client_id: clientId,
        is_completed: false,
        is_delivered: false,
      }

      let error
      if (order) {
        // Update existing order
        const { error: updateError } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', order.id)
        error = updateError
      } else {
        // Create new order
        const { error: insertError } = await supabase
          .from('orders')
          .insert([orderData])
        error = insertError
      }

      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error('Error saving order:', error)
      setError('Failed to save order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{order ? 'Edit Order' : 'New Order'}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Topic</label>
          <input
            type="text"
            name="topic"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.topic}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Order Date</label>
          <input
            type="date"
            name="order_date"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.order_date}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Total Price</label>
          <input
            type="number"
            name="total_price"
            required
            step="0.01"
            min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.total_price}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Advance Payment</label>
            <input
              type="number"
              name="advance_payment"
              step="0.01"
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.advance_payment}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Remaining Payment</label>
            <input
              type="number"
              name="remaining_payment"
              step="0.01"
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
              value={formData.remaining_payment}
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated: Total - Advance</p>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
