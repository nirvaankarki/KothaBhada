import React from 'react';
import HeroSection from '../components/HeroSection';
import WhyChoose from '../components/WhyChoose';
import FeaturedListings from '../components/FeaturedListings';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';

const LandingPage = () => {
  return (
    <div className="w-full">
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
