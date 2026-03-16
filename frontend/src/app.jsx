import './styles/App.css';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Explore3DPage from './pages/Explore3DPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { Routes, Route } from 'react-router-dom';

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
      
      {/* Main pages - with navbar/footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/explore3d" element={<Explore3DPage />} />
      </Route>
    </Routes>
  );
}