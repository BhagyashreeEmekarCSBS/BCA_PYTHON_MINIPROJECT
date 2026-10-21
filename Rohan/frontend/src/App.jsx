import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import { ThemeProvider } from './context/ThemeContext';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStores from './pages/admin/AdminStores';

// User pages
import UserStores from './pages/user/UserStores';

// Store Owner pages
import StoreOwnerDashboard from './pages/owner/StoreOwnerDashboard';

// Shared pages
import ChangePassword from './pages/shared/ChangePassword';

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const routes = {
    admin: '/admin',
    user: '/stores',
    store_owner: '/owner',
  };

  return <Navigate to={routes[user.role] || '/login'} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13.5px',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#16A34A',
                  secondary: 'var(--bg-surface)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#DC2626',
                  secondary: 'var(--bg-surface)',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin Routes */}
            <Route
              element={
                <ProtectedRoute roles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/stores" element={<AdminStores />} />
              <Route path="/admin/password" element={<ChangePassword />} />
            </Route>

            {/* Normal User Routes */}
            <Route
              element={
                <ProtectedRoute roles={['user']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/stores" element={<UserStores />} />
              <Route path="/password" element={<ChangePassword />} />
            </Route>

            {/* Store Owner Routes */}
            <Route
              element={
                <ProtectedRoute roles={['store_owner']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/owner" element={<StoreOwnerDashboard />} />
              <Route path="/owner/password" element={<ChangePassword />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
