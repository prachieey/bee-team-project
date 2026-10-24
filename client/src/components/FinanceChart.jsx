// src/components/FinanceChart.jsx
// Interactive, responsive Income vs Expense chart built from real monthlySummary data
import { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import './FinanceChart.css';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function FinanceChart({ monthlySummary = [] }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  // Group monthly data by month index (0..11)
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i + 1,
    name: MONTH_NAMES[i],
    income: 0,
    expense: 0,
  }));

  // Populate from real server monthly aggregation
  if (Array.isArray(monthlySummary)) {
    monthlySummary.forEach((item) => {
      const m = item._id?.month;
      const type = item._id?.type;
      const total = item.total || 0;
      if (m >= 1 && m <= 12) {
        if (type === 'income') {
          monthlyData[m - 1].income += total;
        } else if (type === 'expense') {
          monthlyData[m - 1].expense += total;
        }
      }
    });
  }

  // Find max value for scaling the bars
  const maxVal = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    0 // dynamic floor based on data
  );

  const hasData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="finance-chart-container">
      <div className="finance-chart-header">
        <div>
        <h3 className="finance-chart-title">Your year so far</h3>
          <p className="finance-chart-subtitle">
            A gentle look at money in and money out
          </p>
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot income-dot" />
            <span>Income</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot expense-dot" />
            <span>Expense</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="chart-empty-state">
          <p>No monthly activity recorded for this calendar year yet.</p>
          <span className="chart-empty-hint">
            As you log income and expenses, monthly bars will dynamically appear here.
          </span>
        </div>
      ) : (
        <div className="chart-bars-wrapper">
          <div className="chart-grid-lines">
            <div className="grid-line" />
            <div className="grid-line" />
            <div className="grid-line" />
          </div>

          <div className="chart-columns">
            {monthlyData.map((d, idx) => {
              const incomeHeight = Math.min(100, Math.round((d.income / maxVal) * 100));
              const expenseHeight = Math.min(100, Math.round((d.expense / maxVal) * 100));
              const isHovered = hoveredMonth === idx;
              const hasMonthData = d.income > 0 || d.expense > 0;

              return (
                <div
                  key={d.name}
                  className={`chart-col ${hasMonthData ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredMonth(idx)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && hasMonthData && (
                    <div className="chart-tooltip">
                      <div className="tooltip-month">{d.name} {new Date().getFullYear()}</div>
                      <div className="tooltip-row text-income">
                        <span>Income:</span>
                        <strong>{formatCurrency(d.income)}</strong>
                      </div>
                      <div className="tooltip-row text-expense">
                        <span>Expense:</span>
                        <strong>{formatCurrency(d.expense)}</strong>
                      </div>
                      <div className="tooltip-row text-net">
                        <span>Net:</span>
                        <strong>{formatCurrency(d.income - d.expense)}</strong>
                      </div>
                    </div>
                  )}

                  {/* Bars Container */}
                  <div className="bars-pair">
                    <div
                      className="bar bar-income"
                      style={{ height: `${Math.max(incomeHeight, d.income > 0 ? 6 : 0)}%` }}
                      title={`Income: ${formatCurrency(d.income)}`}
                    />
                    <div
                      className="bar bar-expense"
                      style={{ height: `${Math.max(expenseHeight, d.expense > 0 ? 6 : 0)}%` }}
                      title={`Expense: ${formatCurrency(d.expense)}`}
                    />
                  </div>

                  <span className="col-label">{d.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceChart;
