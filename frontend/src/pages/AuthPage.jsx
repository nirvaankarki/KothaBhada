import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import Signup from '../components/Signup';
import buildingImg from '../assets/building-bg-auth.png'; // Make sure this is a transparent PNG if possible

const AuthPage = () => {
  // read current URL so we can decide which panel to show
  const location = useLocation();
  const navigate = useNavigate();

  // determine mode from path instead of component state
  const isLogin = location.pathname === '/login';

  const toggle = () => {
    // flip the path so router shows the opposite view
    navigate(isLogin ? '/signup' : '/login');
  };

  return (
    // Base page color is light gray to match the image context
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#ebedef] overflow-hidden font-sans">
      
      {/* 1. THE BUILDING IMAGE: Pinned to Bottom-Left */}
      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none">
        <img 
          src={buildingImg} 
          alt="Building background" 
          className="absolute bottom-0 left-[-20px] w-[45%] max-w-[300px] h-auto object-contain opacity-90"
        />
      </div>

      {/* 2. THE MAIN AUTH CARD (Floating in the center) */}
      <div className="relative z-10 w-full max-w-5xl h-[650px] bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* container that holds both panels next to each other; width=200% so we can slide */}
        <div
          className={`flex w-[200%] h-full transition-transform duration-700 ease-in-out ${
            isLogin ? 'translate-x-0' : '-translate-x-1/2'
          }`}
        >
          {/* left half = login, right half = signup */}
          <div className="w-1/2 h-full flex-shrink-0">
            <Login onToggle={toggle} />
          </div>
          <div className="w-1/2 h-full flex-shrink-0">
            <Signup onToggle={toggle} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;