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
import RentalDashboardPage from './pages/RentalDashboardPage';
import LandlordDashboardPage from './pages/LandlordDashboardPage';
import ReviewsPage from './pages/ReviewsPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { isLandlordRole, resolveRole } from './utils/roles';

function DashboardRouteEntry() {
  const { token, user } = useAuth();
  const activeRole = resolveRole(user?.role, token);

  if (isLandlordRole(activeRole)) {
    return <Navigate to="/landlord/dashboard" replace />;
  }

  return <Navigate to="/rental/dashboard" replace />;
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
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route
          path="/viewlisting"
          element={(
            <ProtectedRoute message="Please log in or sign up to view listings.">
              <ViewListingPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/view-listing" element={<Navigate to="/viewlisting" replace />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute message="Please log in to access your dashboard.">
              <DashboardRouteEntry />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/rental/dashboard"
          element={(
            <ProtectedRoute
              message="Please log in as a user to access your dashboard."
              allowedRoles={['user']}
            >
              <RentalDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/user/dashboard" element={<Navigate to="/rental/dashboard" replace />} />
      </Route>
    </Routes>
  );
}