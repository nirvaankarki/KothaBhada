import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAllowedRole, resolveRole } from '../utils/roles';

const ProtectedRoute = ({ children, message, allowedRoles = [] }) => {
  const { isAuthenticated, token, user } = useAuth();
  const location = useLocation();
  const activeRole = resolveRole(user?.role, token);

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
    return (
      <Navigate
        to="/"
        replace
        state={{
          requireAuthModal: true,
          authNotice: 'You do not have permission to access this page.',
          from: location.pathname,
        }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
