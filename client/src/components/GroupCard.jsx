// src/components/GroupCard.jsx
// Displays a summary of a group with member avatar stack and admin controls
import { Link } from 'react-router-dom';
import { Users2, ReceiptText, Scale, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';
import './GroupCard.css';

function GroupCard({ group, currentUserId, onDelete }) {
  const isCreator =
    (group.createdBy?._id || group.createdBy)?.toString() === currentUserId?.toString();

  // Extract initials
  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const members = group.members || [];

  return (
    <div className="group-card">
      <div className="group-card-top">
        <div className="group-card-title-row">
          <div className="group-avatar-icon">
            <Users2 size={18} color="var(--accent)" />
          </div>
          <div className="group-title-wrapper">
            <h3 className="group-card-title">{group.name}</h3>
            <span className="group-members-count">
              {members.length} participant{members.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {isCreator && (
          <span className="creator-badge" title="You are the creator and administrator of this group">
            <ShieldCheck size={12} />
            <span>Admin</span>
          </span>
        )}
      </div>

      <div className="group-card-body">
      {/* Member List */}
      <div className="group-members-list">
        {members.slice(0, 3).map((m, idx) => (
          <div key={m._id || idx} className="member-row">
            <div className="avatar-circle sm" title={m.name || m.email || 'Member'}>
              {getInitials(m.name || m.email)}
            </div>
            <span className="member-name">{m.name || m.email}</span>
          </div>
        ))}
        {members.length > 3 && (
          <div className="member-more" title={`${members.length - 3} more members`}>+{members.length - 3} more</div>
        )}
      </div>
      </div>

      <div className="group-card-actions">
        <Link to={`/groups/${group._id}`} className="btn-primary btn-sm group-action-btn">
          <ReceiptText size={14} />
          <span>Expenses</span>
        </Link>
        <Link to={`/groups/${group._id}/settlement`} className="btn-secondary btn-sm group-action-btn">
          <Scale size={14} />
          <span>Settlement</span>
        </Link>
        {isCreator && (
          <button
            className="btn-danger btn-sm group-delete-btn"
            onClick={() => onDelete(group._id)}
            title="Delete group"
            aria-label="Delete group"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default GroupCard;
