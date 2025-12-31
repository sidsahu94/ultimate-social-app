import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { user, loading } = useSelector((s) => s.auth);

  if (loading) return null; // Or a spinner

  // If not logged in, kick to login
  if (!user) return <Navigate to="/login" replace />;

  // If logged in but not admin, kick to home
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // If admin, allow access
  return <Outlet />;
};

export default AdminRoute;