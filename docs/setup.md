# Drittech Setup & Installation Guide

## Prerequisites
- Node.js v18+ or v20+ (tested on v26)
- MongoDB v5+ or Atlas cluster running on port 27017
- Python 3.9+ (Optional: for ML wait-time regression service)

## Step-by-Step Installation

1. **Install Monorepo Dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure Environment Variables:**
   - Server: `server/.env` (defaults configured for local MongoDB)
   - Client: `client/.env` (`VITE_API_BASE_URL=/api/v1`)

3. **Seed Database with Demo Dataset:**
   ```bash
   npm run seed
   ```

4. **Start Development Server (Concurrent Client & Server):**
   ```bash
   npm run dev
   ```
   - Client UI: `http://localhost:5173`
   - Server API: `http://localhost:5000`

## Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@drittech.com` | `admin123` |
| **Clinic Admin** | `clinicadmin@drittech.com` | `admin123` |
| **Doctor** | `doctor.sarah@drittech.com` | `doctor123` |
| **Receptionist** | `reception@drittech.com` | `reception123` |
| **Lab Technician** | `lab@drittech.com` | `lab123` |
| **Patient** | `patient@drittech.com` | `patient123` |

*Tip: On the `/login` page, you can click any of the 1-Click Demo buttons to instantly log in as any role.*

## Public Endpoints
- Live Patient Tracker: `http://localhost:5173/track/track_james_wilson_demo_token_123`
- Waiting-Room TV Screen: `http://localhost:5173/display/all/all`
