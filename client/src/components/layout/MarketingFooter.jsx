import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Heart, ArrowUpRight } from 'lucide-react';
import './MarketingFooter.scss';

export const MarketingFooter = () => {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer__container">
        <div className="marketing-footer__grid">
          <div className="marketing-footer__brand">
            <Link to="/" className="marketing-footer__logo">
              <div className="marketing-footer__logo-icon">
                <Activity size={20} color="#0F766E" />
              </div>
              <span className="marketing-footer__logo-text">Drittech</span>
            </Link>
            <p className="marketing-footer__tagline">
              Next-generation patient flow, waiting-room coordination, and digital diagnostic engine for modern clinics and diagnostic centers.
            </p>
            <div className="marketing-footer__trust-badge">
              <Shield size={16} color="#0F766E" />
              <span>Role-Based Access & Encrypted Storage</span>
            </div>
          </div>

          <div className="marketing-footer__column">
            <h4>Product</h4>
            <ul>
              <li><Link to="/features">Platform Features</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/solutions/clinics">For Polyclinics</Link></li>
              <li><Link to="/solutions/diagnostic-centers">For Diagnostic Labs</Link></li>
              <li><Link to="/security">Security Architecture</Link></li>
            </ul>
          </div>

          <div className="marketing-footer__column">
            <h4>Live Demonstrations</h4>
            <ul>
              <li><Link to="/login">Clinic Admin Dashboard</Link></li>
              <li><Link to="/login">Receptionist Queue Console</Link></li>
              <li><Link to="/login">Doctor Clinical Console</Link></li>
              <li><Link to="/login">Diagnostic Laboratory Workspace</Link></li>
              <li><Link to="/track/track_james_wilson_demo_token_123">Live Patient Mobile Tracker</Link></li>
              <li><Link to="/display/all/all" target="_blank">Waiting-Room TV Display</Link></li>
            </ul>
          </div>

          <div className="marketing-footer__column">
            <h4>Company & Legal</h4>
            <ul>
              <li><Link to="/about">About Drittech</Link></li>
              <li><Link to="/contact">Contact & Support</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="marketing-footer__bottom">
          <p>© {new Date().getFullYear()} Drittech Inc. All rights reserved.</p>
          <div className="marketing-footer__platforms">
            <span className="platform-pill"><span className="platform-dot" /> Windows</span>
            <span className="platform-pill"><span className="platform-dot" /> macOS</span>
            <span className="platform-pill"><span className="platform-dot" /> Linux</span>
            <span className="platform-pill"><span className="platform-dot" /> Chrome</span>
            <span className="platform-pill"><span className="platform-dot" /> iOS</span>
            <span className="platform-pill"><span className="platform-dot" /> Android</span>
          </div>
          <div className="marketing-footer__legal-note">
            Built for enterprise healthcare flow coordination. Compliant architecture ready for qualified clinical review.
          </div>
        </div>
      </div>
    </footer>
  );
};
