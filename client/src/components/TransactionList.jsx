// src/components/TransactionList.jsx
// Renders the list of transactions with category icons, aligned amounts, and actions
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import { Pencil, Trash2, ReceiptText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import './TransactionList.css';

function TransactionList({ transactions = [], onEdit, onDelete }) {
  if (!transactions.length) {
    return (
      <div className="empty-state">
        <ReceiptText className="empty-state-icon" />
        <p>No matching transactions found.</p>
        <span className="empty-state-sub">
          Try clearing your search query or filters, or record a new transaction above.
        </span>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const isIncome = txn.type === 'income';
            return (
              <tr key={txn._id} className="transaction-row">
                <td className="col-date">{formatDate(txn.date)}</td>
                <td className="col-type">
                  <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                    {isIncome ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    <span>{txn.type}</span>
                  </span>
                </td>
                <td className="col-category">
                  <div className="category-cell">
                    <span className="cell-icon-bubble">
                      {getCategoryIcon(txn.category, 14)}
                    </span>
                    <span className="category-text">{txn.category}</span>
                  </div>
                </td>
                <td className="col-desc">
                  <span className="desc-text" title={txn.description || 'No description'}>
                    {txn.description || '—'}
                  </span>
                </td>
                <td className="col-amount" style={{ textAlign: 'right' }}>
                  <span className={`amount-value ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                    {isIncome ? '+' : '-'}&nbsp;{formatCurrency(txn.amount)}
                  </span>
                </td>
                <td className="col-actions" style={{ textAlign: 'right' }}>
                  <div className="actions-cluster">
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => onEdit(txn)}
                      title="Edit transaction"
                      aria-label="Edit transaction"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => onDelete(txn._id)}
                      title="Delete transaction"
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;
