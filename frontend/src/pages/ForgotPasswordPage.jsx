import React, { useState } from 'react';
import RequestCode from '../components/auth/RequestCode';
import CodeSentSuccess from '../components/auth/CodeSentSuccess';
import VerifyOTP from '../components/auth/VerifyOTP';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
// Import your video file
// import authVideo from '../assets/passRecovery-Cin-Vid.mp4'; 
const AUTH_VIDEO_URL = "https://res.cloudinary.com/dqp0mzdwf/video/upload/v1771742182/passRecovery-Cin-Vid_bcmgjt.mp4";

// import buildingImg from '../assets/building-bg-auth.png'; 
import { CheckCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleEmailSent = (mail) => {
    setEmail(mail);
    setStep(1.5);
  };

  const handleVerifySuccess = (code) => {
    setVerificationCode(code);
    setStep(3); 
    setTimeout(() => {
      setStep(4); 
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-white overflow-hidden animate-fadeIn">
      
      {/* Left Side: Cinematic Video Background Section */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-[#1a222e]">
        <video
          autoPlay
          loop
          muted
          playsInline
          // poster={buildingImg}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={AUTH_VIDEO_URL} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* LAYER 1: Brand Navy Tint (Multiply effect for rich colors) */}
        <div className="absolute inset-0 bg-[#1a222e]/60 mix-blend-multiply"></div>
        
        {/* LAYER 2: Cinematic Vignette (Darker edges to focus the eye) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-[#1a222e]/40"></div>

        {/* LAYER 3: Inner Shadow (Creates depth where the video meets the form) */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/20 to-transparent"></div>
        
        {/* Brand Watermark Overlay */}
        {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="text-white/5 text-8xl font-black tracking-tighter uppercase rotate-[-10deg] select-none">
            KothaBhada
          </h2>
        </div> */}
      </div>

      {/* Right Side: Step Controller Area */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 relative bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-10">
        <div className="w-full max-w-md">
          
          {step === 1 && <RequestCode onNext={handleEmailSent} />}

          {step === 1.5 && (
            <CodeSentSuccess email={email} onProceed={() => setStep(2)} />
          )}

          {step === 2 && (
            <VerifyOTP email={email} onVerifySuccess={handleVerifySuccess} onCancel={() => setStep(1)} />
          )}

          {step === 3 && (
            <div className="text-center">
              <h2 className="text-[#3b66ff] text-xl font-bold flex items-center justify-center gap-2">
                Verifying your code 
                <span className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce [animation-delay:0.2s]">.</span>
                    <span className="animate-bounce [animation-delay:0.4s]">.</span>
                </span>
              </h2>
            </div>
          )}

          {step === 4 && (
            <div className="text-center flex flex-col items-center gap-6 animate-fadeIn">
              <div className="bg-[#4caf50] p-4 rounded-full text-white shadow-lg">
                <CheckCircle size={60} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Verified</h2>
              <p className="text-gray-500">Now you're eligible for next step.</p>
              <button onClick={() => setStep(5)} className="bg-[#3b66ff] text-white px-10 py-2.5 rounded-sm font-bold uppercase text-sm tracking-widest hover:bg-blue-700 transition-all">
                Next
              </button>
            </div>
          )}

          {step === 5 && <ResetPasswordForm email={email} verificationCode={verificationCode} />}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;