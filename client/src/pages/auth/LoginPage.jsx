import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, UserCheck, ShieldCheck, Stethoscope, FlaskConical, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import './Auth.scss';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  const isSessionExpired = searchParams.get('session_expired') === 'true';

  const demoAccounts = [
    { role: 'Doctor', email: 'doctor.sarah@drittech.com', pass: 'doctor123', icon: Stethoscope, color: '#0F766E' },
    { role: 'Receptionist', email: 'reception@drittech.com', pass: 'reception123', icon: UserCheck, color: '#3B82F6' },
    { role: 'Lab Tech', email: 'lab@drittech.com', pass: 'lab123', icon: FlaskConical, color: '#8B5CF6' },
    { role: 'Clinic Admin', email: 'clinicadmin@drittech.com', pass: 'admin123', icon: ShieldCheck, color: '#D97706' },
    { role: 'Patient', email: 'patient@drittech.com', pass: 'patient123', icon: User, color: '#10B981' },
    { role: 'Super Admin', email: 'admin@drittech.com', pass: 'admin123', icon: ShieldCheck, color: '#E53E3E' },
  ];

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword(account.pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login({ email, password });
      if (res.success) {
        const userRole = res.user.role;
        if (userRole === 'doctor') navigate('/app/doctor');
        else if (userRole === 'receptionist') navigate('/app/reception');
        else if (userRole === 'lab_technician') navigate('/app/lab');
        else if (userRole === 'patient') navigate('/patient');
        else navigate('/app/admin');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <div className="auth-card__logo-icon">
              <Activity size={24} color="#0F766E" />
            </div>
            <span className="auth-card__logo-text">Drittech</span>
          </Link>
          <h2>Sign in to Drittech</h2>
          <p>Access your clinic workspace, doctor console, or patient portal</p>
        </div>

        {isSessionExpired && (
          <div className="auth-card__alert auth-card__alert--warning">
            <AlertCircle size={18} />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        {error && (
          <div className="auth-card__alert auth-card__alert--danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Account Quick Switcher */}
        <div className="demo-accounts">
          <span className="demo-accounts__title">1-Click Demo Accounts:</span>
          <div className="demo-accounts__grid">
            {demoAccounts.map((acc, idx) => {
              const Icon = acc.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className="demo-account-btn"
                  onClick={() => handleSelectDemo(acc)}
                >
                  <Icon size={14} color={acc.color} />
                  <span>{acc.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            required
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="password-group">
            <Input
              label="Password"
              type="password"
              icon={Lock}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot?
            </Link>
          </div>

          <Button type="submit" size="lg" variant="primary" loading={loading} icon={ArrowRight}>
            Sign In
          </Button>
        </form>

        <div className="auth-card__footer">
          <span>Need a new clinic account?</span>
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
};
