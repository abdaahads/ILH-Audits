# ILH Audits — Property Audit Management System

> A production-ready web application for digitizing property audits for **Ivy League House (ILH)** student housing across India.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)

## Features

- **🔐 Authentication** — Supabase Auth with email/password, middleware-protected routes
- **📊 Dashboard** — Real-time statistics, property leaderboard, recent audits
- **🏢 Properties** — View all ILH locations with audit scores and bed counts
- **📋 Audit Engine** — Multi-step mobile-first audit form with:
  - Dynamic question rendering from database templates
  - Score buttons (0–5) per question
  - Optional notes and photo evidence upload
  - Weighted score calculation across 5 categories
  - Review & submit with category breakdown
- **📈 Audit History** — Filterable table of all past audits with score/status badges
- **🎨 Glassmorphism UI** — Premium design with backdrop-blur effects, smooth animations

## Tech Stack

| Layer       | Technology                      |
|-------------|----------------------------------|
| Framework   | Next.js 16 (App Router, React)  |
| Language    | TypeScript                       |
| Styling     | Tailwind CSS v4 + shadcn/ui     |
| Backend     | Supabase (PostgreSQL + Auth)     |
| State       | Zustand (persisted to session)   |
| Icons       | Lucide React                     |

## Getting Started

### Prerequisites

- Node.js 18+ 
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/abdaahads/ILH-Audits.git
cd ILH-Audits
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set Up Database

Run the SQL scripts in your Supabase SQL Editor:

1. **Schema** — `supabase/schema.sql` (tables, RLS policies, triggers)
2. **Seed Data** — `supabase/seed.sql` (10 real ILH properties + audit template)

### 4. Create Storage Bucket

In Supabase Dashboard → Storage:
- Create a public bucket named `audit-images`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── auth/callback/       # OAuth callback handler
│   ├── dashboard/
│   │   ├── audits/          # Audit history page
│   │   │   └── new/         # New audit engine
│   │   ├── properties/      # Properties grid
│   │   ├── layout.tsx       # Dashboard layout + sidebar
│   │   └── page.tsx         # Command center
│   ├── login/               # Login/signup page
│   ├── globals.css           # Brand colors + glassmorphism
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Root redirect
├── components/ui/            # shadcn/ui components
├── lib/supabase/             # Client, server, middleware helpers
├── store/                    # Zustand audit store
├── types/                    # TypeScript interfaces
└── middleware.ts             # Auth middleware
```

## Database Schema

- **properties** — ILH locations (10 real properties across India)
- **profiles** — User profiles with admin/auditor roles (auto-created via trigger)
- **audit_templates** — Configurable audit templates
- **audit_categories** — Weighted scoring categories (5 default)
- **audit_questions** — Questions per category (20 default)
- **audits** — Completed/in-progress audit records
- **audit_responses** — Per-question scores, notes, and photos

All tables protected by **Row Level Security (RLS)** policies.

## Brand

- **Primary:** Navy `#003366`
- **Secondary:** Green `#339966`
- **Font:** PT Sans
- **Design:** Minimalist + Glassmorphism

## License

Private — Ivy League House © 2024
