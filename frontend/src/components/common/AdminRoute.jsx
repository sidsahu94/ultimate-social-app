import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { user, loading } = useSelector((s) => s.auth);

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
            <div className="text-gray-500 font-medium animate-pulse">Verifying permissions...</div>
        </div>
      );
  }

  // If not logged in -> Login
  if (!user) {
      return <Navigate to="/login" replace />;
  }

  // If logged in but NOT admin -> Home
  if (user.role !== 'admin') {
      return <Navigate to="/" replace />;
  }

  // Authorized -> Render Child Routes (The Admin Pages)
  return <Outlet />;
};

export default AdminRoute;