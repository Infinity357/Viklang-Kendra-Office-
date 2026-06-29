import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    mobile_no: '',
    address: '',
  })

  useEffect(() => {
    if (id) {
      fetchClient()
    }
  }, [id])

  const fetchClient = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      setFormData({
        name: data.name,
        mobile_no: data.mobile_no,
        address: data.address || '',
      })
    } catch (err) {
      console.error('Error fetching client details:', err)
      setError('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (id) {
        // Edit mode
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', id)
        if (error) throw error
        navigate(`/clients/${id}`)
      } else {
        // Create mode
        const { data, error } = await supabase
          .from('clients')
          .insert([formData])
          .select()
        if (error) throw error
        navigate(`/clients/${data[0].id}`)
      }
    } catch (error) {
      if (error.code === '23505') {
        setError('This mobile number is already registered')
      } else {
        setError(error.message || (id ? 'Failed to update client' : 'Failed to create client'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Client Details' : 'Add New Client'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            type="tel"
            name="mobile_no"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.mobile_no}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            name="address"
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.address}
            onChange={handleChange}
          />
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
            {loading ? (id ? 'Saving...' : 'Creating...') : (id ? 'Save Changes' : 'Create Client')}
          </button>
          <button
            type="button"
            onClick={() => navigate(id ? `/clients/${id}` : '/clients')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
