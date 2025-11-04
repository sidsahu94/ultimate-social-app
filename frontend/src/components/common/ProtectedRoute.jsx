// frontend/src/components/common/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector(s => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
