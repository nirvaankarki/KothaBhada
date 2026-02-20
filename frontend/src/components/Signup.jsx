import React, { useState } from 'react';
import { User, Mail, Lock, Chrome, ChevronDown, UserCircle } from 'lucide-react';

const Signup = ({ onToggle }) => {
  // Logic: Handling form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  return (
    <div className="flex w-full h-full animate-fadeIn">
      
      {/* LEFT SIDE: BLUE PANEL (Welcome Back) */}
      <div className="w-[45%] bg-[#1F2937] flex flex-col items-center justify-center text-center p-12 text-white relative">
        {/* Brand Logo */}
        <div className="absolute top-10 left-10 text-xl font-bold tracking-tight">
          Kotha<span className="text-[#3b66ff]">Bhada</span>
        </div>
        
        <h2 className="text-5xl font-bold mb-8">Welcome Back!</h2>
        
        <p className="mb-12 text-lg leading-relaxed max-w-[280px] font-medium opacity-90">
          Already have an account? <br/>Sign in to continue.
        </p>
        
        <button 
          onClick={onToggle} // Switches to Login
          className="border-2 border-white text-white px-16 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#3b66ff] transition-all duration-300 active:scale-95"
        >
          Sign In
        </button>
      </div>

      {/* RIGHT SIDE: WHITE FORM (Create Account) */}
      <div className="w-[55%] flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-5xl font-black text-[#3b66ff] mb-6 tracking-tight">
          Create Account
        </h1>
        
        {/* Google Social Icon */}
        <button className="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center mb-4 hover:bg-gray-50 transition-colors shadow-sm">
          <Chrome size={22} className="text-gray-600" />
        </button>

        <p className="text-gray-500 text-sm mb-8">Or use your email for registration</p>

        <form className="w-full max-w-sm space-y-3.5">
          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          {/* User Role Dropdown */}
          <div className="relative">
            <UserCircle className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <select className="w-full pl-12 pr-10 py-3 bg-gray-100/70 rounded-sm outline-none appearance-none text-gray-500 focus:ring-2 focus:ring-blue-400 transition-all font-medium cursor-pointer">
              <option value="">User Role</option>
              <option value="tenant">Tenant (Looking for rent)</option>
              <option value="landlord">Landlord (Property Owner)</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="Confirm Password" 
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          {/* Sign Up Button */}
          <div className="flex justify-center mt-8">
            <button className="bg-[#3b66ff] text-white px-20 py-3.5 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95">
              Sign Up
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Signup;