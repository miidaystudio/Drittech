import React from 'react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { Building2, Users, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './Marketing.scss';

export const ClinicsSolutionPage = () => {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <div className="marketing-section">
        <div className="marketing-section__container">
          <div className="section-header">
            <span className="section-header__tag">Tailored for Outpatient Care</span>
            <h2>Drittech for Polyclinics & Hospitals</h2>
            <p>Designed for busy multi-specialty clinics managing hundreds of daily walk-ins and scheduled appointments.</p>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <h4>Reception Workload Relief</h4>
              <p>Automate token creation, priority queue triage (emergency, senior, pediatric), and appointment check-in without confusion.</p>
            </div>
            <div className="problem-card">
              <h4>Doctor Schedule Optimization</h4>
              <p>Allow physicians to call next eligible patients with 1 click, view previous patient history, and autosave clinical visit drafts.</p>
            </div>
            <div className="problem-card">
              <h4>Waiting-Room Calm</h4>
              <p>Keep waiting halls peaceful by enabling patients to step out and track their live turn on their personal smartphone.</p>
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};
