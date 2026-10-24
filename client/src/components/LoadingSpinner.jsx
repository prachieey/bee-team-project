// src/components/LoadingSpinner.jsx
import './LoadingSpinner.css';

function LoadingSpinner({ fullPage = false, size = 'md' }) {
  const spinner = <div className={`spinner spinner-${size}`} aria-label="Loading" />;

  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        <div className="loading-skeleton-stack" aria-hidden="true">
          <span className="loading-skeleton loading-skeleton-wide" />
          <span className="loading-skeleton loading-skeleton-card" />
          <span className="loading-skeleton loading-skeleton-card" />
        </div>
        {spinner}
        <p className="spinner-text">Loading…</p>
      </div>
    );
  }
  return spinner;
}

export default LoadingSpinner;
