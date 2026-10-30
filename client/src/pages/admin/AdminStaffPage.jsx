import React, { useState, useEffect } from 'react';
import { Stethoscope, User, Shield, Mail, Phone } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { Badge } from '../../components/ui/Badge';
import './Admin.scss';

export const AdminStaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/admin/staff');
        if (res.success) {
          setStaff(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <div className="admin-page">
      <div className="card">
        <h4 style={{ margin: '0 0 1rem' }}>Clinical Providers & Administrative Staff</h4>
        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>
                    <span className="badge badge--called" style={{ textTransform: 'capitalize' }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    <Badge status="completed">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
