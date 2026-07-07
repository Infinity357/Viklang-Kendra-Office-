
/**
 * Format a date string or Date object to DD/MM/YYYY
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return ''
  
  let date
  if (typeof dateInput === 'string') {
    date = new Date(dateInput)
  } else if (dateInput instanceof Date) {
    date = dateInput
  } else {
    return ''
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) return ''
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for database storage
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const convertToDatabaseDate = (dateString) => {
  if (!dateString) return ''
  const parts = dateString.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateString
}

/**
 * Get today's date in YYYY-MM-DD format for input fields
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}
// src/utils/dateUtils.js

export const toDisplayDate = (dateString) => {
  if (!dateString) return ''
  
  // If it's already in DD/MM/YYYY format, return as is
  if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateString
  }
  
  // If it's in YYYY-MM-DD format, convert to DD/MM/YYYY
  const parts = dateString.split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  
  // Try to parse as date
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}
