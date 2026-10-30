# 🏥 Drittech — Clinic & Diagnostic Center Patient Flow Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20WebSockets-0F766E.svg)](https://react.dev)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-3B82F6.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20ODM-10B981.svg)](https://www.mongodb.com)

> **Less Waiting. Better Patient Care.**  
> A complete, production-oriented MERN SaaS application that coordinates outpatient queues, waiting-room TV displays, doctor clinical consultations, and digital diagnostic laboratory reports with real-time WebSocket synchronization.

---

## 🌟 Six Interconnected User Experiences

```
                  ┌──────────────────────────────────────────────┐
                  │                 Users & Clients              │
                  ├──────────────┬──────────────┬────────────────┤
                  │ Receptionist │    Doctor    │    Patient     │
                  │   Console    │   Console    │ Mobile Tracker │
                  ├──────────────┼──────────────┼────────────────┤
                  │     Admin    │  Diagnostic  │  Waiting-Room  │
                  │   Analytics  │   Lab Desk   │   TV Display   │
                  └──────┬───────┴──────┬───────┴────────┬───────┘
                         │              │                │
                         ▼              ▼                ▼
            ┌─────────────────────────────────────────────────────────┐
            │               Frontend (React 19 + Vite)                │
            │  TanStack Query • Axios Interceptors • SCSS Tokens      │
            └───────────────────────────┬─────────────────────────────┘
                                        │ (HTTP REST / WebSocket)
                                        ▼
            ┌─────────────────────────────────────────────────────────┐
            │               Backend (Node.js & Express)               │
            │  ┌────────────────────┐   ┌──────────────────────────┐  │
            │  │  JWT & RBAC Auth   │   │  Real-Time Socket Engine │  │
            │  └────────────────────┘   └──────────────────────────┘  │
            │  ┌────────────────────┐   ┌──────────────────────────┐  │
            │  │ Dynamic Wait Model │   │  AI Report Summarizer    │  │
            │  └────────────────────┘   └──────────────────────────┘  │
            │  ┌────────────────────┐   ┌──────────────────────────┐  │
            │  │ Multi-Tenant Scope │   │  Audit Logging Trail     │  │
            │  └────────────────────┘   └──────────────────────────┘  │
            └─────────────┬───────────────────────────┬───────────────┘
                          │                           │
                          ▼                           ▼
            ┌───────────────────────────┐   ┌─────────────────────────┐
            │     MongoDB Database      │   │  Private Object Storage │
            │  (Date-scoped Sequences)  │   │  (Expiring Signed URLs) │
            └───────────────────────────┘   └─────────────────────────┘
```

1. **Public Marketing Website:** Multi-page SaaS showcase with interactive product tour, solutions for polyclinics and pathology labs, security guides, and live contact form submission.
2. **Receptionist Console:** Rapid patient intake, automatic date-scoped queue token sequencing, priority triage flags, appointment check-in, and duplicate record detection.
3. **Doctor Clinical Workspace:** Distraction-free two-column consultation view, atomic 1-click patient calling, autosaved clinical draft notes, ICD-10 diagnosis selector, prescription builder, and direct diagnostic test ordering.
4. **Diagnostic Laboratory Workspace:** Full specimen tracking lifecycle (`ordered` → `sample_collected` → `processing` → `awaiting_review` → `published`), structured biochemistry flags, plain-language AI patient summaries, and encrypted PDF report uploads.
5. **Patient Mobile Tracker & Health Portal:** Mobile-first token tracker with real-time wait estimation and ~15m turn approaching alerts, plus authenticated medical report history with 15-minute expiring signed download links.
6. **Waiting-Room TV Display Screen (`/display/:clinicId/:departmentId`):** Full-screen dark navy display optimized for wall monitors with Web Audio API chime synthesizer, active call highlights, and zero patient PII exposure.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node v20/v22/v26)
- **MongoDB:** Local instance on `mongodb://127.0.0.1:27017/drittech` or MongoDB Atlas URI

### 2. Install Monorepo Dependencies
```bash
npm run install:all
```

### 3. Seed Realistic Demonstration Data
```bash
npm run seed
```

### 4. Launch Development Servers (Concurrent Backend & Frontend)
```bash
npm run dev
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Public TV Waiting Room:** [http://localhost:5173/display/all/all](http://localhost:5173/display/all/all)
- **Guest Patient Tracker:** [http://localhost:5173/track/track_james_wilson_demo_token_123](http://localhost:5173/track/track_james_wilson_demo_token_123)

---

## 🔑 Demo Account Switcher

The `/login` screen includes a **1-click quick role switcher** for seamless testing:

| Role | Email Address | Password | Primary Workspace Route |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor.sarah@drittech.com` | `doctor123` | `/app/doctor` |
| **Receptionist** | `reception@drittech.com` | `reception123` | `/app/reception` |
| **Lab Technician** | `lab@drittech.com` | `lab123` | `/app/lab` |
| **Clinic Admin** | `clinicadmin@drittech.com` | `admin123` | `/app/admin` |
| **Patient Portal** | `patient@drittech.com` | `patient123` | `/patient` |
| **Super Admin** | `admin@drittech.com` | `admin123` | `/app/admin` |

---

## 🛠️ Technology Stack

- **Frontend:**
  - **Framework:** React 19, Vite 6, React Router DOM v7
  - **State & Sync:** TanStack Query, Socket.IO Client, Axios with interceptors
  - **Styling:** Modular SCSS design system (Deep Teal `#0F766E`, Mint `#DDF7EE`, Soft Slate `#F7F9FC`)
  - **Data Visualization:** Recharts, Lucide React Icons
- **Backend:**
  - **Runtime:** Node.js, Express.js
  - **Database:** MongoDB & Mongoose ODM (Indexes, schema validations, transactions)
  - **Real-Time:** Socket.IO with clinic/department/token room partitioning
  - **Authentication:** JWT HttpOnly cookie sessions with refresh token rotation
  - **Storage & Security:** Multer private storage, HMAC-SHA256 expiring download tokens, Helmet, Rate Limiting
- **Machine Learning (`ml/`):**
  - Gradient Boosted Wait-Time Regression model (`ml/wait-time/train.py`)
  - Rule-based & LLM-compatible diagnostic report summarizer (`ml/report-summarizer/`)

---

## 📁 Repository Structure

```
Drittech/
├── client/                     # Frontend Single Page Application
│   ├── public/                 # Static assets & icons
│   └── src/
│       ├── components/         # Reusable UI library (Button, Modal, Input, Badge, etc.)
│       ├── context/            # AuthContext, SocketContext
│       ├── pages/              # Marketing, Auth, Reception, Doctor, Lab, Patient, TV
│       ├── services/           # Axios apiClient, queueService, labService, etc.
│       └── styles/             # SCSS tokens, mixins, global base styles
├── server/                     # Backend REST API & WebSocket Server
│   ├── scripts/                # Database seeder (seed.js)
│   ├── src/
│   │   ├── config/             # Database connection, env, storage, sockets
│   │   ├── controllers/        # Auth, Queue, Consultation, Lab, Analytics
│   │   ├── middleware/         # Authenticate, RBAC authorize, rateLimit, upload
│   │   ├── models/             # Mongoose schemas (User, QueueEntry, LabReport, etc.)
│   │   ├── routes/             # RESTful API route definitions
│   │   └── services/           # Queue atomic engine, wait estimator, audit, lab
│   └── tests/                  # Automated integration & unit tests (api.test.mjs)
├── docs/                       # Architecture, database schema, security & API docs
├── ml/                         # Machine learning wait-time & report summarizer models
├── LICENSE                     # MIT License
└── package.json                # Monorepo root scripts & configuration
```

---

## 🔒 Security & Privacy Engineering

- **HttpOnly Cookie JWTs:** Access and refresh tokens are stored in secure HttpOnly cookies, guarding against XSS token exfiltration.
- **Strict Role-Based Access Control:** Clinical consultation notes are restricted exclusively to doctors and clinical administrators. Receptionists and laboratory staff are denied access at both the API and route tiers.
- **Multi-Tenant Boundary Enforcement:** All queries and WebSocket subscriptions are scoped by clinic tenant.
- **Data Minimization on Public Displays:** The TV display screen and mobile guest tracker never display patient PII, phone numbers, or clinical notes.
- **Expiring HMAC Signed URLs:** Lab PDF reports are stored in private storage and accessed only through signed tokens that expire after 15 minutes.
- **Immutable Audit Logging:** Every login, registration, clinical consultation draft, lab report upload, and status transition is recorded with timestamp and IP address.

---

## 🧪 Testing

Run automated tests across both backend and frontend:

```bash
# Run server test suite
npm run test --prefix server

# Run client unit tests
npm run test --prefix client
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](file:///c:/Users/miiday_repo_work/Drittech/LICENSE) file for details.
