// frontend/src/components/common/AdminRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { user, loading } = useSelector((s) => s.auth);

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#04070D]">
            <div className="text-[#CBD5E1]/70 font-medium tracking-wide animate-pulse">Verifying permissions...</div>
        </div>
      );
  }

  // If not logged in -> Login
  if (!user) {
      return <Navigate to="/login" replace />;
  }

  // Strict Founder & Admin Enclave Lock: Only Founder Sidhanta Sahu can enter
  const isFounderAdmin = (
    user.role === 'admin' &&
    (user.email === 'sidhantas786@gmail.com' ||
     user.email === 'admin@socialapp.com' ||
     user.username === 'sidsahu' ||
     user.name?.toLowerCase().includes('sidhanta'))
  );

  if (!isFounderAdmin) {
      return <Navigate to="/" replace />;
  }

  // Authorized -> Render Child Routes (The Admin Pages)
  return <Outlet />;
};

export default AdminRoute;
