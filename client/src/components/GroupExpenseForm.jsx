// src/components/GroupExpenseForm.jsx
// Form to add or edit an expense inside a group with live split calculation
import { useState, useEffect } from 'react';
import SplitCalculator from './SplitCalculator';
import { Tag, Calendar, User, AlertCircle } from 'lucide-react';

function GroupExpenseForm({
  groupMembers = [],
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [customShares, setCustomShares] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAmount(initialData.totalAmount || '');
      setDate(
        initialData.date
          ? initialData.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setPaidBy(initialData.paidBy?._id || initialData.paidBy || '');

      const memberIds =
        initialData.participants?.map((p) => p.userId?._id || p.userId) || [];
      setSelectedMembers(memberIds);

      const sharesObj = {};
      initialData.participants?.forEach((p) => {
        const id = p.userId?._id || p.userId;
        sharesObj[id] = p.share;
      });
      setCustomShares(sharesObj);
      setSplitType(initialData.splitType || 'equal');
    } else {
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      if (groupMembers.length > 0) {
        setPaidBy(groupMembers[0]._id);
        setSelectedMembers(groupMembers.map((m) => m._id));
      }
      setSplitType('equal');
      setCustomShares({});
    }
  }, [initialData, groupMembers]);

  const handleMemberToggle = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleCustomShareChange = (memberId, value) => {
    setCustomShares((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const validate = () => {
    setError('');
    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Expense title is required.');
      return false;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return false;
    }
    if (!paidBy) {
      setError('Please select who paid for this expense.');
      return false;
    }
    if (selectedMembers.length === 0) {
      setError('Select at least one participant.');
      return false;
    }

    if (splitType === 'custom') {
      const totalPaise = Math.round(parsedAmount * 100);
      const customSumPaise = Object.entries(customShares).reduce((acc, [id, val]) => {
        if (selectedMembers.includes(id)) {
          return acc + Math.round((parseFloat(val) || 0) * 100);
        }
        return acc;
      }, 0);

      if (totalPaise !== customSumPaise) {
        setError(
          `Custom shares (₹${(customSumPaise / 100).toFixed(2)}) must sum exactly to the total amount (₹${parsedAmount.toFixed(2)}).`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      totalAmount: parseFloat(amount),
      date,
      paidBy,
      splitType,
      memberIds: selectedMembers,
    };

    if (splitType === 'custom') {
      payload.customShares = {};
      selectedMembers.forEach((id) => {
        payload.customShares[id] = parseFloat(customShares[id]) || 0;
      });
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="premium-form">
      {error && (
        <div className="form-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="ge-title">Expense Title</label>
          <div className="input-with-icon">
            <span className="input-prefix">
              <Tag size={15} />
            </span>
            <input
              id="ge-title"
              type="text"
              placeholder="e.g. Goa Villa Rent, Dinner at Fisherman's Wharf"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="ge-amount">Total Amount (₹)</label>
          <div className="input-with-icon">
            <span className="input-prefix">₹</span>
            <input
              id="ge-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Paid By */}
        <div className="form-group">
          <label htmlFor="ge-paidby">Paid By</label>
          <div className="input-with-icon">
            <span className="input-prefix">
              <User size={15} />
            </span>
            <select
              id="ge-paidby"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >
              {groupMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label htmlFor="ge-date">Date</label>
          <div className="input-with-icon">
            <span className="input-prefix">
              <Calendar size={15} />
            </span>
            <input
              id="ge-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Split Calculator */}
      <SplitCalculator
        members={groupMembers}
        amount={amount}
        splitType={splitType}
        onSplitTypeChange={setSplitType}
        selectedMemberIds={selectedMembers}
        onMemberToggle={handleMemberToggle}
        customShares={customShares}
        onCustomShareChange={handleCustomShareChange}
      />

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving Expense…' : initialData ? 'Update Expense' : 'Add Expense'}
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

export default GroupExpenseForm;
