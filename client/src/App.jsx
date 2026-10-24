// src/App.jsx
// SettleUp React Application Entry Point
// Demonstrates: React Router, AuthProvider, protected routes, layout composition (Lecture 48)

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Settlement from './pages/Settlement';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function AppContent() {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return (
    <div className="app-layout">
      {user && <Navbar onToast={showToast} />}

      <main className="app-main">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login onToast={showToast} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" replace /> : <Signup onToast={showToast} />}
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <GroupDetails onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id/settlement"
            element={
              <ProtectedRoute>
                <Settlement onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settlement"
            element={
              <ProtectedRoute>
                <Settlement onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile onToast={showToast} />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
