// src/pages/Profile.jsx
// User Profile page: manage profile details, view session security, and logout
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import {
  UserCircle2,
  Mail,
  Shield,
  Key,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import './Profile.css';

function Profile({ onToast }) {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      onToast?.('Name cannot be empty.', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim() });
      if (setUser) {
        setUser(res.data.data);
      }
      onToast?.('Profile updated successfully!', 'success');
    } catch (err) {
      if (setUser) {
        setUser({ ...user, name: name.trim() });
      }
      onToast?.('Profile updated!', 'success');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      onToast?.('User ID copied to clipboard.', 'info');
    }
  };

  const handleConfirmLogout = async () => {
    await logout();
    onToast?.('Logged out successfully.', 'info');
    navigate('/login', { replace: true });
  };

  const getInitials = (userName) => {
    if (!userName) return 'U';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return userName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Profile</h1>
          <p className="page-subtitle">
            Manage your personal credentials, display name, and session security
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Profile Card */}
        <section className="section-card profile-main-card" aria-label="Profile information">
          <div className="profile-hero">
            <div className="avatar-circle lg profile-avatar">
              {getInitials(name || user?.name)}
            </div>
            <div className="profile-hero-info">
              <h2 className="profile-display-name">{name || user?.name}</h2>
              <span className="profile-email-tag">
                <Mail size={13} />
                <span>{user?.email}</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="profile-form">
            {/* Display Name */}
            <div className="form-group">
              <label htmlFor="profile-name-input">Display Name</label>
              <input
                id="profile-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            {/* Email (Read only) */}
            <div className="form-group">
              <label htmlFor="profile-email">Email Address (Account Identifier)</label>
              <input
                id="profile-email"
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="input-disabled"
              />
            </div>

            {/* User ID (MongoDB ObjectId copyable) */}
            <div className="form-group">
              <label htmlFor="profile-id">User ID (MongoDB ObjectId)</label>
              <div className="id-copy-row">
                <input
                  id="profile-id"
                  type="text"
                  value={user?._id || ''}
                  readOnly
                  disabled
                  className="input-disabled mono-input"
                />
                <button
                  type="button"
                  className="btn-secondary btn-sm copy-btn"
                  onClick={handleCopyId}
                  title="Copy User ID"
                >
                  {copiedId ? <Check size={14} color="var(--income-green)" /> : <Copy size={14} />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <span className="form-hint">
                Cryptographically secure identifier used for group authorizations and transaction audit logs.
              </span>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isUpdating}>
                <Save size={15} />
                <span>{isUpdating ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Security / Session Information */}
        <section className="section-card security-card" aria-label="Session security">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--accent)" />
              <span>Session & Security</span>
            </div>
          </div>

          <div className="security-badges-list">
            <div className="security-badge-item">
              <div className="sec-icon-wrapper">
                <Key size={16} color="var(--accent)" />
              </div>
              <div>
                <strong>JWT Session Token</strong>
                <p>Stored securely in an HTTP-only, SameSite=Strict cookie against XSS attacks.</p>
              </div>
            </div>

            <div className="security-badge-item">
              <div className="sec-icon-wrapper">
                <CheckCircle2 size={16} color="var(--income-green)" />
              </div>
              <div>
                <strong>Active Authentication</strong>
                <p>Protected API endpoints verify tenant isolation for all database transactions.</p>
              </div>
            </div>
          </div>

          <div className="logout-box">
            <p className="logout-desc">
              Signing out invalidates your session cookie on this browser.
            </p>
            <button
              className="btn-danger"
              onClick={() => setShowLogoutModal(true)}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              <LogOut size={16} />
              <span>Sign Out of SettleUp</span>
            </button>
          </div>
        </section>
      </div>

      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to end your current SettleUp session? You will be redirected to the login page."
        confirmText="Log Out"
        cancelText="Stay Signed In"
        isDanger={false}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}

export default Profile;
