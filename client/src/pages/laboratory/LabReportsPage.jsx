import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { reportService } from '../../services/reportService';
import './Lab.scss';

export const LabReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getReports();
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

  const handleDownload = async (reportId) => {
    try {
      const res = await reportService.getDownloadLink(reportId);
      if (res.success) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate download link');
    }
  };

  return (
    <div className="lab-page">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Verified Diagnostic Reports Archive</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Published reports with automated AI patient explanations and private storage tokens
            </p>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchReports}>
            Refresh
          </Button>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Report #</th>
                <th>Patient Details</th>
                <th>Test Title</th>
                <th>Test Date</th>
                <th>AI Summary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <span className="font-mono font-bold text-primary">{r.reportNumber}</span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{r.patientId?.fullName}</strong>
                        <span>ID: {r.patientId?.patientIdentifier}</span>
                      </div>
                    </td>
                    <td><strong>{r.title}</strong></td>
                    <td>{new Date(r.testDate).toLocaleDateString()}</td>
                    <td>
                      {r.aiSummary?.bullets?.length > 0 ? (
                        <button
                          className="demo-account-btn"
                          onClick={() => setSelectedReport(r)}
                        >
                          <Sparkles size={12} color="#0F766E" />
                          <span>View Summary</span>
                        </button>
                      ) : (
                        <span className="text-muted">Standard</span>
                      )}
                    </td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Download}
                        onClick={() => handleDownload(r._id)}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No diagnostic reports found in archive
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Plain-Language Explanation Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`AI Patient Explanation: ${selectedReport.title}`}
          subtitle={`Report Ref: ${selectedReport.reportNumber} • Patient: ${selectedReport.patientId?.fullName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                backgroundColor: '#F0FDF9',
                border: '1px solid #A7F3D0',
                borderRadius: '8px',
                padding: '1.25rem',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} color="#0F766E" />
                <strong style={{ color: '#0F766E' }}>Plain-Language Findings Overview:</strong>
              </div>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                {selectedReport.aiSummary?.bullets?.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: '#FEF3C7', padding: '0.85rem', borderRadius: '6px', fontSize: '0.75rem', color: '#92400E' }}>
              <strong>Clinical Disclaimer:</strong> {selectedReport.aiSummary?.disclaimer}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="primary" icon={Download} onClick={() => handleDownload(selectedReport._id)}>
                Download Full PDF Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
