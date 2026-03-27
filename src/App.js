import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages
import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import ClientsPage      from './pages/ClientsPage';
import DocumentsPage    from './pages/DocumentsPage';
import ApprovalsPage    from './pages/ApprovalsPage';
import ClientPortalPage from './pages/ClientPortalPage';
import AuditPage        from './pages/AuditPage';
import Layout           from './components/Layout';

// Route guard — redirect to login if not authenticated
function PrivateRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/portal" replace />;
  return children;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading…</div>;

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={profile?.role === 'admin' ? '/dashboard' : '/portal'} replace /> : <LoginPage />
      } />

      {/* Admin routes */}
      <Route path="/" element={<PrivateRoute adminOnly><Layout /></PrivateRoute>}>
        <Route index              element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="clients"    element={<ClientsPage />} />
        <Route path="documents"  element={<DocumentsPage />} />
        <Route path="approvals"  element={<ApprovalsPage />} />
        <Route path="audit"      element={<AuditPage />} />
      </Route>

      {/* Client portal */}
      <Route path="/portal" element={<PrivateRoute><ClientPortalPage /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
