import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  PhoneCall,
  UserX,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Volume2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { queueService } from '../../services/queueService';
import { useSocket } from '../../context/SocketContext';
import './Reception.scss';

export const ReceptionQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTokenModal, setSelectedTokenModal] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const { socket } = useSocket();

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await queueService.getQueue();
      if (res.success) {
        setQueue(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('queue:updated', fetchQueue);
      socket.on('queue:entry-created', fetchQueue);
      socket.on('queue:patient-called', fetchQueue);

      return () => {
        socket.off('queue:updated', fetchQueue);
        socket.off('queue:entry-created', fetchQueue);
        socket.off('queue:patient-called', fetchQueue);
      };
    }
  }, [socket]);

  const handleRecall = async (id) => {
    try {
      await queueService.recallPatient(id);
      fetchQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSkip = async (id) => {
    if (window.confirm('Mark this patient as absent/skipped?')) {
      try {
        await queueService.skipPatient(id);
        fetchQueue();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleComplete = async (id) => {
    try {
      await queueService.completePatient(id);
      fetchQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.tokenNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patientId?.patientIdentifier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTrackingUrl = (token) => {
    return `${window.location.origin}/track/${token}`;
  };

  const handleCopyLink = (token) => {
    navigator.clipboard.writeText(getTrackingUrl(token));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="reception-page">
      {/* Header & Filter Controls */}
      <div className="card">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="cf-input-wrapper">
            <Search className="cf-input-icon" size={18} />
            <input
              type="text"
              className="cf-input cf-input--with-icon"
              placeholder="Search token, patient name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} color="#718096" />
            <select
              className="cf-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Queue Statuses</option>
              <option value="waiting">Waiting Only</option>
              <option value="called">Called</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped / Absent</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" icon={RefreshCw} onClick={fetchQueue}>
              Refresh Queue
            </Button>
          </div>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Details</th>
                <th>Priority</th>
                <th>Department & Doctor</th>
                <th>Ahead</th>
                <th>Wait Est.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length > 0 ? (
                filteredQueue.map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <button
                        className="token-btn"
                        onClick={() => setSelectedTokenModal(entry)}
                        title="View Patient Token & Tracking QR"
                      >
                        <span className="font-mono font-bold text-primary">{entry.tokenNumber}</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{entry.patientId?.fullName || 'Patient'}</strong>
                        <span>ID: {entry.patientId?.patientIdentifier} • {entry.patientId?.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-tag priority-tag--${entry.priority}`}>
                        {entry.priority}
                      </span>
                    </td>
                    <td>
                      <div className="department-cell">
                        <strong>{entry.departmentId?.name || 'General'}</strong>
                        <span>{entry.doctorId?.userId?.name ? `Dr. ${entry.doctorId.userId.name}` : 'Unassigned'}</span>
                      </div>
                    </td>
                    <td>{entry.status === 'waiting' ? `${entry.patientsAhead || 0} ahead` : '-'}</td>
                    <td>
                      {entry.status === 'waiting' ? `~${entry.estimatedWaitMinutes || 0}m` : '-'}
                    </td>
                    <td>
                      <Badge status={entry.status} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {entry.status === 'waiting' || entry.status === 'called' ? (
                          <>
                            <button
                              className="action-icon-btn"
                              title="Recall Patient"
                              onClick={() => handleRecall(entry._id)}
                            >
                              <Volume2 size={16} color="#0F766E" />
                            </button>
                            <button
                              className="action-icon-btn"
                              title="Mark Absent / Skipped"
                              onClick={() => handleSkip(entry._id)}
                            >
                              <UserX size={16} color="#E53E3E" />
                            </button>
                          </>
                        ) : null}
                        {entry.status === 'in_consultation' && (
                          <button
                            className="action-icon-btn"
                            title="Mark Completed"
                            onClick={() => handleComplete(entry._id)}
                          >
                            <CheckCircle2 size={16} color="#10B981" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted">
                    No matching queue entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Token & QR Modal */}
      {selectedTokenModal && (
        <Modal
          isOpen={!!selectedTokenModal}
          onClose={() => setSelectedTokenModal(null)}
          title={`Token Pass: ${selectedTokenModal.tokenNumber}`}
          subtitle="Patient Live Tracking & Instructions"
        >
          <div className="token-modal-content">
            <div className="token-badge-large">
              <span>ACTIVE TOKEN</span>
              <h2>{selectedTokenModal.tokenNumber}</h2>
              <span className="patient-name">{selectedTokenModal.patientId?.fullName}</span>
            </div>

            <div className="token-details-grid">
              <div>
                <label>Department</label>
                <strong>{selectedTokenModal.departmentId?.name}</strong>
              </div>
              <div>
                <label>Estimated Wait</label>
                <strong>~{selectedTokenModal.estimatedWaitMinutes} minutes</strong>
              </div>
            </div>

            <div className="tracking-url-box">
              <label>Live Mobile Tracker Link:</label>
              <div className="url-copy-row">
                <input
                  type="text"
                  readOnly
                  className="cf-input"
                  value={getTrackingUrl(selectedTokenModal.trackingToken)}
                />
                <Button
                  variant="primary"
                  icon={copiedLink ? Check : Copy}
                  onClick={() => handleCopyLink(selectedTokenModal.trackingToken)}
                >
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <a
                href={getTrackingUrl(selectedTokenModal.trackingToken)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" icon={ExternalLink}>
                  Open Mobile Tracker
                </Button>
              </a>
              <Button variant="secondary" onClick={() => window.print()}>
                Print Token
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
