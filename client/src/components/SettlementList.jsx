// src/components/SettlementList.jsx
// Displays net balances and greedy settlement repayment instructions
import { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Scale,
  Check,
} from 'lucide-react';
import './SettlementList.css';

function SettlementList({ netBalances = {}, transactions = [], memberMap = {}, onToast }) {
  const [settledTxnIds, setSettledTxnIds] = useState(new Set());
  const balanceEntries = Object.entries(netBalances);

  const getMemberName = (id) => {
    return memberMap[id]?.name || memberMap[id]?.email || id;
  };

  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleMarkSettled = (index, fromName, toName, amount) => {
    setSettledTxnIds((prev) => new Set(prev).add(index));
    onToast?.(
      `Payment of ${formatCurrency(amount)} from ${fromName} to ${toName} acknowledged.`,
      'success'
    );
  };

  const isAllSettled =
    transactions.length === 0 &&
    balanceEntries.every(([, bal]) => Math.abs(bal) < 0.01);

  return (
    <div className="settlement-container">
      {/* 1. Net Balances Section */}
      <section className="settlement-section" aria-label="Group net balances">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">Who’s up, who’s down</h3>
            <p className="section-desc">
              A quick snapshot of where everyone stands.
            </p>
          </div>
          <div className="section-badge-pill">
            <Scale size={14} />
            <span>At a glance</span>
          </div>
        </div>

        {balanceEntries.length === 0 ? (
          <p className="text-muted">No expenses recorded for this group yet.</p>
        ) : (
          <div className="balances-grid">
            {balanceEntries.map(([userId, balance]) => {
              const roundedBal = Math.round(balance * 100) / 100;
              const isPositive = roundedBal > 0.005;
              const isNegative = roundedBal < -0.005;
              const isZero = !isPositive && !isNegative;
              const name = getMemberName(userId);

              return (
                <div
                  key={userId}
                  className={`balance-card ${
                    isPositive ? 'positive' : isNegative ? 'negative' : 'settled'
                  }`}
                >
                  <div className="balance-card-header">
                    <div className="avatar-circle sm">
                      {getInitials(name)}
                    </div>
                    <span className="balance-member-name" title={name}>{name}</span>
                  </div>

                  <div className="balance-amount">
                    {isPositive && `+ ${formatCurrency(roundedBal)}`}
                    {isNegative && `- ${formatCurrency(Math.abs(roundedBal))}`}
                    {isZero && formatCurrency(0)}
                  </div>

                  <div className="balance-status-row">
                    {isPositive && (
                      <span className="balance-badge positive">
                        <ArrowDownLeft size={13} />
                        <span>Gets back</span>
                      </span>
                    )}
                    {isNegative && (
                      <span className="balance-badge negative">
                        <ArrowUpRight size={13} />
                        <span>Owes group</span>
                      </span>
                    )}
                    {isZero && (
                      <span className="balance-badge settled">
                        <Check size={13} />
                        <span>Settled up</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Repayment Plan (Who Pays Whom) */}
      <section className="settlement-section" aria-label="Optimal repayment plan">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">The easiest way to settle</h3>
            <p className="section-desc">
              Fewer payments, less fuss, everyone square.
            </p>
          </div>
          <div className="section-badge-pill">
            <Sparkles size={14} />
            <span>Nice and simple</span>
          </div>
        </div>

        {isAllSettled ? (
          <div className="all-settled-box">
            <div className="settled-icon-circle">
              <CheckCircle2 size={36} color="var(--income-green)" />
            </div>
              <h4>All square.</h4>
              <p>Nobody owes anybody. Enjoy it.</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="all-settled-box">
            <div className="settled-icon-circle">
              <CheckCircle2 size={36} color="var(--income-green)" />
            </div>
            <h4>No Transactions Needed</h4>
            <p>All members currently have balanced shares.</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((txn, index) => {
              const fromName = txn.fromName || getMemberName(txn.from);
              const toName = txn.toName || getMemberName(txn.to);
              const isMarked = settledTxnIds.has(index);

              return (
                <div key={index} className={`repayment-card ${isMarked ? 'is-settled' : ''}`}>
                  {/* Debtor */}
                  <div className="repayment-party debtor">
                    <span className="party-role">Pays</span>
                    <div className="party-info">
                      <div className="avatar-circle sm">
                        {getInitials(fromName)}
                      </div>
                      <strong>{fromName}</strong>
                    </div>
                  </div>

                  {/* Transfer Flow & Amount */}
                  <div className="repayment-center">
                    <span className="repayment-amount-pill">
                      {formatCurrency(txn.amount)}
                    </span>
                    <div className="repayment-flow-arrow">
                      <span className="flow-line" />
                      <ArrowRight size={18} className="arrow-head" />
                    </div>
                  </div>

                  {/* Creditor */}
                  <div className="repayment-party creditor">
                    <span className="party-role">Receives</span>
                    <div className="party-info">
                      <div className="avatar-circle sm">
                        {getInitials(toName)}
                      </div>
                      <strong>{toName}</strong>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="repayment-action">
                    <button
                      className={`btn-sm ${isMarked ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleMarkSettled(index, fromName, toName, txn.amount)}
                      disabled={isMarked}
                    >
                      {isMarked ? (
                        <>
                          <Check size={14} />
                          <span>Acknowledged</span>
                        </>
                      ) : (
                        <span>Mark Paid</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default SettlementList;
