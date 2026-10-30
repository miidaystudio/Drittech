import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, User, Phone, AlertCircle, ArrowRight, Building } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';
import './Auth.scss';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('clinic_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await register({ name, email, password, phone, role });
      if (res.success) {
        navigate('/app/admin');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <h2>Create Drittech Account</h2>
          <p>Register your clinic administrator account or patient profile</p>
        </div>

        {error && (
          <div className="auth-card__alert auth-card__alert--danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Full Name"
            icon={User}
            required
            placeholder="Dr. Jordan Hayes"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            required
            placeholder="jordan@clinic.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Phone Number"
            icon={Phone}
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Select
            label="Account Type"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { label: 'Clinic Administrator (Full Facility Control)', value: 'clinic_admin' },
              { label: 'Patient Portal Account (Track Visits & Reports)', value: 'patient' },
            ]}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            required
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" size="lg" variant="primary" loading={loading} icon={ArrowRight}>
            Create Account
          </Button>
        </form>

        <div className="auth-card__footer">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
