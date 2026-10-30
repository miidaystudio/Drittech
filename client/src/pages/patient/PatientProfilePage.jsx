import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, ShieldCheck } from 'lucide-react';

export const PatientProfilePage = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div className="flex items-center gap-4 mb-6">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#0F766E',
              color: '#FFFFFF',
              fontSize: '1.5rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{user?.name}</h3>
            <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Patient Member Account
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096' }}>Email Address</label>
            <strong style={{ display: 'block', marginTop: '2px' }}>{user?.email}</strong>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096' }}>Phone Number</label>
            <strong style={{ display: 'block', marginTop: '2px' }}>{user?.phone || '+1 (555) 987-6543'}</strong>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096' }}>Default Clinic</label>
            <strong style={{ display: 'block', marginTop: '2px' }}>Drittech Health Polyclinic & Diagnostic Center</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
