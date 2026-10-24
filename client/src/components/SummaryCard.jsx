// src/components/SummaryCard.jsx
// Displays financial metric card with Lucide icons, status badges, and subtle border accents
import './SummaryCard.css';

function SummaryCard({ title, amount, type = 'neutral', statusBadge, icon, subtitle }) {
  return (
    <div className={`summary-card card-${type}`}>
      <div className="summary-card-top">
        <div className="summary-card-header">
          <span className="summary-card-title">{title}</span>
          {subtitle && <span className="summary-card-sub">{subtitle}</span>}
        </div>
        {icon && <div className={`summary-card-icon-badge icon-${type}`}>{icon}</div>}
      </div>

      <div className="summary-card-amount">{amount}</div>

      {statusBadge && (
        <div className="summary-card-footer">
          <span className={`status-badge status-${statusBadge.type || 'neutral'}`}>
            {statusBadge.text}
          </span>
        </div>
      )}
    </div>
  );
}

export default SummaryCard;
