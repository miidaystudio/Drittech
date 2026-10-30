import React, { useState, useEffect } from 'react';
import { FlaskConical, Search, CheckCircle2, Clock, UploadCloud, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { reportService } from '../../services/reportService';
import { Link } from 'react-router-dom';
import './Lab.scss';

export const LabOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await reportService.getLabOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await reportService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const filteredOrders = orders.filter(
    (o) => statusFilter === 'all' || o.status === statusFilter
  );

  return (
    <div className="lab-page">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              className="cf-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Diagnostic Order Statuses</option>
              <option value="ordered">Ordered (Sample Needed)</option>
              <option value="sample_collected">Sample Collected</option>
              <option value="processing">Processing in Lab</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="published">Published</option>
            </select>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchOrders}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Patient Details</th>
                <th>Test Type</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Update Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{order.patientId?.fullName}</strong>
                        <span>ID: {order.patientId?.patientIdentifier}</span>
                      </div>
                    </td>
                    <td><strong>{order.testType}</strong></td>
                    <td>{order.category}</td>
                    <td>
                      <span className={`priority-tag priority-tag--${order.urgency}`}>
                        {order.urgency}
                      </span>
                    </td>
                    <td><Badge status={order.status} /></td>
                    <td>
                      <select
                        className="cf-input"
                        style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem' }}
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        disabled={order.status === 'published'}
                      >
                        <option value="ordered">Ordered</option>
                        <option value="sample_collected">Sample Collected</option>
                        <option value="processing">Processing</option>
                        <option value="awaiting_review">Awaiting Review</option>
                        <option value="published" disabled>Published</option>
                      </select>
                    </td>
                    <td>
                      {order.status !== 'published' ? (
                        <Link to={`/app/lab/upload-report?orderId=${order._id}`}>
                          <Button size="sm" variant="secondary" icon={UploadCloud}>
                            Upload
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                          ✓ Published
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted">
                    No diagnostic orders match the current filter
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
