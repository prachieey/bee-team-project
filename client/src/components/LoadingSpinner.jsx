// src/components/LoadingSpinner.jsx
import './LoadingSpinner.css';

function LoadingSpinner({ fullPage = false, size = 'md' }) {
  const spinner = <div className={`spinner spinner-${size}`} aria-label="Loading" />;

  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        {spinner}
        <p className="spinner-text">Loading…</p>
      </div>
    );
  }
  return spinner;
}

export default LoadingSpinner;
