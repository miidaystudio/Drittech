import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import apiClient from '../../services/apiClient';
import './Admin.scss';

export const AdminDepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '', avgWaitTimeMinutes: 15 });

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/departments');
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/departments', newDept);
      setModalOpen(false);
      setNewDept({ name: '', code: '', description: '', avgWaitTimeMinutes: 15 });
      fetchDepts();
    } catch (err) {
      alert(err.message || 'Failed to create department');
    }
  };

  return (
    <div className="admin-page">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Clinic Clinical Departments</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Service divisions with independent token sequencing and duration baselines
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            Add Department
          </Button>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                <th>Description</th>
                <th>Default Avg Wait</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d._id}>
                  <td>
                    <span className="font-mono font-bold text-primary">{d.code}</span>
                  </td>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.description || '-'}</td>
                  <td>~{d.avgWaitTimeMinutes || 15} mins</td>
                  <td><span className="badge badge--completed">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Clinical Department"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Department Name *"
            required
            placeholder="e.g. Dermatology"
            value={newDept.name}
            onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
          />
          <Input
            label="Department Code (Prefix) *"
            required
            placeholder="e.g. DERM"
            value={newDept.code}
            onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
          />
          <Input
            label="Average Consultation Time (Minutes)"
            type="number"
            value={newDept.avgWaitTimeMinutes}
            onChange={(e) => setNewDept({ ...newDept, avgWaitTimeMinutes: e.target.value })}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Department</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
