import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-[#1a222e] text-white px-10 py-6 flex items-center justify-between font-sans">
      {/* Logo Section */}
      <div className="text-2xl font-bold tracking-tight">
        <span>Kotha</span>
        <span className="text-[#3b82f6]">Bhada</span>
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-12 items-center">
        <a 
          href="#" 
          className="text-sm font-medium tracking-widest border-b-4 border-[#3b82f6] pb-1"
        >
          HOME
        </a>
        <a 
          href="#" 
          className="text-sm font-medium tracking-widest hover:text-gray-400 transition-colors"
        >
          EXPLORE 3D
        </a>
        <a 
          href="#" 
          className="text-sm font-medium tracking-widest hover:text-gray-400 transition-colors"
        >
          ABOUT
        </a>
        <a 
          href="#" 
          className="text-sm font-medium tracking-widest hover:text-gray-400 transition-colors"
        >
          CONTACT
        </a>
      </div>

      {/* Sign Up Section */}
      <div>
        <a 
          href="#" 
          className="text-base font-semibold hover:text-gray-400 transition-colors"
        >
          Sign Up
        </a>
      </div>
    </nav>
  );
};

export default Navbar;