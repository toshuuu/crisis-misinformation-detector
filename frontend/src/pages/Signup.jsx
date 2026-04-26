import { useState } from 'react';
import api from '../services/api';

const Signup = ({ onLogin, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Join Ground Truth</h2>
        {error && <div className="error-banner"><span>{error}</span></div>}
        
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-input"
            placeholder="Enter your name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            type="email" 
            className="form-input"
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-input"
            placeholder="Choose a password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
          Sign Up
        </button>
        <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>
          Already have an account? <span onClick={onSwitchToLogin} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default Signup;
