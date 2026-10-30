import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { Shield, Lock, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import './Marketing.scss';

export const SecurityPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container">
          <div className="section-header">
            <span className="section-header__tag">Data Governance & Privacy</span>
            <h2>Security Built into Every Layer</h2>
            <p>We treat health data security with architectural discipline, multi-tenant isolation, and principle of least privilege.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card__icon"><Lock size={24} /></div>
              <h4>HttpOnly Cookie Sessions</h4>
              <p>JWT tokens are delivered via HttpOnly, SameSite cookies with cryptographic refresh session rotation to eliminate XSS token theft.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><EyeOff size={24} /></div>
              <h4>Role-Based Clinical Boundaries</h4>
              <p>Receptionists cannot access clinical notes or confidential doctor diagnoses. Lab technicians cannot modify consultation records.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Shield size={24} /></div>
              <h4>Private Storage & Expiring Signed URLs</h4>
              <p>Diagnostic reports are stored in private object storage. Downloads generate expiring signed URLs after verifying patient authorization.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><FileText size={24} /></div>
              <h4>Immutable Audit Logging</h4>
              <p>Every sensitive action — login, patient registration, consultation draft, report upload, and status transition — is logged with IP and actor metadata.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><CheckCircle2 size={24} /></div>
              <h4>Data Minimization on Public Displays</h4>
              <p>Waiting-room TV monitors and public guest tracking links expose only token numbers, room assignments, and wait minutes — never patient names or phone numbers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Shield size={24} /></div>
              <h4>Multi-Tenant Clinic Isolation</h4>
              <p>Every database query and WebSocket channel is strictly partitioned by clinic boundary to prevent cross-tenant data leaks.</p>
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
