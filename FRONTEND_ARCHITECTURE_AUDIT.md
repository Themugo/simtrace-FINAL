# SimTrace Enterprise Frontend Architecture Audit

**Date:** August 1, 2026  
**Phase:** 6 — Premium Enterprise Dashboard, Command Center UI & Advanced Visualization  
**Status:** Architecture Audited & Enterprise UI System Active  

---

## 1. Audit & Component Architecture Overview

SimTrace frontend is built with **React 18 + Vite**, **Tailwind CSS**, **Lucide Icons**, **Recharts**, and **Motion (motion/react)**.

The frontend connects directly to backend APIs (`/api/auth`, `/api/live`, `/api/intelligence`, `/api/ai`, `/api/devices`, `/api/cases`) and Socket.IO real-time streams.

---

## 2. Enterprise Design System Specifications

| Element | Specification | Utility / Class |
|---|---|---|
| **Primary Navy** | Deep intelligence canvas & headers | `bg-slate-950`, `bg-slate-900` |
| **Security Blue** | Primary operational accent | `bg-blue-600`, `text-blue-400` |
| **Alert Orange/Red** | High & Critical risk indicators | `bg-amber-500`, `bg-rose-600`, `text-rose-400` |
| **Operational Green**| Live system status & low risk | `bg-emerald-500`, `text-emerald-400` |
| **Typography** | Inter / Plus Jakarta Sans font stack | High-contrast enterprise hierarchy |

---

## 3. UI Navigation Matrix

- `/dashboard` — Mission-Critical Executive Command Center (Active Cases, Live Devices, Risk Matrix, System Health)
- `/operations/live` — Live Operations Room (Real-time telemetry, location streams, active socket stats)
- `/intelligence/graph` — Graph Intelligence Explorer (Interactive node & edge network map)
- `/intelligence/entity/:id` — Universal Entity Workspace (360-degree device, SIM, case & location view)
- `/ai-center` — AI Intelligence & Fraud Detection Hub (Risk scoring, anomaly logs, human review desk)
- `/cases` & `/cases/:id` — Police Investigation Workspace (Timeline, evidence locker, related graph entities)
- `/reports` — Enterprise Reporting Center (Exportable PDF/CSV audit reports)
- `/admin/users` — Governance & Access Control Desk (Role assignments, organization isolation)
