import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { reportService } from '../../services/reportService';
import './PatientTracker.scss';

export const PatientReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getPatientReports();
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = async (id) => {
    try {
      const res = await reportService.getDownloadLink(id);
      if (res.success) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      alert(err.message || 'Download failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>My Published Diagnostic Reports</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Encrypted lab results with short-lived private access tokens
            </p>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchReports}>
            Refresh
          </Button>
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
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 style={{ margin: 0 }}>{report.title}</h4>
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

                {report.aiSummary?.bullets?.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#F0FDF9',
                      border: '1px solid #A7F3D0',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginTop: '0.75rem',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} color="#0F766E" />
                      <strong style={{ fontSize: '0.8125rem', color: '#0F766E' }}>
                        Patient Summary:
                      </strong>
                    </div>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {report.aiSummary.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted">
            No diagnostic reports found
          </div>
        )}
      </div>
    </div>
  );
};
