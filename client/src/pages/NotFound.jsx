// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '6rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--accent-light)',
          border: '1px solid var(--accent-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <Compass size={36} color="var(--accent)" />
      </div>
      <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.45rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0.75rem auto 2rem', fontSize: '0.95rem' }}>
        The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary" style={{ display: 'inline-flex' }}>
        <ArrowLeft size={16} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}

export default NotFound;
