import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { useToast } from '../../context/ToastContext';

const ResetPasswordForm = ({ email, verificationCode }) => {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', title: 'Reset failed', message: error });
  }, [error, showToast]);

  useEffect(() => {
    if (!success) return;
    showToast({ type: 'success', title: 'Password updated', message: success });
  }, [success, showToast]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return setError("Passwords do not match");
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        email, 
        verificationCode, 
        newPassword: passwords.newPassword, 
        confirmPassword: passwords.confirmPassword 
      });
      setSuccess('Password reset successfully! Redirecting to login...');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center text-center animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
      <p className="text-gray-500 text-sm mb-10">Create a new password</p>

      <form onSubmit={handleReset} className="w-full space-y-4">
        <div className="relative">
          <input type={showNewPassword ? 'text' : 'password'} placeholder="New password" required className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
          >
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        <div className="relative">
          <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" required className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex items-center gap-3 pt-6 pb-4 text-left">
          <input type="checkbox" id="terms" className="w-5 h-5 accent-[#3b66ff]" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <label htmlFor="terms" className="text-sm text-gray-600">I agree to the <span className="font-bold">Terms</span> and <span className="font-bold">Privacy Policy</span></label>
        </div>

        <button type="submit" disabled={!agreed || loading} 
          className={`w-full py-4 rounded-sm font-bold uppercase tracking-widest transition-all shadow-lg 
            ${agreed ? 'bg-[#3b66ff] text-white hover:bg-blue-700' : 'bg-blue-300 text-white cursor-not-allowed'}`}>
          {loading ? 'Processing...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;