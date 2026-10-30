import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Layers,
  Clock,
  Calendar,
  FileText,
  Download,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { queueService } from '../../services/queueService';
import './PatientTracker.scss';

export const PatientPortalHomePage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeQueue, setActiveQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const [repRes, queueRes] = await Promise.all([
          reportService.getPatientReports(),
          queueService.getQueue(),
        ]);

        if (repRes.success) {
          setReports(repRes.data);
        }
        if (queueRes.success) {
          // Find if current user has an active token today
          const myEntry = queueRes.data.find(
            (q) => q.patientId?.email?.toLowerCase() === user?.email?.toLowerCase()
          );
          if (myEntry) setActiveQueue(myEntry);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [user]);

  const handleDownload = async (reportId) => {
    try {
      const res = await reportService.getDownloadLink(reportId);
      if (res.success) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      alert(err.message || 'Download error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Welcome Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #0F172A 100%)',
          color: '#FFFFFF',
          padding: '2.25rem',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 700, letterSpacing: '0.06em' }}>
          WELCOME TO YOUR PATIENT PORTAL
        </span>
        <h2 style={{ color: '#FFFFFF', margin: '0.35rem 0 0.5rem', fontWeight: 800 }}>Hello, {user?.name}</h2>
        <p style={{ color: '#BFDBFE', margin: 0, fontSize: '0.9375rem' }}>
          Track your live outpatient queue tokens, upcoming consultations, and verified laboratory reports securely.
        </p>
      </div>

      {/* Active Live Token Banner if patient is in queue */}
      {activeQueue && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid #2563EB',
            backgroundColor: '#121520',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            borderRadius: '22px',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#38BDF8',
                backgroundColor: '#0E1119',
                padding: '0.25rem 1rem',
                borderRadius: '12px',
                border: '1px solid #1E2538',
              }}
            >
              {activeQueue.tokenNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge--called">Active Queue Session</span>
                <span style={{ fontSize: '0.8125rem', color: '#0F766E', fontWeight: 600 }}>
                  ~{activeQueue.estimatedWaitMinutes} mins wait
                </span>
              </div>
              <h4 style={{ margin: '0.35rem 0 0.15rem' }}>
                {activeQueue.departmentId?.name || 'General Consultation'}
              </h4>
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                {activeQueue.patientsAhead} patient{activeQueue.patientsAhead === 1 ? '' : 's'} ahead of you
              </span>
            </div>
          </div>

          <Link to={`/track/${activeQueue.trackingToken}`}>
            <Button variant="primary" icon={ExternalLink}>
              Open Live Mobile Tracker
            </Button>
          </Link>
        </div>
      )}

      {/* Verified Lab Reports Grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>My Diagnostic Laboratory Reports</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Published medical test results with plain-language automated summaries
            </p>
          </div>
          <Link to="/patient/reports">
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              View All
            </Button>
          </Link>
        </div>

        {reports.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map((report) => (
              <div
                key={report._id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #E4EAF0',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 style={{ margin: '0 0 0.15rem' }}>{report.title}</h4>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Report #{report.reportNumber} • Test Date: {new Date(report.testDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownload(report._id)}
                  >
                    Download PDF
                  </Button>
                </div>

                {/* AI Plain-Language Bullets */}
                {report.aiSummary?.bullets?.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginTop: '0.75rem',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} color="#0F766E" />
                      <strong style={{ fontSize: '0.8125rem', color: '#0F766E' }}>
                        Patient-Friendly Test Overview:
                      </strong>
                    </div>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {report.aiSummary.bullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                    <p style={{ fontSize: '0.7rem', color: '#718096', margin: '0.65rem 0 0' }}>
                      {report.aiSummary.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted">
            No diagnostic reports on file yet. Once completed by the laboratory, they will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
