import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Clock,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Smartphone,
  Tv,
  CheckCircle2,
  ArrowRight,
  Users,
  BellRing,
  Layers,
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  Building2,
  FileText,
  Check,
} from 'lucide-react';
import { MarketingHeader } from '../../components/layout/MarketingHeader';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import './Marketing.scss';

export const HomePage = () => {
  const [activeRoom, setActiveRoom] = useState('General OPD');
  const [currentStory, setCurrentStory] = useState(0);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [subscriberName, setSubscriberName] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');

  const rooms = [
    { id: 'General OPD', label: 'General OPD', queueCount: 6, doctor: 'Dr. Sarah Lin' },
    { id: 'Pediatrics', label: 'Pediatrics', queueCount: 4, doctor: 'Dr. Michael Chang' },
    { id: 'Cardiology', label: 'Cardiology', queueCount: 3, doctor: 'Dr. Robert Vance' },
    { id: 'Phlebotomy', label: 'Phlebotomy', queueCount: 5, doctor: 'Tech. Maria Gomez' },
    { id: 'Diagnostics Lab', label: 'Diagnostics Lab', queueCount: 8, doctor: 'Elena Rostova' },
  ];

  const stories = [
    {
      author: 'Dr. Sarah Lin',
      role: 'Lead Polyclinic Physician',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&h=120&q=80',
      title: 'How we eliminated waiting room chaos with atomic live queue tokens',
      content: 'Transitioning to real-time synchronized queues eliminated hallway congestion and gave our physicians the headspace to provide thorough patient assessments.',
      readTime: '3 min read',
    },
    {
      author: 'David Vance',
      role: 'Operations Director, PrimeCare Clinic',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      title: 'Standardizing reception check-ins and reducing patient anxiety by 73%',
      content: 'Our front desk staff went from juggling frantic complaints to orchestrating smooth walk-ins with 1-click token dispatch and phone trackers.',
      readTime: '4 min read',
    },
    {
      author: 'Elena Rostova',
      role: 'Diagnostic Laboratory Supervisor',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
      title: 'Delivering automated plain-language laboratory summaries securely to patient phones',
      content: 'Patients no longer travel back to the lab just to pick up printed blood panels. They receive encrypted results with clear, helpful explanations within minutes.',
      readTime: '5 min read',
    },
    {
      author: 'Sophia Martinez',
      role: 'Verified Patient',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80',
      title: 'Waiting for my consultation from a nearby cafe with real-time phone alerts',
      content: 'Instead of sitting in a crowded waiting room for an hour, I enjoyed a quiet coffee and walked into Room 102 precisely when my turn arrived.',
      readTime: '2 min read',
    },
  ];

  const handleNextStory = () => {
    setCurrentStory((prev) => (prev + 1) % stories.length);
  };

  const handlePrevStory = () => {
    setCurrentStory((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (subscriberEmail) {
      setNewsletterSubmitted(true);
    }
  };

  return (
    <div className="marketing-page">
      <div className="hero-canvas-shell">
        <div className="hero-canvas">
          <MarketingHeader />

          <section className="marketing-hero">
            <div className="marketing-hero__container">
              <h1 className="marketing-hero__title">
                Less Waiting. <br />
                <span className="text-highlight">Better Patient Care.</span>
              </h1>

              <p className="marketing-hero__subtitle">
                Coordinate patient queues, consultations, and diagnostic reports in one connected platform — so your medical staff can focus on care, not paperwork.
              </p>

              <div className="marketing-hero__actions">
                <Link to="/register" className="hero-btn-primary">
                  <span>Start For Free</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/how-it-works" className="hero-btn-outline">
                  <span>Explore the Platform</span>
                </Link>
              </div>

              <div className="marketing-hero__preview">
                <div className="hero-mockup">
                  <div className="hero-mockup__bar">
                    <div className="hero-mockup__dots">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="hero-mockup__url">drittech.com/app/live-engine</div>
                    <div className="hero-mockup__live-pill">
                      <span className="pulse-dot" /> Live System Demo
                    </div>
                  </div>

                  <div className="mockup-header-bar">
                    <div className="mockup-header-left">
                      <div className="clinic-status-pill">
                        <Activity size={14} className="text-cyan" />
                        <span>Live Polyclinic Ops</span>
                        <span className="divider">•</span>
                        <span className="highlight-text">98.4% On-Time</span>
                      </div>
                      <div className="mockup-greeting">
                        <h4>Hello, Dr. Adrian Chen!</h4>
                        <p>All clinical departments synchronized in real time</p>
                      </div>
                    </div>

                    <div className="mockup-room-tabs">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          className={`room-tab ${activeRoom === room.id ? 'room-tab--active' : ''}`}
                          onClick={() => setActiveRoom(room.id)}
                        >
                          <span>{room.label}</span>
                          <span className="room-tab__count">{room.queueCount}</span>
                        </button>
                      ))}
                      <button type="button" className="room-tab room-tab--add">
                        + Add Room
                      </button>
                    </div>
                  </div>

                  <div className="hero-mockup__body">
                    <div className="mockup-card mockup-card--queue">
                      <div className="mockup-card__header">
                        <div className="mockup-card__title-group">
                          <Layers size={16} className="text-cyan" />
                          <h5>Reception Queue Dispatch</h5>
                        </div>
                        <span className="badge badge--called">A-001 In Consult</span>
                      </div>

                      <div className="mockup-queue-list">
                        <div className="mockup-queue-item mockup-queue-item--active">
                          <div className="token-tag">A-001</div>
                          <div className="token-meta">
                            <strong>Sophia Martinez</strong>
                            <span>Dr. Sarah • General Med</span>
                          </div>
                          <span className="wait-pill wait-pill--calling">Called (Room 102)</span>
                        </div>

                        <div className="mockup-queue-item">
                          <div className="token-tag">A-002</div>
                          <div className="token-meta">
                            <strong>James Wilson</strong>
                            <span>Routine Consultation</span>
                          </div>
                          <span className="wait-pill">Est. 8 mins</span>
                        </div>

                        <div className="mockup-queue-item">
                          <div className="token-tag">A-003</div>
                          <div className="token-meta">
                            <strong>Robert Henderson</strong>
                            <span>Diabetes Review</span>
                          </div>
                          <span className="wait-pill">Est. 22 mins</span>
                        </div>
                      </div>

                      <div className="mockup-stat-strip">
                        <span>WebSocket Streaming: <strong>Active</strong></span>
                        <span>Collisions: <strong>0</strong></span>
                      </div>
                    </div>

                    <div className="mockup-card mockup-card--mobile">
                      <div className="mockup-card__header">
                        <div className="mockup-card__title-group">
                          <Smartphone size={16} className="text-cyan" />
                          <h5>Patient Mobile Tracker</h5>
                        </div>
                      </div>
                      <div className="mobile-tracker-screen">
                        <span className="mobile-clinic-label">Drittech Health Polyclinic</span>
                        <div className="mobile-token-display">
                          <span className="token-caption">YOUR QUEUE TOKEN</span>
                          <h2 className="token-number">A-002</h2>
                        </div>
                        <div className="mobile-status-banner">
                          <Clock size={16} className="text-cyan" />
                          <div>
                            <strong>1 patient ahead of you</strong>
                            <span>Estimated wait: ~8 minutes</span>
                          </div>
                        </div>
                        <p className="mobile-helper-text">
                          You're in the queue. We'll alert your phone when your turn is approaching.
                        </p>
                      </div>
                    </div>

                    <div className="mockup-card mockup-card--doctor">
                      <div className="mockup-card__header">
                        <div className="mockup-card__title-group">
                          <Stethoscope size={16} className="text-cyan" />
                          <h5>Doctor Clinical Console</h5>
                        </div>
                        <span className="badge badge--completed">Autosaved</span>
                      </div>
                      <div className="mockup-clinical-notes">
                        <div className="clinical-field">
                          <label>Chief Complaint</label>
                          <p>Upper respiratory congestion, sore throat (4 days)</p>
                        </div>
                        <div className="clinical-field">
                          <label>Assessment &amp; Diagnosis</label>
                          <p>Acute Nasopharyngitis (J00) - Viral URI</p>
                        </div>
                        <div className="clinical-actions">
                          <button type="button" className="mini-btn mini-btn--primary">Complete Visit</button>
                          <button type="button" className="mini-btn mini-btn--outline">Order Labs</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="marketing-partners">
        <div className="marketing-partners__container">
          <p className="marketing-partners__title">
            In collaboration with modern healthcare systems &amp; medical protocols
          </p>
          <div className="partners-grid">
            <div className="partner-item"><span className="partner-name">HL7 FHIR</span></div>
            <div className="partner-item"><span className="partner-name">Epic Systems</span></div>
            <div className="partner-item"><span className="partner-name">Cerner Health</span></div>
            <div className="partner-item"><span className="partner-name">Siemens Health</span></div>
            <div className="partner-item"><span className="partner-name">Quest Diagnostics</span></div>
            <div className="partner-item"><span className="partner-name">HIPAA Compliant</span></div>
          </div>
        </div>
      </section>

      <section className="marketing-section section-spotlight">
        <div className="marketing-section__container">
          <h2 className="section-dark-title">
            Transform Chaotic Waiting Rooms into Connected Care
          </h2>
          <p className="section-dark-subtitle">
            Traditional clinics lose patient trust through opaque waiting times and disconnected manual records.
          </p>

          <div className="spotlight-grid">
            <div className="spotlight-card">
              <div className="spotlight-card__media">
                <img
                  src="/images/clinic_waiting_lounge.jpg"
                  alt="Modern clinic waiting lounge"
                  loading="lazy"
                />
              </div>
              <div className="spotlight-card__body">
                <div className="spotlight-card__tag">Traditional Problem</div>
                <h3 className="spotlight-card__title">Crowded Waiting Rooms</h3>
                <p className="spotlight-card__desc">
                  Patients are trapped in congested waiting areas with zero clarity on when they will be seen by their physician.
                </p>
                <div className="spotlight-card__solution">
                  <CheckCircle2 size={16} className="solution-icon" />
                  <span>
                    <strong>Drittech Solution:</strong> Live mobile tracking lets patients wait comfortably anywhere while watching their turn approach.
                  </span>
                </div>
                <Link to="/features" className="spotlight-card__link">
                  <span>Learn More</span>
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>

            <div className="spotlight-card">
              <div className="spotlight-card__media">
                <img
                  src="/images/clinic_reception_desk.jpg"
                  alt="Modern clinical reception desk"
                  loading="lazy"
                />
              </div>
              <div className="spotlight-card__body">
                <div className="spotlight-card__tag">Traditional Problem</div>
                <h3 className="spotlight-card__title">Manual Reception Workflows</h3>
                <p className="spotlight-card__desc">
                  Receptionists juggle paper clipboards, walk-in interruptions, and frantic phone inquiries from anxious patients.
                </p>
                <div className="spotlight-card__solution">
                  <CheckCircle2 size={16} className="solution-icon" />
                  <span>
                    <strong>Drittech Solution:</strong> 1-click token dispatch, automated turn notifications, and synchronized TV waiting room screens.
                  </span>
                </div>
                <Link to="/features" className="spotlight-card__link">
                  <span>Learn More</span>
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>

            <div className="spotlight-card">
              <div className="spotlight-card__media">
                <img
                  src="/images/medical_lab_diagnostic.jpg"
                  alt="Advanced medical diagnostic laboratory"
                  loading="lazy"
                />
              </div>
              <div className="spotlight-card__body">
                <div className="spotlight-card__tag">Traditional Problem</div>
                <h3 className="spotlight-card__title">Delayed Paper Diagnostic Reports</h3>
                <p className="spotlight-card__desc">
                  Patients make unnecessary physical trips to pick up paper test results that cause confusion without physician guidance.
                </p>
                <div className="spotlight-card__solution">
                  <CheckCircle2 size={16} className="solution-icon" />
                  <span>
                    <strong>Drittech Solution:</strong> Instant digital report delivery with automated plain-language patient summaries.
                  </span>
                </div>
                <Link to="/features" className="spotlight-card__link">
                  <span>Learn More</span>
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section section-features-grid">
        <div className="marketing-section__container">
          <h2 className="section-dark-title">
            Engineered for Clinical Precision
          </h2>
          <p className="section-dark-subtitle">
            Every feature connects doctors, receptionists, laboratory technicians, and patients into one synchronized ecosystem.
          </p>

          <div className="capabilities-grid">
            <div className="capability-card">
              <div className="capability-card__icon-circle">
                <Layers size={20} />
              </div>
              <h4 className="capability-card__title">Atomic Real-Time Queue Engine</h4>
              <p className="capability-card__desc">
                Eliminate double-calling collisions. Queue state is synchronized across receptionists, doctors, and TV displays with WebSocket streaming.
              </p>
            </div>

            <div className="capability-card capability-card--highlighted">
              <div className="capability-card__icon-circle capability-card__icon-circle--active">
                <Clock size={20} />
              </div>
              <h4 className="capability-card__title">Dynamic Wait-Time Estimation</h4>
              <p className="capability-card__desc">
                Self-adjusting estimation models that factor in provider-specific historical consultation paces, queue density, and clinical priorities.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-card__icon-circle">
                <Stethoscope size={20} />
              </div>
              <h4 className="capability-card__title">Distraction-Free Doctor Console</h4>
              <p className="capability-card__desc">
                Minimalist clinical workstation with patient history, vitals, autosaving consultation drafts, and 1-click diagnostic orders.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-card__icon-circle">
                <BellRing size={20} />
              </div>
              <h4 className="capability-card__title">Smart Turn Approaching Alerts</h4>
              <p className="capability-card__desc">
                Automated alerts notify patients 15 minutes before their estimated consultation turn so they can be ready at the clinic.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-card__icon-circle">
                <FlaskConical size={20} />
              </div>
              <h4 className="capability-card__title">Diagnostic Lab Workspace</h4>
              <p className="capability-card__desc">
                Track test samples from collection to publication with private encrypted object storage and authorized download links.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-card__icon-circle">
                <FileText size={20} />
              </div>
              <h4 className="capability-card__title">Plain-Language Lab Summaries</h4>
              <p className="capability-card__desc">
                Converts dense laboratory reference intervals into clear, patient-friendly bullet points with clinical safety disclaimers.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-card__icon-circle">
                <Users size={20} />
              </div>
              <h4 className="capability-card__title">Role-Based Clinical Workflows</h4>
              <p className="capability-card__desc">
                Strict privacy boundaries for medical staff, receptionists, laboratory technicians, and verified patients.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-card__icon-circle">
                <Tv size={20} />
              </div>
              <h4 className="capability-card__title">Zero Waiting Room Guessing</h4>
              <p className="capability-card__desc">
                Synchronized high-visibility TV displays and personal phone trackers keep every stakeholder informed in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section section-stories">
        <div className="marketing-section__container">
          <div className="stories-header">
            <div>
              <h2 className="section-dark-title">Stories Behind Us</h2>
              <p className="section-dark-subtitle">
                Read our stories behind how Drittech was made and used by healthcare teams worldwide.
              </p>
            </div>

            <div className="stories-controls">
              <button
                type="button"
                className="stories-nav-btn"
                onClick={handlePrevStory}
                aria-label="Previous story"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="stories-nav-btn stories-nav-btn--next"
                onClick={handleNextStory}
                aria-label="Next story"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="stories-cards-grid">
            {stories.map((story, idx) => (
              <div
                key={story.author}
                className={`story-card ${idx === currentStory ? 'story-card--active' : ''}`}
              >
                <div className="story-card__author">
                  <img src={story.avatar} alt={story.author} className="story-card__avatar" />
                  <div className="story-card__meta">
                    <strong>{story.author}</strong>
                    <span>{story.role}</span>
                  </div>
                </div>
                <h4 className="story-card__title">{story.title}</h4>
                <p className="story-card__snippet">{story.content}</p>
                <div className="story-card__footer">
                  <Link to="/about" className="story-card__link">
                    <span>Read this story</span>
                    <ChevronRight size={14} />
                  </Link>
                  <span className="story-card__time">{story.readTime}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="steps-flow-container">
            <div className="steps-flow-header">
              <h3 className="steps-flow-title">How Drittech Connects Every Visit</h3>
            </div>

            <div className="steps-flow-grid">
              <div className="step-card-dark">
                <div className="step-card-dark__num">01</div>
                <h4>Patient Registration</h4>
                <p>Receptionist registers patient or checks in appointment with 1 click.</p>
              </div>

              <div className="step-card-dark">
                <div className="step-card-dark__num">02</div>
                <h4>Token &amp; Tracker Link</h4>
                <p>Patient receives unique SMS/QR token link with high-entropy tracking privacy.</p>
              </div>

              <div className="step-card-dark">
                <div className="step-card-dark__num">03</div>
                <h4>Live Queue &amp; TV Display</h4>
                <p>Estimated wait updates in real time on the patient's phone and waiting-room TV.</p>
              </div>

              <div className="step-card-dark">
                <div className="step-card-dark__num">04</div>
                <h4>Clinical Consultation</h4>
                <p>Doctor calls next patient, records clinical notes, and orders diagnostic labs.</p>
              </div>

              <div className="step-card-dark">
                <div className="step-card-dark__num">05</div>
                <h4>Digital Lab Delivery</h4>
                <p>Lab publishes verified report with plain-language summary directly to patient portal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-newsletter">
        <div className="newsletter-radar">
          <div className="radar-circle circle-1" />
          <div className="radar-circle circle-2" />
          <div className="radar-circle circle-3" />
          <div className="radar-circle circle-4" />
        </div>

        <div className="marketing-newsletter__container">
          <h2 className="newsletter-title">
            Join our newsletter to keep update with us!
          </h2>
          <p className="newsletter-subtitle">
            Give Your Patients a Better Waiting Experience. Deploy Drittech in minutes. Streamline queues, reduce staff burnout, and deliver secure digital care.
          </p>

          {newsletterSubmitted ? (
            <div className="newsletter-success">
              <CheckCircle2 size={24} className="text-cyan" />
              <div>
                <strong>Thank you for subscribing!</strong>
                <p>We've sent our latest clinical flow optimization playbook to your email.</p>
              </div>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <div className="newsletter-input-group">
                <div className="input-field">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={subscriberName}
                    onChange={(e) => setSubscriberName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-field">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="newsletter-submit-btn">
                  Subscribe
                </button>
              </div>
            </form>
          )}

          <div className="newsletter-community">
            <span className="community-label">And join our community to be the part of us</span>
            <div className="community-icons">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="community-icon-link" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="community-icon-link" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="community-icon-link" aria-label="Discord">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="community-icon-link" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};
