import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import './Marketing.scss';

export const HowItWorksPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container">
          <div className="section-header">
            <span className="section-header__tag">End-to-End Walkthrough</span>
            <h2>How Drittech Operates Step-by-Step</h2>
            <p>From the moment a patient walks in through reception to consultation and laboratory delivery.</p>
          </div>

          <div className="steps-flow">
            <div className="step-card">
              <div className="step-card__number">1</div>
              <h4>Patient Check-In</h4>
              <p>Receptionist enters patient info, assigns department or doctor, and system creates an atomic date-scoped token.</p>
            </div>
            <div className="step-card">
              <div className="step-card__number">2</div>
              <h4>Mobile Tracking Link</h4>
              <p>Patient receives a high-entropy tracking link via SMS or QR code to watch their live queue position.</p>
            </div>
            <div className="step-card">
              <div className="step-card__number">3</div>
              <h4>Smart Turn Alerts</h4>
              <p>When the estimated wait reaches ~15 minutes, automated alerts notify the patient to proceed to the clinic area.</p>
            </div>
            <div className="step-card">
              <div className="step-card__number">4</div>
              <h4>Doctor Consultation</h4>
              <p>Doctor calls the next patient on the console, updates waiting-room TV displays, and records autosaved visit notes.</p>
            </div>
            <div className="step-card">
              <div className="step-card__number">5</div>
              <h4>Diagnostic Lab Delivery</h4>
              <p>Lab technicians process test orders and upload encrypted reports with patient-friendly summaries.</p>
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
