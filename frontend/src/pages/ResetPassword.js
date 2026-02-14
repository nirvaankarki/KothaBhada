import React, { useState } from 'react';
import api from '../api';

export default function ResetPassword(){
  const [form, setForm] = useState({email:'', verificationCode:'', newPassword:'', confirmPassword:''});
  const [msg, setMsg] = useState('');

  const onChange = e => setForm({...form, [e.target.name]: e.target.value});
  const onSubmit = async e =>{
    e.preventDefault();
    try{
      const res = await api.post('/auth/reset-password', form);
      setMsg(res.data.message || 'Password reset');
    }catch(err){
      setMsg(err?.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="auth">
      <h2>Reset Password</h2>
      <form onSubmit={onSubmit}>
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={onChange} required />
        <input name="verificationCode" placeholder="Verification Code" value={form.verificationCode} onChange={onChange} required />
        <input name="newPassword" placeholder="New Password" type="password" value={form.newPassword} onChange={onChange} required />
        <input name="confirmPassword" placeholder="Confirm Password" type="password" value={form.confirmPassword} onChange={onChange} required />
        <button type="submit">Reset Password</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
