import React, { useState } from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Mail, Phone, Building, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import apiClient from '../../services/apiClient';
import './Marketing.scss';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    interest: 'Polyclinic Queue Engine',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await apiClient.post('/public/contact', formData);
      if (res.success) {
        setSuccessMessage(res.message || 'Thank you for reaching out! Our team will contact you shortly.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          interest: 'Polyclinic Queue Engine',
          message: '',
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit form. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container" style={{ maxWidth: '900px' }}>
          <div className="section-header">
            <span className="section-header__tag">Get in Touch</span>
            <h2>Talk with Our Clinical Solutions Team</h2>
            <p>Have questions about integrating Drittech into your polyclinic, hospital, or diagnostic center? Send us a message.</p>
          </div>

          <div className="card" style={{ padding: '2.5rem' }}>
            {successMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}
              >
                <CheckCircle2 size={20} />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}
              >
                <AlertCircle size={20} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name *"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Work Email Address *"
                  type="email"
                  required
                  placeholder="name@clinic.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Clinic or Organization Name"
                  placeholder="e.g. MetroCare Health"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                />
              </div>

              <Select
                label="Primary Solution of Interest"
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                options={[
                  { label: 'Polyclinic Patient Flow & Queue Engine', value: 'Polyclinic Queue Engine' },
                  { label: 'Diagnostic Laboratory Center & Reports', value: 'Diagnostic Lab' },
                  { label: 'Multi-Department Hospital Suite', value: 'Hospital Suite' },
                  { label: 'Custom Enterprise Integration', value: 'Custom Enterprise' },
                ]}
              />

              <div className="cf-input-group">
                <label className="cf-input-label">How can we help your facility? *</label>
                <textarea
                  className="cf-input"
                  rows={4}
                  required
                  placeholder="Tell us about your current queue volume, departments, or specific requirements..."
                  style={{ height: 'auto', padding: '0.75rem' }}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <Button type="submit" size="lg" variant="primary" loading={loading} icon={Send}>
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
