import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { patientService } from '../../services/patientService';
import apiClient from '../../services/apiClient';
import './Reception.scss';

export const RegisterPatientPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    age: '',
    gender: 'unspecified',
    bloodGroup: 'Unknown',
    departmentId: '',
    doctorId: '',
    priority: 'normal',
    entryType: 'walk_in',
    notes: '',
  });

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredResult, setRegisteredResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, docRes] = await Promise.all([
          apiClient.get('/admin/departments'),
          apiClient.get('/admin/doctors'),
        ]);
        if (deptRes.success) {
          setDepartments(deptRes.data);
          if (deptRes.data.length > 0) {
            setFormData((prev) => ({ ...prev, departmentId: deptRes.data[0]._id }));
          }
        }
        if (docRes.success) {
          setDoctors(docRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await patientService.registerPatient(formData);
      if (res.success) {
        setRegisteredResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to register patient and issue token');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRegisteredResult(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      age: '',
      gender: 'unspecified',
      bloodGroup: 'Unknown',
      departmentId: departments[0]?._id || '',
      doctorId: '',
      priority: 'normal',
      entryType: 'walk_in',
      notes: '',
    });
  };

  const getTrackingUrl = (token) => {
    return `${window.location.origin}/track/${token}`;
  };

  const handleCopy = (token) => {
    navigator.clipboard.writeText(getTrackingUrl(token));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="reception-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* If patient registered, show Confirmation Token Pass */}
      {registeredResult ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            {registeredResult.isExistingPatient ? 'Existing Patient Checked In' : 'Patient Registration Complete'}
          </h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Queue token generated and real-time wait estimation initialized
          </p>

          <div
            style={{
              background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '480px',
              margin: '0 auto 2rem',
              boxShadow: '0 10px 25px rgba(15, 118, 110, 0.3)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: '#DDF7EE', letterSpacing: '0.08em', fontWeight: 600 }}>
              OFFICIAL CLINIC TOKEN
            </span>
            <h1 style={{ fontFamily: 'monospace', fontSize: '4.5rem', margin: '0.25rem 0', color: '#FFFFFF' }}>
              {registeredResult.queueEntry?.tokenNumber}
            </h1>
            <h4 style={{ margin: '0 0 0.5rem', color: '#FFFFFF' }}>
              {registeredResult.patient?.fullName}
            </h4>
            <span style={{ fontSize: '0.8125rem', color: '#A7F3D0' }}>
              Patient ID: {registeredResult.patient?.patientIdentifier}
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                backgroundColor: 'rgba(0,0,0,0.18)',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1.5rem',
                textAlign: 'left',
              }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: '#DDF7EE' }}>Wait Estimate</label>
                <strong style={{ display: 'block', color: '#FFFFFF' }}>
                  ~{registeredResult.queueEntry?.estimatedWaitMinutes} mins
                </strong>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#DDF7EE' }}>Patients Ahead</label>
                <strong style={{ display: 'block', color: '#FFFFFF' }}>
                  {registeredResult.queueEntry?.patientsAhead} ahead
                </strong>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '520px', margin: '0 auto 2rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Patient Mobile Live Tracking Link:
            </label>
            <div className="url-copy-row">
              <input
                type="text"
                readOnly
                className="cf-input"
                value={getTrackingUrl(registeredResult.queueEntry?.trackingToken)}
              />
              <Button
                variant="primary"
                icon={copiedLink ? Check : Copy}
                onClick={() => handleCopy(registeredResult.queueEntry?.trackingToken)}
              >
                {copiedLink ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Print Token Slip
            </Button>
            <a
              href={getTrackingUrl(registeredResult.queueEntry?.trackingToken)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" icon={ExternalLink}>
                View Live Tracker
              </Button>
            </a>
            <Button variant="primary" icon={UserPlus} onClick={resetForm}>
              Register Next Patient
            </Button>
          </div>
        </div>
      ) : (
        /* Patient Intake Registration Form */
        <div className="card" style={{ padding: '2rem' }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#DDF7EE',
                color: '#0F766E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Register Walk-in Patient & Issue Queue Token</h3>
              <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
                All fields validated with automatic duplicate patient detection
              </p>
            </div>
          </div>

          {error && (
            <div className="auth-card__alert auth-card__alert--danger mb-4">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Demographics */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name *"
                required
                placeholder="e.g. Robert Henderson"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input
                label="Contact Phone Number *"
                required
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Age"
                type="number"
                placeholder="Years"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
              <Select
                label="Gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[
                  { label: 'Unspecified', value: 'unspecified' },
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                  { label: 'Other', value: 'other' },
                ]}
              />
            </div>

            {/* Department & Triage */}
            <div className="grid md:grid-cols-3 gap-4">
              <Select
                label="Clinic Department *"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                options={departments.map((d) => ({ label: `${d.name} (${d.code})`, value: d._id }))}
              />

              <Select
                label="Assign Specific Doctor"
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              >
                <option value="">Next Available Doctor</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.userId?.name} ({doc.specialty})
                  </option>
                ))}
              </Select>

              <Select
                label="Queue Priority Class"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { label: 'Normal Walk-in', value: 'normal' },
                  { label: 'Senior Citizen / Pediatric', value: 'senior_child' },
                  { label: 'Urgent Triage', value: 'urgent' },
                  { label: 'Emergency', value: 'emergency' },
                ]}
              />
            </div>

            {/* Visit Reason / Intake Notes */}
            <div className="cf-input-group">
              <label className="cf-input-label">Chief Complaint / Triage Notes</label>
              <textarea
                className="cf-input"
                rows={3}
                placeholder="Reason for consultation, presenting symptoms, or special instructions..."
                style={{ height: 'auto', padding: '0.75rem' }}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <Button type="submit" size="lg" variant="primary" loading={loading} icon={Layers}>
              Generate Token & Add to Queue
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
