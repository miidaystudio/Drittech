import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import './MarketingHeader.scss';

export const MarketingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  const getDashboardPath = () => {
    switch (role) {
      case 'doctor':
        return '/app/doctor';
      case 'receptionist':
        return '/app/reception';
      case 'lab_technician':
        return '/app/lab';
      case 'patient':
        return '/patient';
      default:
        return '/app/admin';
    }
  };

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Clinics', href: '/solutions/clinics' },
    { label: 'Diagnostic Labs', href: '/solutions/diagnostic-centers' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Security', href: '/security' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="marketing-header">
      <div className="marketing-header__container">
        <Link to="/" className="marketing-header__logo">
          <div className="marketing-header__logo-icon">
            <svg viewBox="0 0 100 100" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
              <circle cx="38" cy="50" r="32" fill="#00AEEF"/>
              <circle cx="38" cy="50" r="12" fill="white"/>
              <path d="M50 22 C70 22 88 28 88 42 C88 52 78 56 68 58 L50 62 L50 50 L66 48 C74 47 76 44 74 40 C72 36 64 34 50 34 Z" fill="#0090C8"/>
              <path d="M50 62 L50 74 L66 68 C76 64 82 58 80 52 C78 48 74 48 68 50 Z" fill="#007BB0"/>
            </svg>
          </div>
          <span className="marketing-header__logo-text">Drittech</span>
        </Link>

        <nav className="marketing-header__nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`marketing-header__link ${
                location.pathname === link.href ? 'marketing-header__link--active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="marketing-header__actions">
          {isAuthenticated ? (
            <Link to={getDashboardPath()} className="btn-getstarted">
              <span>Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-signin">
                Sign In
              </Link>
              <Link to="/register" className="btn-getstarted">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="marketing-header__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="marketing-header__mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="marketing-header__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="marketing-header__mobile-actions">
            {isAuthenticated ? (
              <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
