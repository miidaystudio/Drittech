# Drittech Security & Compliance Architecture

Drittech adheres to strict software security engineering best practices for sensitive outpatient flow and diagnostic data.

## Security Controls Implemented

1. **HttpOnly Cookie Sessions & JWT Rotation:**
   - Access tokens (15m expiry) and refresh tokens (7d expiry) are delivered in secure HttpOnly cookies to defend against XSS-based credential theft.
   - Refresh tokens undergo cryptographic rotation upon every renewal.

2. **Role-Based Access Control (RBAC):**
   - 6 distinct roles: `super_admin`, `clinic_admin`, `receptionist`, `doctor`, `lab_technician`, and `patient`.
   - Clinical consultation notes are restricted exclusively to doctors and clinical administrators. Receptionists and laboratory staff are strictly unauthorized on both frontend routes and backend APIs.

3. **Multi-Tenant Clinic Boundary Enforcement:**
   - Every database query and WebSocket subscription validates clinic membership.
   - Cross-tenant data inspection is rejected at the middleware tier.

4. **Expiring Signed URLs for Diagnostic Files:**
   - Medical reports are kept in private storage without public bucket URLs.
   - Authorized users request short-lived (15-minute) HMAC cryptographic download tokens.

5. **Public Interface Data Minimization:**
   - The waiting-room TV display and guest mobile tracker expose only token numbers, room numbers, and wait minutes.
   - No patient names, phone numbers, or health details are broadcast across public channels.

6. **Comprehensive Audit Trails:**
   - All logins, patient registrations, queue state modifications, report uploads, and clinical visits are permanently written to an immutable audit log collection.

> [!IMPORTANT]
> **Compliance Notice:** While Drittech implements security controls aligned with HIPAA and GDPR guidelines, deploying the system for real patient operations requires regional regulatory review and healthcare compliance auditing for your specific deployment jurisdiction.
