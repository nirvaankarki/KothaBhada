import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import WhyChoose from '../components/WhyChoose';
import FeaturedListings from '../components/FeaturedListings';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { useToast } from '../context/ToastContext';

const LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { showToast } = useToast();
  const [pendingPath, setPendingPath] = useState('/viewlisting');
  const [authModalMessage, setAuthModalMessage] = useState('You need to log in or create an account before viewing listings.');

  useEffect(() => {
    const shouldShow = Boolean(location.state?.logoutSuccess);
    const shouldPromptAuth = Boolean(location.state?.requireAuthModal);

    if (shouldShow) {
      setShowLogoutToast(true);
    }

    if (shouldPromptAuth) {
      setShowAuthModal(true);
      setPendingPath(location.state?.from || '/viewlisting');
      setAuthModalMessage(location.state?.authNotice || 'You need to log in or create an account before viewing listings.');
    }

    if (shouldShow || shouldPromptAuth) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!showLogoutToast) return;
    showToast({ type: 'success', title: 'Success', message: 'Logged out successfully' });
    setShowLogoutToast(false);
  }, [showLogoutToast, showToast]);

  return (
    <div className="w-full">

      <AuthRequiredModal
        open={showAuthModal}
        message={authModalMessage}
        onCancel={() => setShowAuthModal(false)}
        onConfirm={() => navigate('/login', { state: { from: pendingPath } })}
      />

      <HeroSection />
        <WhyChoose />
        <FeaturedListings />
        <HowItWorks />
        <Testimonials />
      {/* Add feature cards, hero section, etc. here */}
    </div>
  );
};

export default LandingPage;
