import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  Clock,
  Users,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
  Stethoscope,
  Volume2,
} from 'lucide-react';
import { queueService } from '../../services/queueService';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../../components/ui/Button';
import './PatientTracker.scss';

export const PatientTrackerPage = () => {
  const { trackingToken } = useParams();
  const { socket, connected } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrackerData = async () => {
    try {
      setRefreshing(true);
      const res = await queueService.trackToken(trackingToken);
      if (res.success) {
        setData(res.data);
        setError('');
      }
    } catch (err) {
      setError(err.message || 'Unable to find active queue session for this token.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();

    // Polling fallback every 20 seconds
    const interval = setInterval(fetchTrackerData, 20000);
    return () => clearInterval(interval);
  }, [trackingToken]);

  // Real-time socket listener
  useEffect(() => {
    if (socket && trackingToken) {
      socket.emit('join:token', trackingToken);

      const handleUpdate = () => {
        fetchTrackerData();
      };

      socket.on('queue:patient-called', handleUpdate);
      socket.on('queue:updated', handleUpdate);

      return () => {
        socket.off('queue:patient-called', handleUpdate);
        socket.off('queue:updated', handleUpdate);
      };
    }
  }, [socket, trackingToken]);

  if (loading) {
    return (
      <div className="tracker-loading">
        <Activity size={36} color="#0F766E" className="animate-spin" />
        <p>Connecting to Live Queue Engine...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="tracker-page">
        <div className="tracker-card tracker-card--error">
          <AlertCircle size={48} color="#E53E3E" />
          <h2>Tracking Session Expired</h2>
          <p>{error || 'This queue tracking token is invalid or the consultation has concluded.'}</p>
          <Link to="/">
            <Button variant="primary">Return to Drittech Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCalled = data.status === 'called';
  const isInConsultation = data.status === 'in_consultation';
  const isCompleted = data.status === 'completed';

  return (
    <div className="tracker-page">
      <div className="tracker-card">
        {/* Header */}
        <header className="tracker-card__header">
          <div className="tracker-card__brand">
            <div className="tracker-logo-icon">
              <Activity size={18} color="#0F766E" />
            </div>
            <div>
              <h3>{data.clinic?.name || 'Drittech Health Polyclinic'}</h3>
              <span>{data.department?.name || 'General Consultation'}</span>
            </div>
          </div>

          <button
            className="tracker-refresh-btn"
            onClick={fetchTrackerData}
            disabled={refreshing}
            title="Refresh Token Status"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </header>

        {/* Live Call Banner if status is CALLED */}
        {isCalled && (
          <div className="tracker-called-alert">
            <div className="tracker-called-alert__icon">
              <Bell size={24} />
            </div>
            <div>
              <h4>IT'S YOUR TURN!</h4>
              <p>
                Please proceed to <strong>{data.doctor?.roomNumber || 'Room 101'}</strong> now.
              </p>
            </div>
          </div>
        )}

        {/* Big Prominent Token Display */}
        <div className={`tracker-token-box ${isCalled ? 'tracker-token-box--called' : ''}`}>
          <span className="tracker-token-box__label">YOUR QUEUE TOKEN</span>
          <h1 className="tracker-token-box__number">{data.tokenNumber}</h1>
          <div className="tracker-token-box__badge">
            <span className={`badge badge--${data.status}`}>{data.status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Queue Metrics & Wait Indicator */}
        {!isCompleted && !isInConsultation && (
          <div className="tracker-metrics">
            <div className="tracker-metric-item">
              <div className="tracker-metric-item__icon">
                <Users size={18} color="#0F766E" />
              </div>
              <div className="tracker-metric-item__content">
                <strong>{data.patientsAhead} patients</strong>
                <span>ahead of you</span>
              </div>
            </div>

            <div className="tracker-metric-item">
              <div className="tracker-metric-item__icon">
                <Clock size={18} color="#0F766E" />
              </div>
              <div className="tracker-metric-item__content">
                <strong>~{data.estimatedWaitMinutes} mins</strong>
                <span>estimated wait</span>
              </div>
            </div>
          </div>
        )}

        {/* Context Status Message */}
        <div className="tracker-status-message">
          {isCalled ? (
            <p className="text-highlight">
              Dr. {data.doctor?.name || 'Physician'} is ready to see you in {data.doctor?.roomNumber || 'Room 101'}.
            </p>
          ) : isInConsultation ? (
            <p>Your consultation is currently in progress.</p>
          ) : isCompleted ? (
            <p className="text-success">
              ✓ Consultation completed. Your doctor notes and diagnostic test orders have been filed.
            </p>
          ) : data.patientsAhead === 0 ? (
            <p>You are next in line! Please wait near the consultation room.</p>
          ) : (
            <p>
              You're in the queue. We'll automatically notify you when your turn is approaching.
            </p>
          )}
        </div>

        {/* Doctor & Location Info */}
        <div className="tracker-info-section">
          {data.doctor && (
            <div className="tracker-info-row">
              <Stethoscope size={16} color="#718096" />
              <div>
                <strong>Assigned Doctor:</strong>
                <span>Dr. {data.doctor.name} ({data.doctor.specialty})</span>
              </div>
            </div>
          )}

          {data.clinic?.phone && (
            <div className="tracker-info-row">
              <Phone size={16} color="#718096" />
              <div>
                <strong>Reception Contact:</strong>
                <span>{data.clinic.phone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live sync indicator */}
        <div className="tracker-footer">
          <span className="tracker-sync-status">
            <span className={`sync-dot ${connected ? 'sync-dot--connected' : ''}`} />
            {connected ? 'Real-time WebSocket Live Sync' : 'Auto-polling backup active'}
          </span>
          <span className="tracker-date">{data.queueDate}</span>
        </div>
      </div>
    </div>
  );
};
