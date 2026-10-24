// src/components/ProtectedRoute.jsx
// Redirects unauthenticated users to /login
// Demonstrates: React Router, conditional rendering (Lecture 48)

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;
  if (!user)   return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
