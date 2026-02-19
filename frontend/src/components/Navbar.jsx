import React from 'react';
import { NavLink } from 'react-router-dom';

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
        <NavLink 
          to="/" 
          end
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          HOME
        </NavLink>
        <NavLink 
          to="/explore3d" 
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          EXPLORE 3D
        </NavLink>
        <NavLink 
          to="/about" 
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          ABOUT
        </NavLink>
        <NavLink 
          to="/contact" 
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          CONTACT
        </NavLink>
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