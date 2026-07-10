// src/components/orders/OrderForm.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function OrderForm({ clientId, order, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    registration_no: '',
    description: '',
    order_date: new Date().toISOString().split('T')[0],
    total_price: '',
    advance_payment: '',
    remaining_payment: 0
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (order) {
      setFormData({
        topic: order.topic || '',
        registration_no: order.registration_no || '',
        description: order.description || '',
        order_date: order.order_date || new Date().toISOString().split('T')[0],
        total_price: order.total_price || '',
        advance_payment: order.advance_payment || '',
        remaining_payment: order.remaining_payment || 0
      })
    }
  }, [order])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // For registration_no, only allow numbers
    if (name === 'registration_no') {
      const numericValue = value.replace(/[^0-9]/g, '')
      setFormData(prev => ({ ...prev, [name]: numericValue }))
      return
    }
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Auto-calculate remaining payment
      if (name === 'total_price' || name === 'advance_payment') {
        const total = parseFloat(newData.total_price) || 0
        const advance = parseFloat(newData.advance_payment) || 0
        newData.remaining_payment = Math.max(0, total - advance)
      }
      
      return newData
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const total = parseFloat(formData.total_price) || 0
      const advance = parseFloat(formData.advance_payment) || 0
      const remaining = Math.max(0, total - advance)

      const orderData = {
        client_id: clientId,
        topic: formData.topic.trim(),
        registration_no: formData.registration_no.trim(),
        description: formData.description.trim(),
        order_date: formData.order_date,
        total_price: total,
        advance_payment: advance,
        remaining_payment: remaining,
        updated_at: new Date()
      }

      if (order) {
        // Update existing order
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', order.id)

        if (error) throw error
      } else {
        // Create new order
        const { error } = await supabase
          .from('orders')
          .insert([{
            ...orderData,
            is_completed: false,
            is_delivered: false,
            created_at: new Date()
          }])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving order:', error)
      setError(error.message || 'Failed to save order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">{order ? 'Edit Order' : 'New Order'}</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="topic"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            value={formData.topic}
            onChange={handleChange}
            placeholder="Enter order topic"
          />
        </div>

        {/* Registration No. - Numbers Only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration No. <span className="text-xs text-gray-500">(Numbers only)</span>
          </label>
          <input
            type="text"
            name="registration_no"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            value={formData.registration_no}
            onChange={handleChange}
            placeholder="Enter registration number (numbers only)"
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter order description"
          />
        </div>

        {/* Order Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="order_date"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            value={formData.order_date}
            onChange={handleChange}
          />
        </div>

        {/* Total Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="total_price"
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            value={formData.total_price}
            onChange={handleChange}
            placeholder="Enter total price"
          />
        </div>

        {/* Advance Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Advance Payment
          </label>
          <input
            type="number"
            name="advance_payment"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            value={formData.advance_payment}
            onChange={handleChange}
            placeholder="Enter advance payment"
          />
        </div>

        {/* Remaining Payment (Auto-calculated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remaining Payment
          </label>
          <input
            type="text"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
            value={`₹${formData.remaining_payment.toFixed(2)}`}
          />
          <p className="text-xs text-gray-500 mt-1">Auto-calculated: Total - Advance</p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {order ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              order ? 'Update Order' : 'Create Order'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
