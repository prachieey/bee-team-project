// src/pages/Dashboard.jsx
// Personal Finance & Cash Flow Dashboard
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardSummary } from '../services/dashboardService';
import SummaryCard from '../components/SummaryCard';
import FinanceChart from '../components/FinanceChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon, getTypeIcon } from '../utils/categoryIcons';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  PlusCircle,
  Users2,
  ArrowRight,
  ReceiptText,
  PieChart,
  History,
  RotateCw,
} from 'lucide-react';
import './Dashboard.css';

function Dashboard({ onToast }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await getDashboardSummary();
      setSummary(res.data.data);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Could not load financial summary. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage={true} size="lg" />;
  }

  if (error) {
    return (
      <div className="container">
        <div className="form-alert error">
          <span>{error}</span>
          <button className="btn-secondary btn-sm" onClick={fetchSummary} style={{ marginLeft: 'auto' }}>
            <RotateCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totals = {},
    categoryBreakdown = [],
    monthlySummary = [],
    recentTransactions = [],
    incomeCount = 0,
    expenseCount = 0,
  } = summary || {};

  const income = totals.income || 0;
  const expense = totals.expense || 0;
  const balance = totals.balance || 0;

  // Calculate Net Cash Flow Status Badge
  let balanceStatus = { text: 'Break Even (₹0)', type: 'neutral' };
  if (balance > 0) {
    balanceStatus = { text: `Net Surplus (+${formatCurrency(balance)})`, type: 'positive' };
  } else if (balance < 0) {
    balanceStatus = { text: `Net Deficit (-${formatCurrency(Math.abs(balance))})`, type: 'negative' };
  }

  // Calculate savings / retention rate if income exists
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

  return (
    <div className="container">
      {/* Top Header & Prominent Quick Actions */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Overview</h1>
          <p className="page-subtitle">
            Real-time cash flow, category distributions, and group activity
          </p>
        </div>

        <div className="header-actions">
          <Link to="/transactions?action=income" className="btn-secondary btn-sm">
            <TrendingUp size={15} color="var(--income-green)" />
            <span>Add Income</span>
          </Link>
          <Link to="/transactions?action=expense" className="btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>Record Expense</span>
          </Link>
          <Link to="/groups" className="btn-secondary btn-sm">
            <Users2 size={15} />
            <span>Groups</span>
          </Link>
        </div>
      </div>

      {/* 1. Summary KPI Grid */}
      <section className="summary-grid" aria-label="Financial summary cards">
        <SummaryCard
          title="Net Cash Flow"
          subtitle="Calculated from real transactions"
          amount={formatCurrency(balance)}
          type="balance"
          statusBadge={balanceStatus}
          icon={<Scale size={20} />}
        />

        <SummaryCard
          title="Total Income"
          subtitle={`${incomeCount} transaction${incomeCount === 1 ? '' : 's'}`}
          amount={formatCurrency(income)}
          type="income"
          icon={<TrendingUp size={20} />}
        />

        <SummaryCard
          title="Total Expenses"
          subtitle={`${expenseCount} transaction${expenseCount === 1 ? '' : 's'}`}
          amount={formatCurrency(expense)}
          type="expense"
          icon={<TrendingDown size={20} />}
        />
      </section>

      {/* 2. Monthly Trend Chart Section */}
      <section className="section-card chart-section-card" aria-label="Monthly cash flow chart">
        <FinanceChart monthlySummary={monthlySummary} totals={totals} />
      </section>

      {/* 3. Two-Column Layout: Expenses by Category & Recent Transactions */}
      <div className="dashboard-grid">
        {/* Expenses by Category Breakdown */}
        <section className="section-card" aria-label="Category breakdown">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="var(--accent)" />
              <span>Spending by Category</span>
            </div>
            <span className="total-stat-pill">
              Total: {formatCurrency(expense)}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="empty-state">
              <PieChart className="empty-state-icon" />
              <p>No expense categories recorded yet.</p>
              <span className="empty-state-sub">
                Expenses you log will show up with category proportions here.
              </span>
              <Link to="/transactions" className="btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
                <PlusCircle size={14} /> Add an expense
              </Link>
            </div>
          ) : (
            <div className="category-list">
              {categoryBreakdown.map((item) => {
                const percentage = expense > 0 ? Math.round((item.total / expense) * 100) : 0;
                return (
                  <div key={item._id} className="category-item">
                    <div className="category-item-header">
                      <div className="category-name-wrapper">
                        <span className="category-icon-bubble">
                          {getCategoryIcon(item._id, 14)}
                        </span>
                        <span className="category-name">{item._id}</span>
                        <span className="category-count">({item.count})</span>
                      </div>
                      <span className="category-amount">
                        <strong>{formatCurrency(item.total)}</strong>
                        <span className="category-pct">{percentage}%</span>
                      </span>
                    </div>
                    <div className="category-progress-track">
                      <div
                        className="category-progress-fill"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Transactions Feed */}
        <section className="section-card" aria-label="Recent transactions">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="var(--accent)" />
              <span>Recent Activity</span>
            </div>
            <Link to="/transactions" className="card-action-link">
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="empty-state">
              <ReceiptText className="empty-state-icon" />
              <p>No recent transactions.</p>
              <span className="empty-state-sub">
                Record income or expenses to start tracking your daily finances.
              </span>
              <Link to="/transactions" className="btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                <PlusCircle size={14} /> Record First Transaction
              </Link>
            </div>
          ) : (
            <div className="recent-list">
              {recentTransactions.map((txn) => {
                const isIncome = txn.type === 'income';
                return (
                  <div key={txn._id} className="recent-item">
                    <div className="recent-item-left">
                      <div className={`recent-icon-bubble ${isIncome ? 'income' : 'expense'}`}>
                        {getCategoryIcon(txn.category, 16)}
                      </div>
                      <div className="recent-item-info">
                        <div className="recent-item-topline">
                          <span className="recent-item-category">{txn.category}</span>
                          <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                            {txn.type}
                          </span>
                        </div>
                        <span className="recent-item-desc">
                          {txn.description || 'No description'} • {formatDate(txn.date)}
                        </span>
                      </div>
                    </div>

                    <div className="recent-item-right">
                      <span className={`recent-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                        {isIncome ? '+' : '-'}&nbsp;{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
