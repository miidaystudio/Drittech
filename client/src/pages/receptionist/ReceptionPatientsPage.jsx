import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, Calendar, Layers, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { patientService } from '../../services/patientService';
import './Reception.scss';

export const ReceptionPatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientService.getPatients({ search });
      if (res.success) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  return (
    <div className="reception-page">
      <div className="card">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="cf-input-wrapper">
            <Search className="cf-input-icon" size={18} />
            <input
              type="text"
              className="cf-input cf-input--with-icon"
              placeholder="Search patients by name, MRN identifier, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Patient Identifier</th>
                <th>Full Name</th>
                <th>Age / Gender</th>
                <th>Phone</th>
                <th>Blood Group</th>
                <th>Allergies</th>
                <th>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span className="font-mono font-bold text-primary">{p.patientIdentifier}</span>
                    </td>
                    <td>
                      <strong>{p.fullName}</strong>
                    </td>
                    <td>
                      {p.age || '-'} yrs / <span style={{ textTransform: 'capitalize' }}>{p.gender}</span>
                    </td>
                    <td>{p.phone}</td>
                    <td>{p.bloodGroup || 'Unknown'}</td>
                    <td>
                      {p.allergies && p.allergies.length > 0 ? (
                        <span className="badge badge--skipped">{p.allergies.join(', ')}</span>
                      ) : (
                        <span className="text-muted">None noted</span>
                      )}
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No patient records found
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
