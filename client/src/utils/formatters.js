// src/utils/formatters.js
// Currency and date formatting helpers
// Demonstrates: Intl API, template literals, pure functions (Lecture 3, 7)

/**
 * Format a number as Indian Rupee currency
 * @param {number} amount
 * @returns {string}  e.g. "₹1,200.50"
 */
export const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a Date or ISO string to "DD MMM YYYY"
 * @param {string|Date} dateInput
 * @returns {string}  e.g. "23 Oct 2026"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  return new Date(dateInput).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
};

/**
 * Format a Date to "YYYY-MM-DD" for <input type="date">
 * @param {string|Date} dateInput
 * @returns {string}
 */
export const toInputDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toISOString().split('T')[0];
};

/**
 * Return today's date in "YYYY-MM-DD" format (for default date fields)
 */
export const todayInputDate = () => new Date().toISOString().split('T')[0];
