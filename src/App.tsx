/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Acquisition from './pages/Acquisition';
import Assets from './pages/Assets';
import Maintenance from './pages/Maintenance';
import Distribution from './pages/Distribution';
import Disposal from './pages/Disposal';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

import ModuleSelection from './pages/ModuleSelection';

const ProtectedRoute = ({ children, withLayout = true }: { children: React.ReactNode, withLayout?: boolean }) => {
  const { token, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" />;
  
  if (!withLayout) return <>{children}</>;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/module-selection" element={<ProtectedRoute withLayout={false}><ModuleSelection /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/acquisition" element={<ProtectedRoute><Acquisition /></ProtectedRoute>} />
          <Route path="/admin/distribution" element={<ProtectedRoute><Distribution /></ProtectedRoute>} />
          <Route path="/admin/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/admin/disposal" element={<ProtectedRoute><Disposal /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Maintenance Routes */}
          <Route path="/maintenance/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/maintenance/acquisition" element={<ProtectedRoute><Acquisition /></ProtectedRoute>} />
          <Route path="/maintenance/distribution" element={<ProtectedRoute><Distribution /></ProtectedRoute>} />
          <Route path="/maintenance/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/maintenance/disposal" element={<ProtectedRoute><Disposal /></ProtectedRoute>} />

          {/* Custodian Routes */}
          <Route path="/custodian/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/custodian/acquisition" element={<ProtectedRoute><Acquisition /></ProtectedRoute>} />
          <Route path="/custodian/distribution" element={<ProtectedRoute><Distribution /></ProtectedRoute>} />
          <Route path="/custodian/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/custodian/disposal" element={<ProtectedRoute><Disposal /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


