import React, { useState } from 'react';
import api from '../api';

export default function Signup(){
  const [form, setForm] = useState({name:'', email:'', role:'user', password:'', confirmPassword:''});
  const [msg, setMsg] = useState('');

  const onChange = e => setForm({...form, [e.target.name]: e.target.value});
  const onSubmit = async e =>{
    e.preventDefault();
    try{
      const res = await api.post('/auth/signup', form);
      setMsg(res.data.message || 'Registered');
    }catch(err){
      setMsg(err?.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="auth">
      <h2>Signup</h2>
      <form onSubmit={onSubmit}>
        <input name="name" placeholder="Full name" value={form.name} onChange={onChange} required />
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={onChange} required />
        <select name="role" value={form.role} onChange={onChange}>
          <option value="user">User</option>
          <option value="landlord">Landlord</option>
        </select>
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} required />
        <input name="confirmPassword" placeholder="Confirm Password" type="password" value={form.confirmPassword} onChange={onChange} required />
        <button type="submit">Signup</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
