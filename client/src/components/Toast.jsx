// src/components/Toast.jsx
// Premium floating toast notification system
import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon-svg" />,
    error: <AlertCircle size={18} className="toast-icon-svg" />,
    info: <Info size={18} className="toast-icon-svg" />,
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-icon-wrapper">{icons[type] || icons.info}</div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;
