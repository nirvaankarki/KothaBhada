import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import Signup from '../components/Signup';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
// Import your video and fallback image
// import authVideo from '../assets/interiorArchitecture.mp4'; 
// import buildingImg from '../assets/building-bg-auth.png';

const AUTH_VIDEO_URL = "https://res.cloudinary.com/dqp0mzdwf/video/upload/v1771742187/interiorArchitecture_cfqk2g.mp4";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';
  const [authNotice, setAuthNotice] = React.useState(location.state?.authNotice || '');

  React.useEffect(() => {
    setAuthNotice(location.state?.authNotice || '');
  }, [location.state]);

  useAutoDismiss(authNotice, () => setAuthNotice(''), 3500);

  const toggle = () => {
    navigate(isLogin ? '/signup' : '/login');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans p-4 animate-fadeIn">
      
      {/* 1. FULL SCREEN VIDEO BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          // poster={buildingImg}
          className="w-full h-full object-cover"
        >
          <source src={AUTH_VIDEO_URL} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* 2. CINEMATIC OVERLAYS */}
        {/* Dark navy tint to match KothaBhada branding */}
        <div className="absolute inset-0 bg-[#1a222e]/60 mix-blend-multiply"></div>
        
        {/* Vignette effect (darker edges) for a high-profile look */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      </div>

      {/* 3. THE MAIN AUTH CARD (Floating in the center) */}
      <div 
        className={`relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-[0_35px_100px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 ease-in-out ${
          isLogin ? 'h-[650px]' : 'h-[750px]'
        }`}
      >
        {authNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-sm bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold shadow-sm">
            {authNotice}
          </div>
        )}

        {/* Sliding Container */}
        <div
          className={`flex w-[200%] h-full transition-transform duration-700 ease-in-out ${
            isLogin ? 'translate-x-0' : '-translate-x-1/2'
          }`}
        >
          {/* Left half = Login */}
          <div className="w-1/2 h-full flex-shrink-0">
            <Login onToggle={toggle} />
          </div>
          
          {/* Right half = Signup */}
          <div className="w-1/2 h-full flex-shrink-0">
            <Signup onToggle={toggle} />
          </div>
        </div>
      </div>

      {/* 4. OPTIONAL: Subtle Brand Watermark in corner */}
      {/* <div className="absolute bottom-10 right-10 z-20 pointer-events-none opacity-20 hidden lg:block">
        <h1 className="text-white text-4xl font-black tracking-widest uppercase">
          KothaBhada
        </h1>
      </div> */}
    </div>
  );
};

export default AuthPage;