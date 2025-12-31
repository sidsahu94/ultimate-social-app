// frontend/src/components/common/ProtectedRoute.jsx
 import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector(s => s.auth);
  const location = useLocation();

  if (!user) {
    // 🔥 FIX: Pass 'state' with where they came from (deep linking support)
    // When Login succeeds, it will read location.state.from and redirect there.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;