import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';

// Lazy-loaded pages
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const ClientsPage      = lazy(() => import('./pages/ClientsPage'));
const DocumentsPage    = lazy(() => import('./pages/DocumentsPage'));
const ApprovalsPage    = lazy(() => import('./pages/ApprovalsPage'));
const ClientPortalPage = lazy(() => import('./pages/ClientPortalPage'));
const AuditPage        = lazy(() => import('./pages/AuditPage'));

function PageFallback() {
  return <div className="loading-screen">Loading…</div>;
}

// Route guard
function PrivateRoute({ children, internalOnly = false }) {
  const { user, isInternal, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!user)   return <Navigate to="/login" replace />;
  if (internalOnly && !isInternal) return <Navigate to="/portal" replace />;
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

function AppRoutes() {
  const { user, isInternal, loading } = useAuth();

  if (loading) return <PageFallback />;

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to={isInternal ? '/dashboard' : '/portal'} replace /> : <LoginPage />
        } />

        {/* Admin routes */}
        <Route path="/" element={<PrivateRoute internalOnly><Layout /></PrivateRoute>}>
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
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
