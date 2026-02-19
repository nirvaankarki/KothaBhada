import React from 'react';
import bgImage from '../assets/aboutPage-Bg-Img.jpg';
import AboutUs from '../components/AboutUs';
import OurMission from '../components/OurMission';
import WhatMakesUsDifferent from '../components/WhatMakesUsDifferent';
import OurStory from '../components/OurStory';
import Testimonials from '../components/Testimonials';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">

      {/* 2. Main wrapper for content with the shared background */}
      <main 
        className="flex-grow bg-repeat bg-center relative" 
        style={{ 
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat' 
        }}
      >
        {/* Background overlay - only affects the image, not the text */}
        <div className="absolute inset-0 bg-white/50 pointer-events-none"></div>
        
        {/* Content wrapper with relative positioning so it stays above overlay */}
        <div className="relative z-10">
          <AboutUs />
          <OurMission />
          <WhatMakesUsDifferent />
          <OurStory />
          <Testimonials />
        </div>
        
        {/* You can add "Our Vision" or "Team" sections here later */}
      </main>
    </div>
  );
};

export default AboutPage;