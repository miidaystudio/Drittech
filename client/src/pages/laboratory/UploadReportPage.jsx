import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { reportService } from '../../services/reportService';
import './Lab.scss';

export const UploadReportPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [file, setFile] = useState(null);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [parameters, setParameters] = useState([
    { parameter: 'Total Cholesterol', value: '185', unit: 'mg/dL', referenceRange: '< 200', flag: 'NORMAL' },
    { parameter: 'Fasting Blood Glucose', value: '94', unit: 'mg/dL', referenceRange: '70 - 99', flag: 'NORMAL' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await reportService.getLabOrders({ status: 'processing' });
        if (res.success) {
          setOrders(res.data);
          if (!selectedOrderId && res.data.length > 0) {
            setSelectedOrderId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, []);

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      { parameter: '', value: '', unit: '', referenceRange: '', flag: 'NORMAL' },
    ]);
  };

  const handleRemoveParam = (index) => {
    setParameters(parameters.filter((_, idx) => idx !== index));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 15 * 1024 * 1024) {
        setError('File exceeds 15MB size limit');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError('Please select a valid diagnostic lab order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('labOrderId', selectedOrderId);
      if (file) formData.append('file', file);
      formData.append('technicianNotes', technicianNotes);
      formData.append('results', JSON.stringify(parameters));

      const res = await reportService.uploadReport(formData);
      if (res.success) {
        // Automatically publish report to patient portal
        await reportService.publishReport(res.data._id);
        alert('Diagnostic report uploaded, AI patient summary generated, and report published to patient portal!');
        navigate('/app/lab/reports');
      }
    } catch (err) {
      setError(err.message || 'Report upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lab-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
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
            <UploadCloud size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Upload Diagnostic Test Report</h3>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Files are encrypted in private storage with automatic AI patient-friendly summary generation
            </p>
          </div>
        </div>

        {error && (
          <div className="auth-card__alert auth-card__alert--danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Order Selection */}
          <div className="cf-input-group">
            <label className="cf-input-label">Select Laboratory Order *</label>
            <select
              className="cf-input"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              required
            >
              <option value="">-- Choose Test Order --</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} • {o.patientId?.fullName} ({o.testType})
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Dropzone */}
          <div>
            <label className="cf-input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
              Report Document (PDF, JPEG, PNG, DICOM)
            </label>
            <label className="upload-dropzone">
              <input
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.jpg,.jpeg,.png,.dcm"
                onChange={handleFileChange}
              />
              <div className="upload-dropzone__icon">
                <FileText size={24} />
              </div>
              <h4>{file ? file.name : 'Click to select or drop lab report file'}</h4>
              <p>{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Maximum file size: 15MB • Encrypted on upload'}</p>
            </label>
          </div>

          {/* Structured Parameters Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <strong style={{ fontSize: '0.9375rem', display: 'block' }}>
                  Structured Laboratory Parameters & Flags
                </strong>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Used to generate plain-language patient explanations
                </span>
              </div>
              <Button size="sm" variant="outline" icon={Plus} onClick={handleAddParam}>
                Add Parameter
              </Button>
            </div>

            {parameters.map((p, idx) => (
              <div key={idx} className="parameter-row">
                <input
                  type="text"
                  className="cf-input"
                  placeholder="Test (e.g. Hemoglobin)"
                  value={p.parameter}
                  onChange={(e) => {
                    const copy = [...parameters];
                    copy[idx].parameter = e.target.value;
                    setParameters(copy);
                  }}
                  required
                />
                <input
                  type="text"
                  className="cf-input"
                  placeholder="Value (14.2)"
                  value={p.value}
                  onChange={(e) => {
                    const copy = [...parameters];
                    copy[idx].value = e.target.value;
                    setParameters(copy);
                  }}
                  required
                />
                <input
                  type="text"
                  className="cf-input"
                  placeholder="Unit (g/dL)"
                  value={p.unit}
                  onChange={(e) => {
                    const copy = [...parameters];
                    copy[idx].unit = e.target.value;
                    setParameters(copy);
                  }}
                />
                <input
                  type="text"
                  className="cf-input"
                  placeholder="Ref Range (12 - 16)"
                  value={p.referenceRange}
                  onChange={(e) => {
                    const copy = [...parameters];
                    copy[idx].referenceRange = e.target.value;
                    setParameters(copy);
                  }}
                />
                <select
                  className="cf-input"
                  value={p.flag}
                  onChange={(e) => {
                    const copy = [...parameters];
                    copy[idx].flag = e.target.value;
                    setParameters(copy);
                  }}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="LOW">LOW</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                {parameters.length > 1 && (
                  <button
                    type="button"
                    className="action-icon-btn"
                    onClick={() => handleRemoveParam(idx)}
                  >
                    <Trash2 size={14} color="#E53E3E" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Technician Notes */}
          <div className="cf-input-group">
            <label className="cf-input-label">Technician Notes & Calibration Verification</label>
            <textarea
              className="cf-input"
              rows={2}
              placeholder="Controls within standard tolerances. Verified by laboratory technologist."
              style={{ height: 'auto', padding: '0.75rem' }}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" variant="primary" loading={loading} icon={Send}>
            Verify & Publish to Patient Portal
          </Button>
        </form>
      </div>
    </div>
  );
};
