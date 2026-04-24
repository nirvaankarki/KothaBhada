import React from 'react';
import ContactForm from '../components/ContactForm';
import bgImage from '../assets/aboutPage-Bg-Img.jpg';

const ContactPage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      
      {/* 1. THE BACKGROUND IMAGE LAYER */}
      <div 
        className="absolute inset-0 z-0 opacity-30 pointer-events-none" // Adjust opacity-10 to opacity-50 here
        style={{ 
          backgroundImage: `url(${bgImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat' 
        }}
      ></div>

      {/* 2. THE CONTENT LAYER */}
      <div className="relative z-10 p-4 sm:p-8">
        <ContactForm />
      </div>

    </div>
  );
};

export default ContactPage;