import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import './Marketing.scss';

export const TermsPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container" style={{ maxWidth: '800px' }}>
          <div className="section-header" style={{ textAlign: 'left', margin: '0 0 2rem' }}>
            <span className="section-header__tag">Legal Agreement</span>
            <h2>Terms of Service</h2>
            <p>Last updated: October 2026</p>
          </div>

          <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.7' }}>
            <section>
              <h4 style={{ marginBottom: '0.5rem' }}>1. Platform Use & Clinical Authority</h4>
              <p>Drittech provides software tooling for clinic queue orchestration, consultation documentation, and report distribution. Medical decisions, diagnoses, and treatment plans remain the sole professional responsibility of licensed healthcare practitioners.</p>
            </section>
            <section>
              <h4 style={{ marginBottom: '0.5rem' }}>2. AI Summaries & Disclaimers</h4>
              <p>Automated laboratory summaries provided for patients are convenience references based on lab test intervals. They do not constitute automated clinical diagnosis or medical recommendations.</p>
            </section>
            <section>
              <h4 style={{ marginBottom: '0.5rem' }}>3. Service Availability</h4>
              <p>While we architect Drittech for continuous high-availability with real-time WebSocket sync, offline fallbacks are designed for resilience in low-connectivity clinic environments.</p>
            </section>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
