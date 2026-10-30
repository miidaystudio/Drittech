# Drittech REST API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication
- `POST /auth/login` — Sign in with email & password (sets HttpOnly cookies).
- `POST /auth/register` — Create patient or clinic account.
- `POST /auth/refresh` — Rotate refresh session and issue new access token.
- `POST /auth/logout` — Revoke refresh token and clear cookies.
- `POST /auth/forgot-password` — Password reset trigger.
- `GET /auth/me` — Get current authenticated user profile.

### Queue Engine
- `GET /queue` — Retrieve active queue for clinic/department.
- `POST /queue` — Register patient into live queue.
- `POST /queue/call-next` — Atomically claim and call next eligible patient (Doctor/Admin).
- `POST /queue/:id/recall` — Re-broadcast audio/visual call for token.
- `POST /queue/:id/skip` — Mark patient absent/skipped.
- `POST /queue/:id/complete` — Mark queue entry completed.
- `GET /queue/track/:token` — Public guest mobile tracker payload (sanitized).
- `GET /queue/display/:clinicId/:departmentId` — Public waiting-room TV display payload.

### Patients & Appointments
- `GET /patients` — Query patient directory with pagination & search.
- `POST /patients` — Register new patient with duplicate checking.
- `GET /patients/:id` — Patient detail.
- `GET /appointments` — Clinic appointments.
- `POST /appointments` — Book new appointment.
- `POST /appointments/:id/check-in` — Check in and assign queue token.

### Clinical Consultations
- `GET /consultations` — List consultations.
- `POST /consultations` — Start or retrieve draft consultation session.
- `GET /consultations/:id` — Full clinical notes & previous visit history.
- `PATCH /consultations/:id` — Autosave clinical draft.
- `POST /consultations/:id/complete` — Finalize visit and create recommended lab orders.

### Diagnostic Laboratory & Reports
- `GET /lab/orders` — List test orders with status filters.
- `POST /lab/orders` — Create new test order.
- `PATCH /lab/orders/:id/status` — Advance specimen lifecycle.
- `POST /lab/reports` — Upload report, enter parameters, and generate AI summary.
- `GET /lab/reports` — List reports.
- `POST /lab/reports/:id/publish` — Publish report to patient portal.
- `GET /patient/reports` — Authenticated patient's verified reports.
- `POST /patient/reports/:id/download-link` — Generate 15-minute expiring signed download URL.
- `GET /patient/reports/download/:token` — Stream verified private report file.

### Analytics & Governance
- `GET /analytics/overview` — Top metrics, active breakdown, and workload.
- `GET /analytics/patient-flow` — Multi-day flow trends.
- `GET /analytics/doctor-stats` — Provider utilization scores.
- `GET /admin/audit-logs` — Security audit logs.
- `GET /admin/settings` & `PATCH /admin/settings` — Clinic configuration.
