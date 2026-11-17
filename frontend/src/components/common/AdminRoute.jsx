// frontend/src/components/common/AdminRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { user, loading, checkingAuth, isLoading } = useSelector((s) => s.auth);

  const isHydrating = Boolean(loading || checkingAuth || isLoading);
  if (isHydrating) {
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
  const isFounderAdmin = Boolean(
    user?.role === 'admin' &&
    (user?.isFounder === true || user?.email === 'teamuniversal49@gmail.com')
  );

  if (!isFounderAdmin) {
    return <Navigate to="/" replace />;
  }

  // Authorized -> Render Child Routes (The Admin Pages)
  return <Outlet />;
};

export default AdminRoute;
