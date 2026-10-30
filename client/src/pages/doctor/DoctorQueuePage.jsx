import React, { useState, useEffect } from 'react';
import { Layers, PhoneCall, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { queueService } from '../../services/queueService';
import apiClient from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import './Doctor.scss';

export const DoctorQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  return (
    <div className="doctor-console">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Doctor Patient Flow Queue</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              All waiting and in-consultation visits for today
            </p>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchQueue}>
            Refresh
          </Button>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Details</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Check-in Time</th>
                <th>Wait Est.</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.length > 0 ? (
                queue.map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <span className="font-mono font-bold text-primary">{entry.tokenNumber}</span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{entry.patientId?.fullName}</strong>
                        <span>ID: {entry.patientId?.patientIdentifier} • {entry.patientId?.age} yrs</span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-tag priority-tag--${entry.priority}`}>{entry.priority}</span>
                    </td>
                    <td>{entry.departmentId?.name}</td>
                    <td>
                      {new Date(entry.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>~{entry.estimatedWaitMinutes}m</td>
                    <td><Badge status={entry.status} /></td>
                    <td>
                      {entry.status === 'waiting' && (
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
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted">
                    No active patients in queue
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
