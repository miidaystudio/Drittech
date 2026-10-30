import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import './Marketing.scss';

export const PrivacyPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container" style={{ maxWidth: '800px' }}>
          <div className="section-header" style={{ textAlign: 'left', margin: '0 0 2rem' }}>
            <span className="section-header__tag">Legal & Privacy</span>
            <h2>Privacy Policy</h2>
            <p>Last updated: October 2026</p>
          </div>

          <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.7' }}>
            <section>
              <h4 style={{ marginBottom: '0.5rem' }}>1. Data Protection & Tenant Isolation</h4>
              <p>Drittech enforces strict multi-tenant boundaries. Patient records and medical consultation data are isolated by clinic tenant. We do not sell, share, or monetize health information.</p>
            </section>
            <section>
              <h4 style={{ marginBottom: '0.5rem' }}>2. Storage & Ephemeral Links</h4>
              <p>Medical reports are preserved in private encrypted storage. Access links are generated ephemerally via cryptographic HMAC tokens that expire automatically after 15 minutes.</p>
            </section>
            <section>
              <h4 style={{ marginBottom: '0.5rem' }}>3. Audit & Access Logging</h4>
              <p>All clinical data access is logged with timestamp, user role, and IP address to ensure accountability across all healthcare providers.</p>
            </section>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
