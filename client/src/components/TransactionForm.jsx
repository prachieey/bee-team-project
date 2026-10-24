// src/components/TransactionForm.jsx
// Controlled form for adding / editing a personal transaction
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react';
import './TransactionForm.css';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

function TransactionForm({
  initialData = null,
  defaultType = 'expense',
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount || '');
      setCategory(initialData.category || (initialData.type === 'income' ? 'Salary' : 'Food'));
      setDate(
        initialData.date
          ? initialData.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setDescription(initialData.description || '');
      setErrors({});
    } else {
      setType(defaultType || 'expense');
      setCategory(defaultType === 'income' ? 'Salary' : 'Food');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setErrors({});
    }
  }, [initialData, defaultType]);

  const handleTypeToggle = (newType) => {
    setType(newType);
    setCategory(newType === 'income' ? 'Salary' : 'Food');
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  const validate = () => {
    const errs = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than ₹0.';
    }
    if (!category.trim()) {
      errs.category = 'Category selection is required.';
    }
    if (!date) {
      errs.date = 'Transaction date is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      date,
      description: description.trim(),
    });
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} noValidate className="premium-form">
      {/* Type Segmented Pill Toggle */}
      <div className="type-toggle-container">
        <button
          type="button"
          className={`type-toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
          onClick={() => handleTypeToggle('expense')}
        >
          <TrendingDown size={16} />
          <span>Expense</span>
        </button>
        <button
          type="button"
          className={`type-toggle-btn income ${type === 'income' ? 'active' : ''}`}
          onClick={() => handleTypeToggle('income')}
        >
          <TrendingUp size={16} />
          <span>Income</span>
        </button>
      </div>

      <div className="form-grid">
        {/* Amount Input with Currency Symbol */}
        <div className="form-group">
          <label htmlFor="txn-amount">Amount (₹)</label>
          <div className="input-with-icon">
            <span className="input-prefix">₹</span>
            <input
              id="txn-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={errors.amount ? 'has-error' : ''}
              autoFocus={!initialData}
            />
          </div>
          {errors.amount && (
            <span className="field-error">
              <AlertCircle size={13} /> {errors.amount}
            </span>
          )}
        </div>

        {/* Category Select */}
        <div className="form-group">
          <label htmlFor="txn-category">Category</label>
          <div className="input-with-icon">
            <span className="input-prefix">
              <Tag size={15} />
            </span>
            <select
              id="txn-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={errors.category ? 'has-error' : ''}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {errors.category && (
            <span className="field-error">
              <AlertCircle size={13} /> {errors.category}
            </span>
          )}
        </div>

        {/* Date Input */}
        <div className="form-group">
          <label htmlFor="txn-date">Date</label>
          <div className="input-with-icon">
            <span className="input-prefix">
              <Calendar size={15} />
            </span>
            <input
              id="txn-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={errors.date ? 'has-error' : ''}
            />
          </div>
          {errors.date && (
            <span className="field-error">
              <AlertCircle size={13} /> {errors.date}
            </span>
          )}
        </div>

        {/* Description Input */}
        <div className="form-group">
          <label htmlFor="txn-desc">Description (Optional)</label>
          <div className="input-with-icon">
            <span className="input-prefix">
              <FileText size={15} />
            </span>
            <input
              id="txn-desc"
              type="text"
              placeholder="e.g. Grocery shopping, Monthly rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialData ? 'Update Transaction' : 'Save Transaction'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default TransactionForm;
