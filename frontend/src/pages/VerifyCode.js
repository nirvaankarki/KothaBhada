import React, { useState } from 'react';
import api from '../api';

export default function VerifyCode(){
  const [form, setForm] = useState({email:'', verificationCode:''});
  const [msg, setMsg] = useState('');

  const onChange = e => setForm({...form, [e.target.name]: e.target.value});
  const onSubmit = async e =>{
    e.preventDefault();
    try{
      const res = await api.post('/auth/verify-code', form);
      setMsg(res.data.message || 'Verified');
    }catch(err){
      setMsg(err?.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="auth">
      <h2>Verify Code</h2>
      <form onSubmit={onSubmit}>
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={onChange} required />
        <input name="verificationCode" placeholder="Verification Code" value={form.verificationCode} onChange={onChange} required />
        <button type="submit">Verify</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
