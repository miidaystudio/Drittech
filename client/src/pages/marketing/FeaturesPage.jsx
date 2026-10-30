import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { Layers, Clock, Stethoscope, FlaskConical, BellRing, Sparkles, Shield, Smartphone, Tv } from 'lucide-react';
import './Marketing.scss';

export const FeaturesPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container">
          <div className="section-header">
            <span className="section-header__tag">Platform Architecture</span>
            <h2>Complete Clinical Flow Suite</h2>
            <p>Explore the specialized engines that make Drittech the choice for modern medical centers.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card__icon"><Layers size={24} /></div>
              <h4>Atomic Real-Time Queue Engine</h4>
              <p>Prevents concurrent patient calling collisions with server-enforced atomic transitions and date-scoped department token sequencing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Clock size={24} /></div>
              <h4>Dynamic Wait-Time Estimator</h4>
              <p>Calculates rolling averages based on attending doctor consultation history, priority modifiers, and current patient queue load.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Stethoscope size={24} /></div>
              <h4>Doctor Consultation Console</h4>
              <p>Distraction-free workspace with medical history review, autosaving draft notes, diagnosis, and direct lab test ordering.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Smartphone size={24} /></div>
              <h4>Mobile Patient Tracker</h4>
              <p>High-entropy guest tracking links allow patients to monitor real-time queue position and estimated wait times on any mobile device.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Tv size={24} /></div>
              <h4>Waiting-Room TV Display</h4>
              <p>Full-screen high-contrast live monitor for waiting areas with automated voice/chime calls and zero patient PII exposure.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><FlaskConical size={24} /></div>
              <h4>Diagnostic Lab Workflow</h4>
              <p>End-to-end specimen tracking from collection to private encrypted object storage and verified patient portal publication.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Sparkles size={24} /></div>
              <h4>Plain-Language Lab Summaries</h4>
              <p>Translates structured biochemical results into concise ~3-bullet patient explanations with explicit clinical safety disclaimers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><BellRing size={24} /></div>
              <h4>15-Minute Turn Alerts</h4>
              <p>Dynamic triggers notify patients when their turn is approaching based on live wait recalculations across in-app, SMS, and email.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon"><Shield size={24} /></div>
              <h4>Role-Based Access & Audit</h4>
              <p>Strict multi-tenant clinic boundaries, private expiring signed download URLs, and comprehensive administrative audit trails.</p>
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
