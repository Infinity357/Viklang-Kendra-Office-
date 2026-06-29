import { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(term)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex">
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
        >
          Search
        </button>
      </div>
    </form>
  )
}
