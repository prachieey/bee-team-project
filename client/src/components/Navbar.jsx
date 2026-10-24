// src/components/Navbar.jsx
// Premium navigation bar with responsive drawer, brand mark, and active indicators
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ReceiptText,
  Users2,
  Scale,
  UserCircle2,
  LogOut,
  Menu,
  X,
  Wallet,
} from 'lucide-react';
import './Navbar.css';

function Navbar({ onToast }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    onToast?.('Logged out successfully.', 'info');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Extract user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Treatment */}
        <NavLink to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <div className="logo-badge">
            <Wallet size={19} className="logo-icon" />
          </div>
          <span className="logo-text">
            Settle<span className="logo-accent">Up</span>
          </span>
          <span className="logo-tag">Pro</span>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <ReceiptText size={17} />
            <span>Transactions</span>
          </NavLink>

          <NavLink
            to="/groups"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <Users2 size={17} />
            <span>Groups</span>
          </NavLink>

          <NavLink
            to="/settlement"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <Scale size={17} />
            <span>Settlement</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <UserCircle2 size={17} />
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* Right Actions: User info & Logout */}
        <div className="navbar-right">
          {user && (
            <NavLink to="/profile" className="user-profile-chip" title="Account settings">
              <div className="avatar-circle sm">
                {getInitials(user.name)}
              </div>
              <span className="user-name">{user.name}</span>
            </NavLink>
          )}

          <button
            className="btn-logout"
            onClick={handleLogout}
            title="Log out of session"
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span className="logout-text">Logout</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" role="navigation" aria-label="Mobile Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
            onClick={closeMobileMenu}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
            onClick={closeMobileMenu}
          >
            <ReceiptText size={18} />
            <span>Personal Transactions</span>
          </NavLink>

          <NavLink
            to="/groups"
            className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
            onClick={closeMobileMenu}
          >
            <Users2 size={18} />
            <span>Expense Groups</span>
          </NavLink>

          <NavLink
            to="/settlement"
            className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
            onClick={closeMobileMenu}
          >
            <Scale size={18} />
            <span>Settlement Engine</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
            onClick={closeMobileMenu}
          >
            <UserCircle2 size={18} />
            <span>Account Profile</span>
          </NavLink>

          <div className="mobile-drawer-footer">
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
