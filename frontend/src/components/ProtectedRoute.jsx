import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, message }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

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

  return children;
};

export default ProtectedRoute;
