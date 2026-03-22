import './styles/App.css';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Explore3DPage from './pages/Explore3DPage';
import ViewListingPage from './pages/ViewListingPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import UserDashboardPage from './pages/UserDashboardPage';
import LandlordDashboardPage from './pages/LandlordDashboardPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { isLandlordRole, normalizeRole } from './utils/roles';

function DashboardRouteEntry() {
  const { user } = useAuth();
  const activeRole = normalizeRole(user?.role);

  if (isLandlordRole(activeRole)) {
    return <Navigate to="/landlord/dashboard" replace />;
  }

  return <Navigate to="/user/dashboard" replace />;
}

export function App() {
  return (
    <Routes>
      {/* Auth pages - no navbar/footer */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* New Route */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Landlord dashboard - no navbar/footer */}
      <Route
        path="/landlord/dashboard"
        element={(
          <ProtectedRoute
            message="Please log in as a landlord to access landlord dashboard."
            allowedRoles={['landlord']}
          >
            <LandlordDashboardPage />
          </ProtectedRoute>
        )}
      />

      {/* Main pages - with navbar/footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/listing-details" element={<Explore3DPage />} />
        <Route
          path="/viewlisting"
          element={(
            <ProtectedRoute message="Please log in or sign up to view listings.">
              <ViewListingPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/view-listing" element={<Navigate to="/viewlisting" replace />} />
        <Route path="/view-listing/:listingId" element={<Navigate to="/listing-details" replace />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute message="Please log in to access your dashboard.">
              <DashboardRouteEntry />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/user/dashboard"
          element={(
            <ProtectedRoute
              message="Please log in as a user to access your dashboard."
              allowedRoles={['user']}
            >
              <UserDashboardPage />
            </ProtectedRoute>
          )}
        />
      </Route>
    </Routes>
  );
}