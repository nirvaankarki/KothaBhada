import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link to imports
import api from '../utils/api';

const Login = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full animate-fadeIn">
      {/* Left Side: White Form Section */}
      <div className="w-[55%] flex flex-col items-center justify-center p-12 bg-white">
        <h1 className={`text-4xl font-black text-[#3b66ff] tracking-tight transition-all duration-300 ${error ? 'mb-4' : 'mb-10'}`}>
          Sign in to KothaBhada
        </h1>

        <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={handleInputChange(setEmail)}
              required
              className="w-full pl-12 pr-4 py-4 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium"
            />
          </div>
          
          <div className="flex flex-col">
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={handleInputChange(setPassword)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium"
              />
            </div>
            <div className="text-right mt-3">
              {/* Updated to use Link for redirection */}
              <Link 
                to="/forgot-password" 
                className="text-xs font-medium text-[#3B82F6] hover:underline"
              >
                Forget Password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b66ff] text-white px-20 py-3.5 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className={`w-full max-w-sm flex flex-col items-center transition-all duration-300 ${error ? 'mt-4' : 'mt-8'}`}>
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

      {/* Right Side: Blue Information Section */}
      <div className="w-[45%] bg-[#1F2937] flex flex-col items-center justify-center text-center p-12 text-white relative">
        <div className="absolute top-10 left-10 text-xl font-bold">Kotha<span className="text-[#3b66ff]">Bhada</span></div>
        <h2 className="text-4xl font-bold mb-8">Hello, Friend!</h2>
        <p className="mb-12 text-lg leading-relaxed max-w-[350px] font-regular opacity-90">New to KothaBhada? <br/>Create an account to get started.</p>
        <button onClick={onToggle} className="border-2 border-white text-white px-16 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#3b66ff] transition-all duration-300 active:scale-95">Sign Up</button>
      </div>
    </div>
  );
};

export default Login;