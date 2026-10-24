// src/components/SplitCalculator.jsx
// Interactive split calculation helper for equal and custom splits with paise precision
import { formatCurrency } from '../utils/formatters';
import { Check, AlertTriangle, Users } from 'lucide-react';
import './SplitCalculator.css';

function SplitCalculator({
  members = [],
  amount = 0,
  splitType = 'equal',
  onSplitTypeChange,
  selectedMemberIds = [],
  onMemberToggle,
  customShares = {},
  onCustomShareChange,
}) {
  const parsedAmount = parseFloat(amount) || 0;
  const numSelected = selectedMemberIds.length;

  // Calculate equal share preview in paise
  const totalPaise = Math.round(parsedAmount * 100);
  const basePaise = numSelected > 0 ? Math.floor(totalPaise / numSelected) : 0;
  const remainder = numSelected > 0 ? totalPaise % numSelected : 0;

  // Calculate sum of custom shares
  const customSumPaise = Object.entries(customShares).reduce((acc, [id, val]) => {
    if (selectedMemberIds.includes(id)) {
      return acc + Math.round((parseFloat(val) || 0) * 100);
    }
    return acc;
  }, 0);

  const customDifferencePaise = totalPaise - customSumPaise;
  const isCustomValid = Math.abs(customDifferencePaise) === 0;

  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="split-calculator-box">
      {/* Split Type Segmented Control */}
      <div className="split-type-segmented">
        <button
          type="button"
          className={`split-segment-btn ${splitType === 'equal' ? 'active' : ''}`}
          onClick={() => onSplitTypeChange('equal')}
        >
          <span>Equal Split</span>
        </button>
        <button
          type="button"
          className={`split-segment-btn ${splitType === 'custom' ? 'active' : ''}`}
          onClick={() => onSplitTypeChange('custom')}
        >
          <span>Custom Split</span>
        </button>
      </div>

      {/* Member Selection */}
      <div className="member-selection-block">
        <div className="member-selection-header">
          <span className="section-label">
            Participants Included ({numSelected} of {members.length}):
          </span>
          {splitType === 'equal' && parsedAmount > 0 && numSelected > 0 && (
            <span className="equal-summary-pill">
              ≈ {formatCurrency((basePaise + (remainder > 0 ? 1 : 0)) / 100)} / person
            </span>
          )}
        </div>

        <div className="member-checkbox-list">
          {members.map((member) => {
            const isSelected = selectedMemberIds.includes(member._id);
            return (
              <label key={member._id} className={`member-check-item ${isSelected ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onMemberToggle(member._id)}
                />
                <div className="avatar-circle sm">
                  {getInitials(member.name || member.email)}
                </div>
                <div className="member-info-col">
                  <span className="member-name">{member.name || member.email}</span>
                  {splitType === 'equal' && isSelected && numSelected > 0 && (
                    <span className="member-share-hint">
                      {formatCurrency((basePaise + (remainder > 0 ? 1 : 0)) / 100)}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Custom Split Inputs */}
      {splitType === 'custom' && (
        <div className="custom-shares-panel">
          <span className="section-label">Assign Custom Share Amounts:</span>
          <div className="custom-shares-list">
            {members
              .filter((m) => selectedMemberIds.includes(m._id))
              .map((member) => (
                <div key={member._id} className="custom-share-row">
                  <div className="custom-share-member">
                    <div className="avatar-circle sm">
                      {getInitials(member.name || member.email)}
                    </div>
                    <span>{member.name || member.email}</span>
                  </div>

                  <div className="share-input-wrapper">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={customShares[member._id] ?? ''}
                      onChange={(e) => onCustomShareChange(member._id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Real-time Custom Split Balance Status */}
          <div className={`custom-validation-card ${isCustomValid ? 'valid' : 'invalid'}`}>
            <div className="validation-top">
              <span>
                Allocated: <strong>{formatCurrency(customSumPaise / 100)}</strong> / Total: <strong>{formatCurrency(parsedAmount)}</strong>
              </span>
              {isCustomValid ? (
                <span className="validation-status success">
                  <Check size={14} /> Balanced to the paise
                </span>
              ) : (
                <span className="validation-status error">
                  <AlertTriangle size={14} />
                  {customDifferencePaise > 0
                    ? `₹${(customDifferencePaise / 100).toFixed(2)} remaining`
                    : `₹${(Math.abs(customDifferencePaise) / 100).toFixed(2)} over allocated`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SplitCalculator;
