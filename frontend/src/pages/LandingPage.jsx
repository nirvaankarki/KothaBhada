import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import WhyChoose from '../components/WhyChoose';
import FeaturedListings from '../components/FeaturedListings';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { useAutoDismiss } from '../hooks/useAutoDismiss';

const LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  useAutoDismiss(showLogoutToast, () => setShowLogoutToast(false), 2600);

  return (
    <div className="w-full">
      {showLogoutToast && (
        <div className="fixed top-24 right-6 z-50 logout-success-toast bg-white/95 backdrop-blur border border-gray-200 shadow-xl rounded-sm px-4 py-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-[#1f2937]">
            <CheckCircle2 size={16} className="text-emerald-300" />
            Logged out successfully
          </div>
        </div>
      )}

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
