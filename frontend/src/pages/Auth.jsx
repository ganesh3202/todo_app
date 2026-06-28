import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Zap, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

function AuthField({ icon: Icon, type, placeholder, value, onChange, toggle, show, onToggle }) {
  return (
    <div className="auth-field">
      <div className="auth-field-icon"><Icon size={16} /></div>
      <input
        type={toggle ? (show ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="auth-input"
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
      />
      {toggle && (
        <button type="button" className="auth-field-toggle" onClick={onToggle}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

export function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed';
      setError(msg);
      // Show extra help if server is down
      if (msg.includes('reach server') || msg.includes('Network')) {
        toast.error('Backend not running — start it with: cd backend && npm run dev', { duration: 6000 });
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-orb orb1" />
        <div className="auth-bg-orb orb2" />
        <div className="auth-bg-orb orb3" />
      </div>

      <div className="auth-container animate-fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={24} /></div>
          <span className="auth-logo-text">Task<span className="gradient-text">Flow</span></span>
        </div>

        <div className="auth-card glass-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label className="label">Email</label>
              <AuthField icon={Mail} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="auth-form-group">
              <label className="label">Password</label>
              <AuthField icon={Lock} type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                toggle show={showPass} onToggle={() => setShowPass(!showPass)} />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Signing in...</>
                : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
          </div>
        </div>

        <div className="auth-features">
          {['Task Management', 'Project Tracking', 'AI Assistant', 'Team Collaboration'].map((f, i) => (
            <div key={i} className="auth-feature-badge">✓ {f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all fields'); return;
    }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created! Welcome to TaskFlow!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      if (msg.includes('reach server') || msg.includes('Network')) {
        toast.error('Backend not running — start it with: cd backend && npm run dev', { duration: 6000 });
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-orb orb1" />
        <div className="auth-bg-orb orb2" />
        <div className="auth-bg-orb orb3" />
      </div>

      <div className="auth-container animate-fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={24} /></div>
          <span className="auth-logo-text">Task<span className="gradient-text">Flow</span></span>
        </div>

        <div className="auth-card glass-card">
          <div className="auth-header">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Start your productivity journey</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label className="label">Full Name</label>
              <AuthField icon={User} type="text" placeholder="Your name"
                value={form.name} onChange={set('name')} />
            </div>
            <div className="auth-form-group">
              <label className="label">Email</label>
              <AuthField icon={Mail} type="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')} />
            </div>
            <div className="auth-form-group">
              <label className="label">Password</label>
              <AuthField icon={Lock} type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={set('password')}
                toggle show={showPass} onToggle={() => setShowPass(!showPass)} />
            </div>
            <div className="auth-form-group">
              <label className="label">Confirm Password</label>
              <AuthField icon={Lock} type="password" placeholder="Same password"
                value={form.confirm} onChange={set('confirm')}
                toggle show={showPass} onToggle={() => setShowPass(!showPass)} />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Creating account...</>
                : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
