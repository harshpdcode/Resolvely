# ⚡ Resolvely — AI-Powered Complaint Management System

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-FF4154?style=for-the-badge&logo=react-table&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**Smart customer support complaint intake with automated AI classification, priority assignment, SLA breach tracking, and real-time admin analytics.**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Database & Architecture](#-database--architecture) • [Default Credentials](#-default-test-accounts)

</div>

---

## 🌟 Overview

**Resolvely** is an enterprise-grade, full-stack customer support and complaint management platform. When a customer submits an issue, **Google Gemini AI** automatically triages the ticket in real-time—analyzing the sentiment and technical scope to assign categories (`billing`, `technical`, `service`, `product`, `delivery`, `account`, `other`) and urgency levels (`low`, `medium`, `high`, `urgent`) with reasoned explanations.

---

## ✨ Key Features

### 🤖 1. AI-Driven Smart Triage
- Automatically analyzes complaint context using **Google Gemini 2.0 Flash**.
- Assigns standardized categories and urgency levels.
- Generates transparent, human-readable explanations of why a ticket was triaged that way.
- Safe fallback: if AI is offline, ticket submission proceeds seamlessly.

### 🛡️ 2. Secure Auth & Role-Based Access Control (RBAC)
- Custom JWT-based session management (`jose` + `bcryptjs` hashing).
- In-memory rate limiter on authentication endpoints to defend against brute force.
- Google OAuth 2.0 integration.
- First registered user automatically becomes the system `admin`.
- Role-based route protection via TanStack Router hooks and server middleware.

### 📊 3. Executive Admin Analytics Dashboard
- Comprehensive metrics: Total tickets, open, in-progress, resolved, and average resolution time.
- **SLA Breach Monitoring:** Automatic alerts for unresolved high-priority tickets exceeding 48h SLA.
- **Interactive Visualizations:**
  - 14-day volume intake trends (Line Chart).
  - Priority distribution breakdown (Pie Chart).
  - Category distribution metrics (Bar Chart).
- Admin status updates with audit trail & optional resolution notes.

### 🔔 4. Notifications & Communication
- In-app notification bell with unread badges and instant read marking.
- Transactional email dispatch via **Nodemailer** for status updates and welcome confirmations.

### 💾 5. Modern Data Layer
- **Prisma ORM** schema targeting **MySQL**.
- Server-side functions with strict **Zod** schema validations.
- Offline/mock fallback support for local testing without database requirements.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/start) (Full-stack React 19 SSR Framework) |
| **Routing** | [TanStack Router](https://tanstack.com/router) (Type-safe file-based routing) |
| **State & Caching** | [TanStack Query](https://tanstack.com/query) (`@tanstack/react-query`) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com), Radix UI Primitives, Lucide Icons |
| **Database & ORM** | [Prisma 4](https://www.prisma.io/) + [MySQL](https://www.mysql.com/) |
| **Authentication** | Custom JWT (`jose`), `bcryptjs`, Google OAuth 2.0 |
| **AI Integration** | Google Gemini API (`gemini-2.0-flash`) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Email** | [Nodemailer](https://nodemailer.com/) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm** or **bun** / **pnpm**
- **MySQL Database** (Local instance or Cloud MySQL like PlanetScale / Aiven)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/resolvely.git
cd resolvely
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Setup Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Configure your environment settings:
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/resolvely"

# Auth
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"
APP_URL="http://localhost:3000"

# AI
GOOGLE_GENERATIVE_AI_API_KEY="your-google-gemini-api-key"
```

### 4. Database Setup & Seed
Push the Prisma schema to your database and seed initial test accounts:
```bash
# Push schema to MySQL
npm run db:push

# Seed admin & test users with sample complaints
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Test Accounts

When you run `npm run db:seed`, the following accounts are created:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Password123!` | Full Admin Dashboard, All Complaints, SLA Metrics, Status Modification |
| **User** | `user@example.com` | `Password123!` | Customer Portal, Submit Complaints, Personal Ticket Tracker |

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma              # MySQL Database Schema
│   └── seed.ts                    # Database seeder (Admin, User, Sample tickets)
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI component library (Radix + Tailwind)
│   │   └── notification-bell.tsx  # In-app notification component
│   ├── integrations/
│   │   ├── auth/                  # JWT sign/verify, password hashing, middleware
│   │   └── db/                    # Prisma client singleton
│   ├── lib/
│   │   ├── auth.functions.ts      # Authentication server functions
│   │   ├── complaints.functions.ts# Complaints CRUD, Gemini AI triage, Admin stats
│   │   ├── notifications.functions.ts
│   │   ├── email.server.ts        # Nodemailer email templates & delivery
│   │   ├── validation.ts          # Zod validation schemas
│   │   └── format.ts              # Formatters & badge helpers
│   └── routes/
│       ├── __root.tsx             # Root layout & providers
│       ├── index.tsx              # Landing page
│       ├── auth.tsx               # Sign in & Registration page
│       └── _authenticated/        # Protected routes
│           ├── dashboard.tsx      # Customer ticket dashboard
│           ├── new.tsx            # AI complaint submission form
│           ├── complaints.$id.tsx # Ticket details & live activity log
│           └── admin.tsx          # Admin analytics & SLA tracking
└── package.json
```

---

## 📜 Available NPM Scripts

- `npm run dev` — Start the local development server with hot reloading
- `npm run build` — Build production application
- `npm run preview` — Preview the production build locally
- `npm run db:generate` — Generate the Prisma Client types
- `npm run db:push` — Sync schema directly to MySQL database
- `npm run db:migrate` — Create and run SQL migrations
- `npm run db:seed` — Populate database with test users & complaints
- `npm run db:studio` — Open Prisma Studio web database GUI

---

## 🔒 Security Practices
- **Sanitized Inputs:** All incoming payloads are strictly validated using Zod on both client and server.
- **Password Security:** Salted and hashed using `bcryptjs` (cost factor 12).
- **Constant-Time Verification:** Guarded against timing attacks on authentication lookup.
- **Server-Side Authorization:** Route authorization is verified on every server function call.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
