import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  FileCheck2,
  Clock,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { reportService } from '../../services/reportService';
import './Lab.scss';

export const LabOverviewPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    pending: 0,
    processing: 0,
    awaitingReview: 0,
    published: 0,
    avgTat: 3.5,
  });

  useEffect(() => {
    const fetchLabData = async () => {
      try {
        setLoading(true);
        const res = await reportService.getLabOrders();
        if (res.success) {
          setOrders(res.data);
          const pending = res.data.filter((o) => o.status === 'ordered').length;
          const processing = res.data.filter((o) => o.status === 'sample_collected' || o.status === 'processing').length;
          const awaitingReview = res.data.filter((o) => o.status === 'awaiting_review').length;
          const published = res.data.filter((o) => o.status === 'published').length;

          setMetrics({
            pending,
            processing,
            awaitingReview,
            published,
            avgTat: 3.2,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLabData();
  }, []);

  return (
    <div className="lab-page">
      {/* Metrics Row */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--warning">
            <FlaskConical size={20} />
          </div>
          <div>
            <span className="metric-card__label">Pending Orders</span>
            <h3 className="metric-card__value">{metrics.pending}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--info">
            <Clock size={20} />
          </div>
          <div>
            <span className="metric-card__label">In Processing</span>
            <h3 className="metric-card__value">{metrics.processing}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--primary">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="metric-card__label">Awaiting Review</span>
            <h3 className="metric-card__value">{metrics.awaitingReview}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--success">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="metric-card__label">Published Reports</span>
            <h3 className="metric-card__value">{metrics.published}</h3>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="reception-quick-actions">
        <div>
          <h3>Diagnostic Center Lab Operations</h3>
          <p>Collect specimens, process clinical diagnostics, and upload verified reports</p>
        </div>
        <Link to="/app/lab/upload-report">
          <Button variant="primary" icon={UploadCloud}>
            Upload & Publish Report
          </Button>
        </Link>
      </div>

      {/* Active Lab Orders Table */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Recent Diagnostic Orders</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Specimen tracking and turnaround lifecycle
            </p>
          </div>
          <Link to="/app/lab/orders">
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              View All Orders
            </Button>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Patient Details</th>
                <th>Test Type</th>
                <th>Urgency</th>
                <th>Ordering Doctor</th>
                <th>Status</th>
                <th>Ordered On</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.slice(0, 6).map((order) => (
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
                    <td>
                      <span className={`priority-tag priority-tag--${order.urgency}`}>
                        {order.urgency}
                      </span>
                    </td>
                    <td>Dr. {order.doctorId?.userId?.name || 'Physician'}</td>
                    <td><Badge status={order.status} /></td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No active diagnostic orders found
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
