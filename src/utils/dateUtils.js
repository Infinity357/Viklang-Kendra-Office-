
/**
 * Convert any date format to DD/MM/YYYY
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const toDisplayDate = (dateInput) => {
  if (!dateInput) return ''
  
  // If it's a string, try to parse it
  if (typeof dateInput === 'string') {
    // If it's already in DD/MM/YYYY format, return as is
    if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateInput
    }
    
    // If it's in MM/DD/YYYY format (like 7/24/2026 or 07/24/2026)
    const mdMyMatch = dateInput.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdMyMatch) {
      const month = mdMyMatch[1].padStart(2, '0')
      const day = mdMyMatch[2].padStart(2, '0')
      const year = mdMyMatch[3]
      return `${day}/${month}/${year}`
    }
    
    // If it's in YYYY-MM-DD format
    const ymdMatch = dateInput.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymdMatch) {
      const year = ymdMatch[1]
      const month = ymdMatch[2].padStart(2, '0')
      const day = ymdMatch[3].padStart(2, '0')
      return `${day}/${month}/${year}`
    }
    
    // Try to parse as date string
    try {
      const date = new Date(dateInput)
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch (e) {
      // If parsing fails, return original
    }
  }
  
  // If it's a Date object
  if (dateInput instanceof Date) {
    const day = String(dateInput.getDate()).padStart(2, '0')
    const month = String(dateInput.getMonth() + 1).padStart(2, '0')
    const year = dateInput.getFullYear()
    return `${day}/${month}/${year}`
  }
  
  return String(dateInput)
}

/**
 * Format date for display (alias for toDisplayDate)
 */
export const formatDate = (dateInput) => {
  return toDisplayDate(dateInput)
}

/**
 * Get today's date in YYYY-MM-DD format for input fields
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for database storage
 */
export const toApiDate = (dateString) => {
  if (!dateString) return ''
  
  // If it's already in YYYY-MM-DD format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }
  
  // If it's in DD/MM/YYYY format
  const dmyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0')
    const month = dmyMatch[2].padStart(2, '0')
    const year = dmyMatch[3]
    return `${year}-${month}-${day}`
  }
  
  return dateString
}
