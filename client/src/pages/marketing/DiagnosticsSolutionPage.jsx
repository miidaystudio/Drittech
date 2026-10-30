import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { FlaskConical, FileCheck2, Shield, Lock } from 'lucide-react';
import './Marketing.scss';

export const DiagnosticsSolutionPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container">
          <div className="section-header">
            <span className="section-header__tag">Tailored for Laboratories</span>
            <h2>Drittech for Diagnostic Centers & Pathology Labs</h2>
            <p>Accelerate sample turnaround times, verify findings, and deliver encrypted digital reports securely.</p>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <h4>Specimen Lifecycle Tracking</h4>
              <p>Move orders seamlessly through stages: ordered, sample collected, processing, awaiting review, and published.</p>
            </div>
            <div className="problem-card">
              <h4>Expiring Signed Download Links</h4>
              <p>Reports are never placed on public predictable URLs. Access requires strict HMAC authentication tokens that expire after 15 minutes.</p>
            </div>
            <div className="problem-card">
              <h4>Patient Plain-Language Insights</h4>
              <p>Help patients understand complex lab flags with concise, automated reference range comparisons and physician guidance.</p>
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
