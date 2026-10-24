// src/pages/Groups.jsx
// Group management: list, create, and manage groups
import { useState, useEffect } from 'react';
import { getGroups, createGroup, deleteGroup } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import GroupCard from '../components/GroupCard';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users2, PlusCircle, UserPlus, X, AlertCircle } from 'lucide-react';
import './Groups.css';

function Groups({ onToast }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteModalGroupId, setDeleteModalGroupId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await getGroups();
      setGroups(res.data.data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      onToast?.('Could not load groups. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Group name is required.');
      return;
    }

    // Split emails by comma or newline
    const emails = memberEmails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter((e) => Boolean(e) && e.toLowerCase() !== user?.email?.toLowerCase());

    setIsSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        memberEmails: emails,
      });
      onToast?.(`Group "${name}" created successfully!`, 'success');
      setName('');
      setMemberEmails('');
      setShowCreate(false);
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create group.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deleteModalGroupId) return;
    try {
      await deleteGroup(deleteModalGroupId);
      onToast?.('Group deleted successfully.', 'info');
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete group.';
      onToast?.(msg, 'error');
    } finally {
      setDeleteModalGroupId(null);
    }
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expense Groups</h1>
          <p className="page-subtitle">
            Split group bills, shared apartments, or travel expenses with friends
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? (
            <>
              <X size={16} />
              <span>Close Form</span>
            </>
          ) : (
            <>
              <PlusCircle size={16} />
              <span>Create New Group</span>
            </>
          )}
        </button>
      </div>

      {/* Create Group Form Card */}
      {showCreate && (
        <section className="section-card form-reveal" aria-label="Create group form">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} color="var(--accent)" />
              <span>Create a New Expense Group</span>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => setShowCreate(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {formError && (
            <div className="form-alert error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateGroup}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="group-name">Group Name</label>
              <input
                id="group-name"
                type="text"
                placeholder="e.g. Goa Trip 2026, Flat 402 Expenses, Weekend Outing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="group-members">
                Add Members by Email (comma or newline separated)
              </label>
              <textarea
                id="group-members"
                rows="3"
                placeholder="friend1@example.com, friend2@example.com"
                value={memberEmails}
                onChange={(e) => setMemberEmails(e.target.value)}
              />
              <span className="form-hint">
                You ({user?.email}) will automatically be added as the group administrator.
              </span>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Group…' : 'Create Group'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Groups Directory Grid */}
      <section aria-label="All user groups">
        {loading ? (
          <LoadingSpinner size="md" />
        ) : groups.length === 0 ? (
          <div className="section-card">
            <div className="empty-state">
              <Users2 className="empty-state-icon" />
              <p>You aren't a member of any groups yet.</p>
              <span className="empty-state-sub">
                Create a group above or ask a friend to add your email ({user?.email}) to their group.
              </span>
              <button
                className="btn-primary btn-sm"
                onClick={() => setShowCreate(true)}
                style={{ marginTop: '1.25rem' }}
              >
                <PlusCircle size={14} /> Create Your First Group
              </button>
            </div>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                currentUserId={user?._id}
                onDelete={(id) => setDeleteModalGroupId(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Accessible Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteModalGroupId)}
        title="Delete Expense Group"
        message="Are you sure you want to delete this group? All recorded expenses and settlement calculations for this group will be permanently removed."
        confirmText="Delete Group"
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => setDeleteModalGroupId(null)}
      />
    </div>
  );
}

export default Groups;
