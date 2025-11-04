// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/authSlice';
import { Navigate, Link } from 'react-router-dom';

const Login = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(s => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" />;

  const submit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded mb-2" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 border rounded mb-4" />
        <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded">{loading ? 'Logging...' : 'Login'}</button>
        <div className="mt-3 text-sm flex justify-between">
          <Link to="/register" className="text-blue-600">Create account</Link>
          <a href="#" className="text-gray-600">Forgot?</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
