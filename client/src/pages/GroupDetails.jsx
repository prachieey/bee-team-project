// src/pages/GroupDetails.jsx
// Detailed view of a group: expense history, add/edit expense, and member details
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getGroup,
  getGroupExpenses,
  createGroupExpense,
  updateGroupExpense,
  deleteGroupExpense,
} from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import GroupExpenseForm from '../components/GroupExpenseForm';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  PlusCircle,
  Scale,
  Users2,
  Pencil,
  Trash2,
  ReceiptText,
  X,
  CreditCard,
} from 'lucide-react';
import './GroupDetails.css';

function GroupDetails({ onToast }) {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalExpenseId, setDeleteModalExpenseId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [groupRes, expRes] = await Promise.all([
        getGroup(groupId),
        getGroupExpenses(groupId),
      ]);
      setGroup(groupRes.data.data);
      setExpenses(expRes.data.data || []);
    } catch (err) {
      console.error('Failed to load group details:', err);
      onToast?.('Could not load group details.', 'error');
    } finally {
      setLoading(false);
    }
  }, [groupId, onToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExpenseSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await updateGroupExpense(groupId, editingExpense._id, formData);
        onToast?.('Group expense updated successfully!', 'success');
        setEditingExpense(null);
      } else {
        await createGroupExpense(groupId, formData);
        onToast?.('Group expense added successfully!', 'success');
        setShowAddForm(false);
      }
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save group expense.';
      onToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deleteModalExpenseId) return;
    try {
      await deleteGroupExpense(groupId, deleteModalExpenseId);
      onToast?.('Expense deleted.', 'info');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete expense.';
      onToast?.(msg, 'error');
    } finally {
      setDeleteModalExpenseId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage={true} size="lg" />;
  }

  if (!group) {
    return (
      <div className="container">
        <div className="section-card">
          <h2>Group Not Found</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            This group may have been removed or you do not have permission to view it.
          </p>
          <Link to="/groups" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  const totalGroupExpenses = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="container">
      {/* Back Navigation & Page Header */}
      <div className="page-header">
        <div>
          <Link to="/groups" className="back-link">
            <ArrowLeft size={15} />
            <span>Back to Groups</span>
          </Link>
          <h1 className="page-title">{group.name}</h1>
          <p className="page-subtitle">
            {group.members?.length} members enrolled • Total Group Spend: <strong>{formatCurrency(totalGroupExpenses)}</strong>
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setEditingExpense(null);
              setShowAddForm(!showAddForm);
            }}
          >
            {showAddForm || editingExpense ? (
              <>
                <X size={16} />
                <span>Close Form</span>
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                <span>Add Expense</span>
              </>
            )}
          </button>
          <Link to={`/groups/${groupId}/settlement`} className="btn-secondary">
            <Scale size={16} />
            <span>View Settlement</span>
          </Link>
        </div>
      </div>

      {/* Group Members Bar */}
      <section className="section-card members-bar-card" aria-label="Group members">
        <div className="members-bar-content">
          <span className="members-bar-label">
            <Users2 size={16} />
            <span>Members ({group.members?.length}):</span>
          </span>
          <div className="members-pills-list">
            {group.members?.map((m) => {
              const isCurrentUser = (m._id || m) === user?._id;
              return (
                <div key={m._id} className="member-avatar-chip">
                  <div className="avatar-circle sm">
                    {getInitials(m.name || m.email)}
                  </div>
                  <span className="chip-name">
                    {m.name || m.email} {isCurrentUser && <span className="chip-you">(You)</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add / Edit Expense Form Section */}
      {(showAddForm || editingExpense) && (
        <section className="section-card form-reveal" aria-label="Group expense form">
          <div className="card-title">
            <span>{editingExpense ? '✏️ Edit Group Expense' : 'Add Group Expense'}</span>
            <button
              className="btn-ghost btn-sm"
              onClick={() => {
                setShowAddForm(false);
                setEditingExpense(null);
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <GroupExpenseForm
            groupMembers={group.members || []}
            initialData={editingExpense}
            onSubmit={handleExpenseSubmit}
            onCancel={() => {
              setShowAddForm(false);
              setEditingExpense(null);
            }}
            isSubmitting={isSubmitting}
          />
        </section>
      )}

      {/* Expenses History List */}
      <section className="section-card" aria-label="Group expenses history">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ReceiptText size={18} color="var(--accent)" />
            <span>Recorded Group Expenses</span>
          </div>
          <span className="total-stat-pill">
            {expenses.length} expense{expenses.length === 1 ? '' : 's'}
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-state">
            <ReceiptText className="empty-state-icon" />
            <p>No expenses added to this group yet.</p>
            <span className="empty-state-sub">
              Add meals, rentals, or tickets. SettleUp will compute who owes whom automatically.
            </span>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowAddForm(true)}
              style={{ marginTop: '1.25rem' }}
            >
              <PlusCircle size={14} /> Add First Group Expense
            </button>
          </div>
        ) : (
          <div className="group-expenses-list">
            {expenses.map((expense) => {
              const payerName = expense.paidBy?.name || 'Member';
              const isPayer =
                (expense.paidBy?._id || expense.paidBy)?.toString() === user?._id?.toString();
              const isCreator =
                (expense.createdBy?._id || expense.createdBy)?.toString() === user?._id?.toString();
              const isGroupAdmin =
                (group.createdBy?._id || group.createdBy)?.toString() === user?._id?.toString();
              const canDelete = isCreator || isGroupAdmin;

              // Find current user's individual share
              const userParticipant = expense.participants?.find(
                (p) => (p.userId?._id || p.userId)?.toString() === user?._id?.toString()
              );
              const userShare = userParticipant?.share || 0;

              return (
                <div key={expense._id} className="expense-item-card">
                  <div className="expense-item-header">
                    <div className="expense-item-left">
                      <div className="expense-icon-badge">
                        <CreditCard size={18} color="var(--accent)" />
                      </div>
                      <div>
                        <h3 className="expense-item-title">{expense.title}</h3>
                        <div className="expense-item-meta">
                          <span>
                            Paid by <strong>{payerName} {isPayer && '(You)'}</strong>
                          </span>
                          <span className="meta-bullet">•</span>
                          <span>{formatDate(expense.date)}</span>
                          <span className="meta-bullet">•</span>
                          <span className="split-type-badge">{expense.splitType} split</span>
                        </div>
                      </div>
                    </div>

                    <div className="expense-item-amount-col">
                      <span className="expense-total-amount">
                        {formatCurrency(expense.totalAmount)}
                      </span>
                      {userParticipant && (
                        <span className="expense-your-share">
                          Your share: {formatCurrency(userShare)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Participants breakdown */}
                  <div className="expense-participants-tray">
                    <span className="tray-label">Split Breakdown:</span>
                    <div className="tray-pills">
                      {expense.participants?.map((p, idx) => (
                        <div key={idx} className="participant-chip">
                          <span className="chip-member-name">
                            {p.userId?.name || 'Member'}:
                          </span>
                          <span className="chip-share-amount">
                            {formatCurrency(p.share)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="expense-item-actions">
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        setEditingExpense(expense);
                        setShowAddForm(false);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      title="Edit expense"
                    >
                      <Pencil size={14} />
                      <span>Edit</span>
                    </button>
                    {canDelete && (
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => setDeleteModalExpenseId(expense._id)}
                        title="Delete expense"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Accessible Confirmation Modal for Delete Expense */}
      <ConfirmModal
        isOpen={Boolean(deleteModalExpenseId)}
        title="Delete Expense"
        message="Are you sure you want to delete this group expense? Group settlement debts will be recalculated immediately."
        confirmText="Delete Expense"
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setDeleteModalExpenseId(null)}
      />
    </div>
  );
}

export default GroupDetails;
