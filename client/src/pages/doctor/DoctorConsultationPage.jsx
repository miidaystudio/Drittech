import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FlaskConical,
  History,
  Activity,
  Heart,
  FileText,
  Clock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import apiClient from '../../services/apiClient';
import './Doctor.scss';

export const DoctorConsultationPage = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [previousConsultations, setPreviousConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved | pending | error
  const [completing, setCompleting] = useState(false);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [vitals, setVitals] = useState({
    bloodPressure: '120/80',
    heartRate: '72',
    temperature: '98.6',
    oxygenSaturation: '99',
    weightKg: '',
  });
  const [clinicalExamination, setClinicalExamination] = useState('');
  const [assessment, setAssessment] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescriptions, setPrescriptions] = useState([
    { medicationName: '', dosage: '', frequency: 'Once daily', duration: '5 days', instructions: '' },
  ]);
  const [recommendedLabTests, setRecommendedLabTests] = useState([]);

  const fetchConsultation = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/consultations/${consultationId}`);
      if (res.success) {
        const c = res.data.consultation;
        setConsultation(c);
        setPreviousConsultations(res.data.previousConsultations || []);

        setChiefComplaint(c.chiefComplaint || '');
        if (c.vitals) setVitals(c.vitals);
        setClinicalExamination(c.clinicalExamination || '');
        setAssessment(c.assessment || '');
        setDiagnosis(c.diagnosis || '');
        setTreatmentPlan(c.treatmentPlan || '');
        if (c.prescriptions && c.prescriptions.length > 0) setPrescriptions(c.prescriptions);
        if (c.recommendedLabTests && c.recommendedLabTests.length > 0) setRecommendedLabTests(c.recommendedLabTests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultation();
  }, [consultationId]);

  // Autosave draft handler with 1.5s debounce
  useEffect(() => {
    if (!consultation || consultation.status === 'completed') return;

    setSaveStatus('pending');
    const handler = setTimeout(async () => {
      try {
        setSaving(true);
        await apiClient.patch(`/consultations/${consultationId}`, {
          chiefComplaint,
          vitals,
          clinicalExamination,
          assessment,
          diagnosis,
          treatmentPlan,
          prescriptions,
          recommendedLabTests,
        });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      } finally {
        setSaving(false);
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [
    chiefComplaint,
    vitals,
    clinicalExamination,
    assessment,
    diagnosis,
    treatmentPlan,
    prescriptions,
    recommendedLabTests,
  ]);

  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicationName: '', dosage: '', frequency: 'Once daily', duration: '5 days', instructions: '' },
    ]);
  };

  const handleRemovePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, idx) => idx !== index));
  };

  const handleAddLabTest = (testName) => {
    if (!recommendedLabTests.some((t) => t.testName === testName)) {
      setRecommendedLabTests([...recommendedLabTests, { testName, urgency: 'routine', instructions: '' }]);
    }
  };

  const handleRemoveLabTest = (index) => {
    setRecommendedLabTests(recommendedLabTests.filter((_, idx) => idx !== index));
  };

  const handleCompleteConsultation = async () => {
    if (!diagnosis && !chiefComplaint) {
      alert('Please enter clinical assessment or chief complaint before finalizing.');
      return;
    }

    try {
      setCompleting(true);
      const res = await apiClient.post(`/consultations/${consultationId}/complete`, {
        chiefComplaint,
        vitals,
        clinicalExamination,
        assessment,
        diagnosis,
        treatmentPlan,
        prescriptions,
        recommendedLabTests,
      });

      if (res.success) {
        alert('Consultation completed successfully! Patient queue updated and any lab orders dispatched.');
        navigate('/app/doctor');
      }
    } catch (err) {
      alert(err.message || 'Failed to complete visit');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading clinical consultation workspace...</div>;
  }

  const patient = consultation?.patientId;

  return (
    <div className="doctor-console">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between card" style={{ padding: '1rem 1.5rem' }}>
        <div className="flex items-center gap-3">
          <span className="badge badge--called font-mono font-bold" style={{ fontSize: '0.875rem' }}>
            Token {consultation?.queueEntryId?.tokenNumber || 'GEN-001'}
          </span>
          <span className="text-muted">|</span>
          <span style={{ fontSize: '0.875rem' }}>
            Session started:{' '}
            {new Date(consultation?.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: saveStatus === 'saved' ? '#10B981' : saveStatus === 'pending' ? '#F59E0B' : '#E53E3E',
            }}
          >
            {saveStatus === 'saved' ? '✓ Draft autosaved' : saveStatus === 'pending' ? 'Saving changes...' : 'Save error'}
          </span>

          <Button
            variant="primary"
            icon={CheckCircle2}
            loading={completing}
            onClick={handleCompleteConsultation}
          >
            Complete & Close Visit
          </Button>
        </div>
      </div>

      {/* Two-Column Clinical Workspace */}
      <div className="consultation-workspace">
        {/* Left Column: Patient Profile & History */}
        <aside className="patient-history-sidebar">
          {/* Patient Card */}
          <div className="patient-profile-card">
            <div className="patient-profile-card__avatar">
              {patient?.fullName?.charAt(0).toUpperCase()}
            </div>
            <h3>{patient?.fullName}</h3>
            <span className="mrn-tag">MRN: {patient?.patientIdentifier}</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
              <div><strong>Age / Gender:</strong> {patient?.age} yrs / {patient?.gender}</div>
              <div><strong>Blood Group:</strong> {patient?.bloodGroup}</div>
              <div><strong>Contact:</strong> {patient?.phone}</div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E53E3E', textTransform: 'uppercase' }}>
                Allergies
              </label>
              <div className="info-badge-list">
                {patient?.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((a, i) => (
                    <span key={i} className="badge badge--skipped">{a}</span>
                  ))
                ) : (
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>No known drug allergies</span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase' }}>
                Chronic Conditions
              </label>
              <div className="info-badge-list">
                {patient?.chronicConditions && patient.chronicConditions.length > 0 ? (
                  patient.chronicConditions.map((c, i) => (
                    <span key={i} className="badge badge--waiting">{c}</span>
                  ))
                ) : (
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>None recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Vitals History / Triage Box */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} color="#0F766E" />
              <h5 style={{ margin: 0, fontSize: '0.875rem' }}>Current Visit Vitals</h5>
            </div>
            <div className="vitals-grid">
              <div className="vital-box">
                <label>Blood Pressure</label>
                <input
                  type="text"
                  className="cf-input"
                  style={{ height: '32px', marginTop: '4px' }}
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                />
              </div>
              <div className="vital-box">
                <label>Heart Rate (bpm)</label>
                <input
                  type="text"
                  className="cf-input"
                  style={{ height: '32px', marginTop: '4px' }}
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                />
              </div>
              <div className="vital-box">
                <label>Temp (°F)</label>
                <input
                  type="text"
                  className="cf-input"
                  style={{ height: '32px', marginTop: '4px' }}
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                />
              </div>
              <div className="vital-box">
                <label>SpO2 (%)</label>
                <input
                  type="text"
                  className="cf-input"
                  style={{ height: '32px', marginTop: '4px' }}
                  value={vitals.oxygenSaturation}
                  onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Previous Visits History */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-2 mb-3">
              <History size={16} color="#0F766E" />
              <h5 style={{ margin: 0, fontSize: '0.875rem' }}>Past Consultation History</h5>
            </div>
            {previousConsultations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {previousConsultations.map((prev) => (
                  <div
                    key={prev._id}
                    style={{
                      padding: '0.65rem',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '6px',
                      border: '1px solid #E4EAF0',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>
                      {new Date(prev.completedAt || prev.createdAt).toLocaleDateString()} • Dr. {prev.doctorId?.userId?.name}
                    </span>
                    <strong style={{ display: 'block', fontSize: '0.8125rem', marginTop: '2px' }}>
                      {prev.diagnosis || prev.chiefComplaint}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                No previous clinical records for this patient
              </span>
            )}
          </div>
        </aside>

        {/* Main Column: Clinical Examination & Treatment Plan */}
        <main className="clinical-notes-main">
          {/* Section 1: Chief Complaint & Exam */}
          <div>
            <h5 className="section-divider-title">1. Subjective & Objective Findings</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Chief Complaint *"
                placeholder="e.g. Upper respiratory congestion and productive cough for 4 days"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />

              <div className="cf-input-group">
                <label className="cf-input-label">Clinical Examination & Physical Observations</label>
                <textarea
                  className="cf-input"
                  rows={3}
                  placeholder="HEENT, chest auscultation, cardiovascular, abdomen, neurological observations..."
                  style={{ height: 'auto', padding: '0.75rem' }}
                  value={clinicalExamination}
                  onChange={(e) => setClinicalExamination(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Assessment & Diagnosis */}
          <div>
            <h5 className="section-divider-title">2. Assessment & Diagnosis</h5>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Clinical Assessment"
                placeholder="e.g. Viral Upper Respiratory Infection"
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
              />
              <Input
                label="Primary Diagnosis (ICD-10)"
                placeholder="e.g. Acute Nasopharyngitis (J00)"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Diagnostic Lab Orders */}
          <div>
            <div className="flex items-center justify-between section-divider-title">
              <span>3. Order Diagnostic Laboratory Tests</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#718096' }}>
                Auto-generates lab orders upon visit completion
              </span>
            </div>

            {/* Quick Lab Test Picker Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {[
                'Complete Blood Count (CBC)',
                'Comprehensive Metabolic Panel (CMP)',
                'Lipid Profile Panel',
                'Thyroid Stimulating Hormone (TSH)',
                'Hemoglobin A1c (HbA1c)',
                'Vitamin D (25-Hydroxy)',
              ].map((test) => (
                <button
                  key={test}
                  type="button"
                  className="demo-account-btn"
                  onClick={() => handleAddLabTest(test)}
                >
                  <Plus size={12} color="#0F766E" />
                  <span>{test}</span>
                </button>
              ))}
            </div>

            {/* Selected Lab Orders */}
            {recommendedLabTests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recommendedLabTests.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: '#F0FDF9',
                      border: '1px solid #A7F3D0',
                      borderRadius: '8px',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FlaskConical size={16} color="#0F766E" />
                      <strong>{t.testName}</strong>
                    </div>
                    <button
                      type="button"
                      className="action-icon-btn"
                      onClick={() => handleRemoveLabTest(idx)}
                      title="Remove test"
                    >
                      <Trash2 size={14} color="#E53E3E" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
                No diagnostic laboratory tests currently attached to this visit.
              </p>
            )}
          </div>

          {/* Section 4: Prescription & Treatment Plan */}
          <div>
            <div className="flex items-center justify-between section-divider-title">
              <span>4. Medications & Rx Prescription</span>
              <Button size="sm" variant="outline" icon={Plus} onClick={handleAddPrescription}>
                Add Medication
              </Button>
            </div>

            {prescriptions.map((rx, idx) => (
              <div key={idx} className="prescription-row">
                <input
                  type="text"
                  className="cf-input"
                  placeholder="Medication name (e.g. Amoxicillin 500mg)"
                  value={rx.medicationName}
                  onChange={(e) => {
                    const copy = [...prescriptions];
                    copy[idx].medicationName = e.target.value;
                    setPrescriptions(copy);
                  }}
                />
                <input
                  type="text"
                  className="cf-input"
                  placeholder="Dosage (1 tab)"
                  value={rx.dosage}
                  onChange={(e) => {
                    const copy = [...prescriptions];
                    copy[idx].dosage = e.target.value;
                    setPrescriptions(copy);
                  }}
                />
                <select
                  className="cf-input"
                  value={rx.frequency}
                  onChange={(e) => {
                    const copy = [...prescriptions];
                    copy[idx].frequency = e.target.value;
                    setPrescriptions(copy);
                  }}
                >
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily (BID)">Twice daily (BID)</option>
                  <option value="Three times daily (TID)">Three times daily (TID)</option>
                  <option value="As needed (PRN)">As needed (PRN)</option>
                </select>
                <input
                  type="text"
                  className="cf-input"
                  placeholder="Duration (5 days)"
                  value={rx.duration}
                  onChange={(e) => {
                    const copy = [...prescriptions];
                    copy[idx].duration = e.target.value;
                    setPrescriptions(copy);
                  }}
                />
                {prescriptions.length > 1 && (
                  <button
                    type="button"
                    className="action-icon-btn"
                    onClick={() => handleRemovePrescription(idx)}
                  >
                    <Trash2 size={14} color="#E53E3E" />
                  </button>
                )}
              </div>
            ))}

            <div className="cf-input-group mt-4">
              <label className="cf-input-label">Patient Follow-up & Discharge Instructions</label>
              <textarea
                className="cf-input"
                rows={2}
                placeholder="Hydration, rest, warning signs requiring immediate return, follow-up in 2 weeks..."
                style={{ height: 'auto', padding: '0.75rem' }}
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
