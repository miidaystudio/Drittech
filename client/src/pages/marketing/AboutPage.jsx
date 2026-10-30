import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { Heart, Activity, Users, Award } from 'lucide-react';
import './Marketing.scss';

export const AboutPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container">
          <div className="section-header">
            <span className="section-header__tag">Our Mission</span>
            <h2>Transforming the Healthcare Waiting Experience</h2>
            <p>Drittech builds software infrastructure that restores calm, dignity, and efficiency to clinical outpatient care.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card__icon"><Heart size={24} /></div>
              <h4>Patient-Centered Care</h4>
              <p>We believe waiting in uncertainty is stressful for patients and their families. Transparent wait times give control back to patients.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Users size={24} /></div>
              <h4>Staff Empowerment</h4>
              <p>By automating queue dispatch and notifications, receptionists and physicians are freed from repetitive administrative friction.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Award size={24} /></div>
              <h4>Clinical Precision</h4>
              <p>Every feature is designed with clinical security, audit trails, and data isolation at its core.</p>
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
