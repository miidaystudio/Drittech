import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../services/apiClient';
import './Admin.scss';

export const AdminSettingsPage = () => {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/admin/settings');
        if (res.success) {
          setClinic(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await apiClient.patch('/admin/settings', {
        name: clinic.name,
        phone: clinic.phone,
        email: clinic.email,
        settings: clinic.settings,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading settings...</div>;
  }

  return (
    <div className="admin-page" style={{ maxWidth: '780px' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h4 style={{ margin: '0 0 1.5rem' }}>Clinic Facility Configuration</h4>

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem',
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              borderRadius: '8px',
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={18} />
            <span>Clinic settings successfully updated!</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Clinic Official Name"
            value={clinic?.name || ''}
            onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={clinic?.phone || ''}
              onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
            />
            <Input
              label="Contact Email"
              value={clinic?.email || ''}
              onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Default Avg Consultation Duration (Minutes)"
              type="number"
              value={clinic?.settings?.averageConsultationTimeMinutes || 15}
              onChange={(e) =>
                setClinic({
                  ...clinic,
                  settings: {
                    ...clinic.settings,
                    averageConsultationTimeMinutes: parseInt(e.target.value, 10),
                  },
                })
              }
            />
            <Input
              label="Turn Approaching Alert Threshold (Minutes)"
              type="number"
              value={clinic?.settings?.turnApproachingMinutes || 15}
              onChange={(e) =>
                setClinic({
                  ...clinic,
                  settings: {
                    ...clinic.settings,
                    turnApproachingMinutes: parseInt(e.target.value, 10),
                  },
                })
              }
            />
          </div>

          <Button type="submit" variant="primary" loading={saving} icon={Save} className="mt-4">
            Save Clinic Settings
          </Button>
        </form>
      </div>
    </div>
  );
};
