import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAllowedRole, resolveRole } from '../utils/roles';

const ProtectedRoute = ({ children, message, allowedRoles = [] }) => {
  const { isAuthenticated, authLoading, token, user } = useAuth();
  const location = useLocation();
  const activeRole = resolveRole(user?.role, token);

  // Wait for /auth/me sync so refreshes don't redirect with stale/empty auth state.
  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          requireAuthModal: true,
          authNotice: message || 'Please log in to continue.',
          from: location.pathname,
        }}
      />
    );
  }

  if (!hasAllowedRole(activeRole, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
