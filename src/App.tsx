import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import RegularUserManagementPage from './pages/admin/RegularUserManagementPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import StationManagementPage from './pages/admin/StationManagementPage';
import ServiceStatusManagementPage from './pages/admin/ServiceStatusManagementPage';
import LineManagementPage from './pages/admin/LineManagementPage';
import BulkDataPage from './pages/admin/BulkDataPage';
import FareRulesManagementPage from './pages/admin/FareRulesManagementPage';
import CompanyManagementPage from './pages/admin/CompanyManagementPage';
import RouteManagementPage from './pages/admin/RouteManagementPage';
import ServiceManagementPage from './pages/admin/ServiceManagementPage';
import TransferPointsManagementPage from './pages/admin/TransferPointsManagementPage';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import Layout from './components/common/Layout';
import AdminLayout from './components/common/AdminLayout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
          <div className="min-h-screen bg-bg-light">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Admin Login Route */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              
              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout>
                      <Routes>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="users" element={<RegularUserManagementPage />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="stations" element={<StationManagementPage />} />
                        <Route path="lines" element={<LineManagementPage />} />
                        <Route path="bulk-data" element={<BulkDataPage />} />
                        <Route path="fare-rules" element={<FareRulesManagementPage />} />
                        <Route path="companies" element={<CompanyManagementPage />} />
                        <Route path="routes" element={<RouteManagementPage />} />
                        <Route path="schedules" element={<ServiceManagementPage />} />
                        <Route path="transfer-points" element={<TransferPointsManagementPage />} />
                        <Route path="alerts" element={<div className="p-6"><h1 className="text-2xl font-bold">System Alerts</h1><p>Coming soon...</p></div>} />
                        <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p>Coming soon...</p></div>} />
                      </Routes>
                    </AdminLayout>
                  </AdminProtectedRoute>
                }
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
