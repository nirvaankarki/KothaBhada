import React, { useState } from 'react';
import { User, Mail, Lock, ChevronDown, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Signup = ({ onToggle }) => {
  const [formData, setFormData] = useState({ name: '', email: '', role: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (key) => (e) => {
    setFormData((s) => ({ ...s, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', formData);
      navigate('/verify-email', {
        state: {
          email: response.data?.email || formData.email,
          devVerificationCode: response.data?.devVerificationCode || '',
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full animate-fadeIn">
      <div className="w-[45%] bg-[#1F2937] flex flex-col items-center justify-center text-center p-12 text-white relative">
        <div className="absolute top-10 left-10 text-xl font-bold">Kotha<span className="text-[#3b66ff]">Bhada</span></div>
        <h2 className="text-4xl font-bold mb-8">Welcome Back!</h2>
        <p className="mb-12 text-lg opacity-90 max-w-[280px]">Already have an account? <br/>Log in to continue.</p>
        <button onClick={onToggle} className="border-2 border-white text-white px-16 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#1F2937] transition-all">Sign In</button>
      </div>

      <div className="w-[55%] flex flex-col items-center justify-center p-10 bg-white">
        <h1 className={`text-4xl font-black text-[#3b66ff] tracking-tight transition-all duration-300 ${error ? 'mb-2' : 'mb-8'}`}>
          Create Account
        </h1>

        {error && (
          <div className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm font-medium animate-fadeIn">
            {error}
          </div>
        )}

        <form className="w-full max-w-sm space-y-3.5" onSubmit={handleSubmit}>
          {/* ... Inputs remain the same ... */}
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input type="text" placeholder="Full Name" value={formData.name} onChange={handleChange('name')} required className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium" />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input type="email" placeholder="Email" value={formData.email} onChange={handleChange('email')} required className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium" />
          </div>
          <div className="relative">
            <UserCircle className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <select value={formData.role} onChange={handleChange('role')} required className="w-full pl-12 pr-10 py-3 bg-gray-100/70 rounded-sm outline-none appearance-none text-gray-500 focus:ring-2 focus:ring-blue-400 font-medium cursor-pointer">
              <option value="">Select Role</option>
              <option value="user">Tenant (Looking for rent)</option>
              <option value="landlord">Landlord (Property Owner)</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input type="password" placeholder="Password" value={formData.password} onChange={handleChange('password')} required className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} required className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium" />
          </div>

          <div className="flex justify-center mt-8">
            <button type="submit" disabled={loading} className="w-full bg-[#3b66ff] text-white px-20 py-3.5 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className={`w-full max-w-sm flex flex-col items-center transition-all duration-300 ${error ? 'mt-2' : 'mt-8'}`}>
          {/* UPDATED DESIGN: OR CONTINUE WITH */}
          <div className="w-full flex items-center mb-6">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-4 text-[12px] font-semibold text-gray-500 tracking-widest uppercase">OR CONTINUE WITH</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <button type="button" className="flex items-center justify-center gap-3 w-full py-2 border-2 border-gray-300 rounded-sm hover:bg-blue-50 transition-all">
            <span className="text-[#ea4335] text-2xl font-bold">G</span>
            <span className="text-black font-bold text-lg">Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;