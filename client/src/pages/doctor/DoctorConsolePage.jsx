import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope,
  Users,
  Clock,
  PhoneCall,
  CheckCircle2,
  FileText,
  AlertCircle,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { queueService } from '../../services/queueService';
import apiClient from '../../services/apiClient';
import { useSocket } from '../../context/SocketContext';
import './Doctor.scss';

export const DoctorConsolePage = () => {
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [currentConsultation, setCurrentConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [callMessage, setCallMessage] = useState('');
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchDoctorState = async () => {
    try {
      setLoading(true);
      const [queueRes, consultRes] = await Promise.all([
        queueService.getQueue({ status: 'waiting' }),
        apiClient.get('/consultations', { params: { status: 'draft' } }),
      ]);

      if (queueRes.success) {
        setWaitingQueue(queueRes.data);
      }
      if (consultRes.success && consultRes.data.length > 0) {
        setCurrentConsultation(consultRes.data[0]);
      } else {
        setCurrentConsultation(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorState();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('queue:updated', fetchDoctorState);
      socket.on('queue:entry-created', fetchDoctorState);

      return () => {
        socket.off('queue:updated', fetchDoctorState);
        socket.off('queue:entry-created', fetchDoctorState);
      };
    }
  }, [socket]);

  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      setCallMessage('');
      const res = await queueService.callNextPatient();

      if (res.success && res.data) {
        // Automatically start or get active consultation
        const startRes = await apiClient.post('/consultations', {
          patientId: res.data.patientId._id,
          queueEntryId: res.data._id,
        });

        if (startRes.success) {
          navigate(`/app/doctor/consultation/${startRes.data._id}`);
        }
      } else {
        setCallMessage('No eligible waiting patients in your queue right now.');
      }
    } catch (err) {
      alert(err.message || 'Failed to call patient');
    } finally {
      setCallingNext(false);
    }
  };

  return (
    <div className="doctor-console">
      {/* Top Action Header: Big "Call Next Patient" Action */}
      <div className="doctor-call-banner">
        <div className="doctor-call-banner__info">
          <h2>Clinical Consultation Station</h2>
          <p>
            {waitingQueue.length} patient{waitingQueue.length === 1 ? '' : 's'} waiting in line for consultation.
          </p>
        </div>

        <div className="doctor-call-banner__action">
          <Button
            size="lg"
            variant="primary"
            loading={callingNext}
            icon={PhoneCall}
            onClick={handleCallNext}
            className="call-next-btn"
          >
            Call Next Patient
          </Button>
        </div>
      </div>

      {callMessage && (
        <div className="auth-card__alert auth-card__alert--warning">
          <AlertCircle size={18} />
          <span>{callMessage}</span>
        </div>
      )}

      {/* Active In-Progress Consultation Card (If one is already ongoing) */}
      {currentConsultation && (
        <div className="card active-consult-card">
          <div className="active-consult-card__badge">
            <span className="pulse-dot" /> ACTIVE IN-PROGRESS CONSULTATION
          </div>
          <div className="active-consult-card__body">
            <div>
              <h3>{currentConsultation.patientId?.fullName}</h3>
              <p>
                Patient ID: {currentConsultation.patientId?.patientIdentifier} •{' '}
                {currentConsultation.patientId?.age} yrs • Blood:{' '}
                {currentConsultation.patientId?.bloodGroup}
              </p>
              <span className="complaint-snippet">
                Chief Complaint: {currentConsultation.chiefComplaint || 'Consultation in session...'}
              </span>
            </div>
            <Link to={`/app/doctor/consultation/${currentConsultation._id}`}>
              <Button variant="primary" icon={ChevronRight}>
                Resume Consultation Notes
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Waiting Patient Queue */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Eligible Waiting Patients</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Ordered by triage priority and arrival timestamp
            </p>
          </div>
          <span className="badge badge--waiting">{waitingQueue.length} Waiting</span>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Name</th>
                <th>Priority</th>
                <th>Arrival Time</th>
                <th>Estimated Wait</th>
                <th>Chief Complaint / Intake Note</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {waitingQueue.length > 0 ? (
                waitingQueue.map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <span className="font-mono font-bold text-primary" style={{ fontSize: '1.05rem' }}>
                        {entry.tokenNumber}
                      </span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{entry.patientId?.fullName}</strong>
                        <span>
                          {entry.patientId?.age} yrs • {entry.patientId?.gender}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-tag priority-tag--${entry.priority}`}>
                        {entry.priority}
                      </span>
                    </td>
                    <td>
                      {new Date(entry.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>~{entry.estimatedWaitMinutes} mins</td>
                    <td>
                      <span className="intake-notes-text">
                        {entry.notes || 'Routine consultation check-in'}
                      </span>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={PhoneCall}
                        onClick={async () => {
                          const startRes = await apiClient.post('/consultations', {
                            patientId: entry.patientId._id,
                            queueEntryId: entry._id,
                          });
                          if (startRes.success) {
                            navigate(`/app/doctor/consultation/${startRes.data._id}`);
                          }
                        }}
                      >
                        Call
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No waiting patients currently in queue.
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
