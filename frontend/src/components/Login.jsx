import React, { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, House, Building2, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { getDashboardPathByRole, normalizeRole } from '../utils/roles';
import { useToast } from '../context/ToastContext';

const Login = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginIntentRole, setLoginIntentRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { showToast } = useToast();

  useAutoDismiss(error, () => setError(''));

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', title: 'Login failed', message: error });
  }, [error, showToast]);

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedRole = ['landlord', 'admin', 'moderator'].includes(loginIntentRole) ? loginIntentRole : 'user';
      const selectedRoleLabel = selectedRole === 'landlord' ? 'Landlord' : ['admin', 'moderator'].includes(selectedRole) ? 'Admin' : 'Renter';
      const response = await api.post('/auth/login', { email, password });
      const responseRole = normalizeRole(response.data?.user?.role);
      const isAdminIntentRoleAllowed = selectedRole === 'admin' && ['admin', 'moderator'].includes(responseRole);

      if (responseRole && responseRole !== selectedRole && !isAdminIntentRoleAllowed) {
        setError(`This account is not a ${selectedRoleLabel} account. Please switch role and try again.`);
        return;
      }

      const nextUser = await login(response.data?.token, response.data?.user);
      const activeRole = normalizeRole(nextUser?.role || response.data?.user?.role);
      const isAdminIntentActiveRoleAllowed = selectedRole === 'admin' && ['admin', 'moderator'].includes(activeRole);

      if (activeRole && activeRole !== selectedRole && !isAdminIntentActiveRoleAllowed) {
        logout();
        setError(`This account is not a ${selectedRoleLabel} account. Please switch role and try again.`);
        return;
      }

      const postLoginPath = getDashboardPathByRole(activeRole);
      navigate(postLoginPath, { replace: true });
    } catch (err) {
      if (err?.response?.data?.requiresEmailVerification) {
        navigate('/verify-email', {
          state: { email: err?.response?.data?.email || email },
        });
        return;
      }

      const statusCode = Number(err?.response?.status || 0);
      const backendMessage = String(err?.response?.data?.message || '').trim();

      if (!err?.response) {
        setError('Cannot reach server. Please ensure backend is running on http://localhost:5001.');
        return;
      }

      if (statusCode >= 500) {
        setError(backendMessage || 'Server error while logging in. Please try again in a moment.');
        return;
      }

      setError(backendMessage || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      id: 'user',
      label: 'Renter',
      subtitle: 'Looking for properties',
      icon: House,
    },
    {
      id: 'landlord',
      label: 'Landlord',
      subtitle: 'Manage your listings',
      icon: Building2,
    },
    {
      id: 'admin',
      label: 'Admin',
      subtitle: 'Review and moderate platform',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex w-full h-full min-h-155 animate-fadeIn flex-col md:flex-row">
      <div className="w-full md:w-[55%] flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 bg-white">
        <h1 className={`text-3xl sm:text-4xl font-black text-[#3b66ff] tracking-tight transition-all duration-300 text-center ${error ? 'mb-4' : 'mb-8 md:mb-10'}`}>
          Sign in to KothaBhada
        </h1>

        <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-sm bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setLoginIntentRole('user')}
                className={`flex items-center justify-center gap-1 rounded-sm py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  loginIntentRole === 'user'
                    ? 'bg-[#3b66ff] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <House size={14} className="hidden sm:inline" />
                Renter
              </button>
              <button
                type="button"
                onClick={() => setLoginIntentRole('landlord')}
                className={`flex items-center justify-center gap-1 rounded-sm py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  loginIntentRole === 'landlord'
                    ? 'bg-[#3b66ff] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Building2 size={14} className="hidden sm:inline" />
                Landlord
              </button>
              <button
                type="button"
                onClick={() => setLoginIntentRole('admin')}
                className={`flex items-center justify-center gap-1 rounded-sm py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  loginIntentRole === 'admin'
                    ? 'bg-[#3b66ff] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ShieldCheck size={14} className="hidden sm:inline" />
                Admin
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              You are signing in as {loginIntentRole === 'landlord' ? 'Landlord' : loginIntentRole === 'admin' ? 'Admin' : 'Renter'}.
            </p>
          </div>

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
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={handleInputChange(setPassword)}
                required
                className="w-full pl-12 pr-12 py-4 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="text-right mt-3">
              <Link to="/forgot-password" className="text-xs font-medium text-[#3B82F6] hover:underline">
                Forget Password?
              </Link>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b66ff] text-white px-20 py-3.5 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              {loading ? 'Signing in...' : `Sign In as ${loginIntentRole === 'landlord' ? 'Landlord' : loginIntentRole === 'admin' ? 'Admin' : 'Renter'}`}
            </button>
          </div>
        </form>

        <div className={`w-full max-w-sm flex flex-col items-center transition-all duration-300 ${error ? 'mt-4' : 'mt-8'}`}>
          <div className="w-full flex items-center mb-6">
            <div className="grow h-px bg-gray-300"></div>
            <span className="px-4 text-[12px] font-semibold text-gray-500 tracking-widest uppercase">OR CONTINUE WITH</span>
            <div className="grow h-px bg-gray-300"></div>
          </div>

          <button type="button" className="flex items-center justify-center gap-3 w-full py-2 border-2 border-gray-300 rounded-sm hover:bg-blue-50 transition-all">
            <span className="text-[#ea4335] text-2xl font-bold">G</span>
            <span className="text-black font-bold text-lg">Google</span>
          </button>

          <p className="mt-6 text-sm text-gray-600 md:hidden">
            New to KothaBhada?{' '}
            <button type="button" onClick={onToggle} className="font-semibold text-[#3b66ff] hover:underline">
              Sign Up
            </button>
          </p>
        </div>
      </div>

      <div className="hidden md:flex w-[45%] flex-col items-center justify-center text-center p-12 text-white relative overflow-hidden bg-[#102244]/35 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-[#0f1d35]/55"></div>

        <Link
          to="/"
          className="absolute top-10 left-10 z-10 text-xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] transition-opacity hover:opacity-85"
          aria-label="Go to KothaBhada home page"
        >
          Kotha<span className="text-[#3b66ff]">Bhada</span>
        </Link>
        <h2 className="text-4xl font-bold mb-8 relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">Hello, Friend!</h2>
        <p className="mb-12 text-lg leading-relaxed max-w-87.5 font-regular opacity-95 relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">New to KothaBhada? <br />Create an account to get started.</p>
        <button onClick={onToggle} className="relative z-10 border-2 border-white text-white px-16 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#3b66ff] transition-all duration-300 active:scale-95">Sign Up</button>
      </div>
    </div>
  );
};

export default Login;
