# Drittech Architecture Documentation

Drittech is a modern patient flow orchestration engine and diagnostic report delivery platform built on the MERN stack with WebSocket real-time synchronization.

## System Topology

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

## Key Architectural Principles

1. **Atomic Concurrency Checks:** Queue patient claiming and state transitions are executed atomically on the server to prevent race conditions.
2. **Date-Scoped Token Sequencing:** Tokens (e.g. `GEN-001`, `CARD-002`) are partitioned per clinic department and operating date.
3. **Multi-Tenant Data Isolation:** Clinic boundaries are strictly enforced across models and real-time socket room channels.
4. **Data Minimization on Public Interfaces:** The waiting-room TV display and guest mobile tracker expose only token identifiers and wait minutes, never patient names or clinical notes.
5. **Private Storage & Expiring Signed Downloads:** Medical reports are stored in private object storage, and downloads are gated by expiring HMAC tokens.
