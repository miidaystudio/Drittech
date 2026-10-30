import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, ArrowLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import './Auth.scss';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message || 'Password reset instructions have been dispatched.');
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
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
          <h2>Reset Password</h2>
          <p>Enter your account email to receive reset instructions</p>
        </div>

        {message && (
          <div className="auth-card__alert" style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="auth-card__alert auth-card__alert--danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

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

          <Button type="submit" size="lg" variant="primary" loading={loading} icon={Send}>
            Send Reset Instructions
          </Button>
        </form>

        <div className="auth-card__footer">
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={16} />
            <span>Back to Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
