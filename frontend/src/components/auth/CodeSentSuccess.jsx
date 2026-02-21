import React from 'react';
import { CheckCircle2, Mail } from 'lucide-react';

const CodeSentSuccess = ({ email, onProceed }) => {
  return (
    <div className="flex flex-col items-center text-center animate-fadeIn">
      {/* Animated Icon Container */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
        <div className="relative bg-white p-2 rounded-full border-4 border-green-500">
          <CheckCircle2 size={80} className="text-green-500 animate-bounce-short" />
        </div>
      </div>

      <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">
        Code Sent!
      </h2>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-8 flex items-start gap-3 text-left">
        <Mail className="text-[#3b66ff] shrink-0 mt-1" size={20} />
        <p className="text-sm text-gray-600 leading-relaxed">
          A 6-digit verification code has been sent to <br/>
          <span className="font-bold text-[#1a222e] break-all">{email}</span>. 
          Please check your inbox and spam folder.
        </p>
      </div>

      <button 
        onClick={onProceed}
        className="w-full bg-[#3b66ff] text-white py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
      >
        Enter Verification Code
      </button>

      {/* <p className="mt-6 text-xs text-gray-400">
        Didn't receive it? You can resend the code in the next step.
      </p> */}
    </div>
  );
};

export default CodeSentSuccess;