import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Layers,
  Search,
  ArrowRight,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { queueService } from '../../services/queueService';
import apiClient from '../../services/apiClient';
import { useSocket } from '../../context/SocketContext';
import './Reception.scss';

export const ReceptionOverviewPage = () => {
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState({
    waiting: 0,
    inConsultation: 0,
    completed: 0,
    avgWait: 14,
  });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchQueue = async () => {
    try {
      const res = await queueService.getQueue();
      if (res.success) {
        const entries = res.data;
        setQueue(entries);

        const waiting = entries.filter((e) => e.status === 'waiting').length;
        const inConsultation = entries.filter((e) => e.status === 'in_consultation' || e.status === 'called').length;
        const completed = entries.filter((e) => e.status === 'completed').length;

        setMetrics({
          waiting,
          inConsultation,
          completed,
          avgWait: 14,
        });
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

  return (
    <div className="reception-page">
      {/* Top Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--warning">
            <Users size={20} />
          </div>
          <div>
            <span className="metric-card__label">Patients Waiting</span>
            <h3 className="metric-card__value">{metrics.waiting}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--primary">
            <Stethoscope size={20} />
          </div>
          <div>
            <span className="metric-card__label">In Consultation</span>
            <h3 className="metric-card__value">{metrics.inConsultation}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--success">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="metric-card__label">Completed Today</span>
            <h3 className="metric-card__value">{metrics.completed}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--info">
            <Clock size={20} />
          </div>
          <div>
            <span className="metric-card__label">Avg Wait Time</span>
            <h3 className="metric-card__value">~{metrics.avgWait}m</h3>
          </div>
        </div>
      </div>

      {/* Action Banner */}
      <div className="reception-quick-actions">
        <div>
          <h3>Front Desk Quick Intake</h3>
          <p>Register walk-in patients or check-in scheduled clinic appointments</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/reception/register-patient">
            <Button variant="primary" icon={UserPlus}>
              Register Walk-in Patient
            </Button>
          </Link>
          <Link to="/app/reception/check-in">
            <Button variant="outline" icon={Users}>
              Appointment Check-in
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Queue Snapshot Table */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Active Waiting & In-Consultation Queue</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Real-time synchronization across clinic screens
            </p>
          </div>
          <Link to="/app/reception/queue">
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              Full Queue Manager
            </Button>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Department</th>
                <th>Doctor</th>
                <th>Wait Est.</th>
                <th>Status</th>
                <th>Check-in</th>
              </tr>
            </thead>
            <tbody>
              {queue.length > 0 ? (
                queue.slice(0, 6).map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <span className="font-mono font-bold text-primary">
                        {entry.tokenNumber}
                      </span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{entry.patientId?.fullName || 'Patient'}</strong>
                        <span>{entry.patientId?.patientIdentifier}</span>
                      </div>
                    </td>
                    <td>{entry.departmentId?.name || 'General'}</td>
                    <td>
                      {entry.doctorId?.userId?.name ? `Dr. ${entry.doctorId.userId.name}` : 'Next Available'}
                    </td>
                    <td>~{entry.estimatedWaitMinutes || 0} mins</td>
                    <td>
                      <Badge status={entry.status} />
                    </td>
                    <td>
                      {new Date(entry.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-muted">
                    No active patients in queue right now
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
