import React, { useState } from 'react';
import { User, Mail, Lock, ChevronDown, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Signup = ({ onToggle }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (key) => (e) => {
    setFormData((s) => ({ ...s, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', formData);
      navigate('/login');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'An error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full animate-fadeIn">
      {/* LEFT SIDE: BLUE PANEL (Welcome Back) */}
      <div className="w-[45%] bg-[#1F2937] flex flex-col items-center justify-center text-center p-12 text-white relative">
        <div className="absolute top-10 left-10 text-xl font-bold tracking-tight">
          Kotha<span className="text-[#3b66ff]">Bhada</span>
        </div>

        <h2 className="text-4xl font-bold mb-8">Welcome Back!</h2>

        <p className="mb-12 text-lg leading-relaxed max-w-[280px] font-regular opacity-90">
          Already have an account? <br/>Log in to continue.
        </p>

        <button
          onClick={onToggle}
          className="border-2 border-white text-white px-16 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#3b66ff] transition-all duration-300 active:scale-95"
        >
          Sign In
        </button>
      </div>

      {/* RIGHT SIDE: WHITE FORM (Create Account) */}
      <div className="w-[55%] flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-4xl font-black text-[#3b66ff] mb-8 tracking-tight">Create Account</h1>

        {/* Updated Google Signup Button */}
        <div className="w-full max-w-sm flex flex-col items-center mb-6">
          <button 
            type="button"
            className="flex items-center justify-center gap-3 w-full py-2.5 border-2 border-[#3b66ff] rounded-2xl hover:bg-blue-50 transition-all group"
          >
            <span className="text-[#ea4335] text-2xl font-bold leading-none">G</span>
            <span className="text-black font-bold text-lg">Google</span>
          </button>
          
          <p className="text-gray-500 text-sm mt-6 font-medium">Or use your email for registration</p>
        </div>

        <div className={`w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm font-medium ${!error ? 'invisible' : ''}`}>
          {error || ' '}
        </div>

        <form className="w-full max-w-sm space-y-3.5" onSubmit={handleSubmit}>
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange('name')}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          <div className="relative">
            <UserCircle className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <select
              value={formData.role}
              onChange={handleChange('role')}
              required
              className="w-full pl-12 pr-10 py-3 bg-gray-100/70 rounded-sm outline-none appearance-none text-gray-500 focus:ring-2 focus:ring-blue-400 transition-all font-medium cursor-pointer"
            >
              <option value="">Select Role</option>
              <option value="user">Tenant (Looking for rent)</option>
              <option value="landlord">Landlord (Property Owner)</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange('password')}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#3b66ff] text-white px-20 py-3.5 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;