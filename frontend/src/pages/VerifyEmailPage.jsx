import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { isLandlordRole } from '../utils/roles';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState(location.state?.devVerificationCode || '');
  const [devCode, setDevCode] = useState(location.state?.devVerificationCode || '');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !code) {
      setError('Email and verification code are required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-email', {
        email: email.trim(),
        verificationCode: code.trim(),
      });

      const nextUser = await login(response.data?.token, response.data?.user);
      const role = nextUser?.role || response.data?.user?.role || location.state?.intendedRole;
      navigate(isLandlordRole(role) ? '/landlord/dashboard' : '/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email first');
      return;
    }

    setResendLoading(true);
    try {
      const response = await api.post('/auth/resend-verification-code', {
        email: email.trim(),
      });
      setSuccess(response.data?.message || 'Verification code resent');
      if (response.data?.devVerificationCode) {
        setDevCode(response.data.devVerificationCode);
        setCode(response.data.devVerificationCode);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-sm shadow-xl border border-gray-100 p-8">
        <h1 className="text-3xl font-black text-[#1a222e] mb-3">Verify your email</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter the 6-digit code sent to your email to activate your account.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-sm text-green-700 text-sm">
            {success}
          </div>
        )}

        {devCode && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-sm text-amber-800 text-sm">
            Development code: <span className="font-bold tracking-widest">{devCode}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="Email"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="text"
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(next);
              setError('');
            }}
            placeholder="6-digit verification code"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 tracking-[0.3em]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3b66ff] text-white py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
          className="w-full mt-4 py-3 rounded-sm border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-60"
        >
          {resendLoading ? 'Resending...' : 'Resend Code'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full mt-3 text-sm text-[#3b66ff] font-semibold hover:underline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
