// src/pages/Transactions.jsx
// Personal Transactions Management: full CRUD, filters, search, and sorting
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionService';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusCircle,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  ReceiptText,
  X,
} from 'lucide-react';
import './Transactions.css';

const ALL_CATEGORIES = [
  'All Categories',
  'Food',
  'Travel',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Other',
];

function Transactions({ onToast }) {
  const [searchParams] = useSearchParams();
  const urlAction = searchParams.get('action'); // 'income' or 'expense'

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(urlAction));
  const [formDefaultType, setFormDefaultType] = useState(urlAction === 'income' ? 'income' : 'expense');
  const [editingTxn, setEditingTxn] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalTxnId, setDeleteModalTxnId] = useState(null);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchTxns = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter && categoryFilter !== 'All Categories') params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      params.sort = sortBy;
      params.order = sortOrder;

      const res = await getTransactions(params);
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      onToast?.('Failed to load transactions. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, searchTerm, sortBy, sortOrder, onToast]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  useEffect(() => {
    if (urlAction) {
      setShowForm(true);
      setFormDefaultType(urlAction === 'income' ? 'income' : 'expense');
    }
  }, [urlAction]);

  const handleCreateOrUpdate = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingTxn) {
        await updateTransaction(editingTxn._id, formData);
        onToast?.('Transaction updated successfully!', 'success');
        setEditingTxn(null);
        setShowForm(false);
      } else {
        await createTransaction(formData);
        onToast?.('Transaction recorded successfully!', 'success');
        setShowForm(false);
      }
      fetchTxns();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save transaction.';
      onToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalTxnId) return;
    try {
      await deleteTransaction(deleteModalTxnId);
      onToast?.('Transaction deleted.', 'info');
      fetchTxns();
    } catch (err) {
      onToast?.('Failed to delete transaction.', 'error');
    } finally {
      setDeleteModalTxnId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setCategoryFilter('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || typeFilter || categoryFilter;

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Your money <em style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>diary</em></h1>
          <p className="page-subtitle">
            Everything you've logged, in one calm place
          </p>
        </div>

        <div className="transaction-header-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setEditingTxn(null);
              setFormDefaultType('income');
              setShowForm(true);
            }}
          >
            <TrendingUp size={18} />
            <span>Log money in</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingTxn(null);
              setFormDefaultType('expense');
              setShowForm(true);
            }}
          >
            <PlusCircle size={18} />
            <span>Log a spend</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Modal / Collapsible Section */}
      {(showForm || editingTxn) && (
        <section className="section-card form-reveal" aria-label="Transaction form">
          <div className="card-title">
            <span>{editingTxn ? '✏️ Edit Transaction' : 'Record New Transaction'}</span>
            <button
              className="btn-ghost btn-sm"
              onClick={() => {
                setShowForm(false);
                setEditingTxn(null);
              }}
              aria-label="Close form"
            >
              <X size={16} />
            </button>
          </div>
          <TransactionForm
            initialData={editingTxn}
            defaultType={formDefaultType}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setShowForm(false);
              setEditingTxn(null);
            }}
            isSubmitting={isSubmitting}
          />
        </section>
      )}

      {/* Search & Filter Toolbar */}
      <section className="section-card filter-toolbar" aria-label="Filters and search">
        <div className="filters-wrapper">
          {/* Search Input */}
          <div className="filter-input-wrapper">
            <Search size={16} className="filter-icon" />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-search-input"
            />
            {searchTerm && (
              <button
                className="filter-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Select */}
          <div className="filter-select-wrapper">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          {/* Category Filter Select */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-select-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select with-icon"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c === 'All Categories' ? '' : c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="filter-select-wrapper">
            <ArrowUpDown size={14} className="filter-select-icon" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="filter-select with-icon"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="btn-secondary btn-sm" onClick={clearFilters}>
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Transaction Records List */}
      <section className="section-card" aria-label="Transaction records">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ReceiptText size={18} color="var(--accent)" />
            <span>Everything you've logged</span>
          </div>
          <span className="total-stat-pill">
            {transactions.length} record{transactions.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner size="md" />
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={(txn) => {
              setEditingTxn(txn);
              setShowForm(true);
              window.scrollTo({ top: 100, behavior: 'smooth' });
            }}
            onDelete={(id) => setDeleteModalTxnId(id)}
          />
        )}
      </section>

      {/* Accessible Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteModalTxnId)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This will adjust your overall balance and category totals."
        confirmText="Delete Transaction"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalTxnId(null)}
      />
    </div>
  );
}

export default Transactions;
