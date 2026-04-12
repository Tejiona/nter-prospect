# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

T-Prospect is a B2B AI-powered prospecting platform built with Next.js App Router. It is designed for agencies managing multiple clients, each running their own prospecting campaigns.

### Core Data Model

- **clients** — companies using the platform; each has a target industry, knowledge base, email config, and report schedule
- **prospects** — leads associated to a client; track contact status (`pending` / `contacted` / `accepted` / `refused`), first contact date, follow-up date, and email content

Both tables live in Supabase (PostgreSQL). The client is initialized in `supabase.ts` and used directly from API routes and the frontend.

### Frontend (`app/page.tsx`)

Single large client component (~730 lines) that renders the entire dashboard. Key patterns:
- All state managed via `useState` / `useEffect` with direct Supabase calls from the browser
- Multi-tab layout: one tab per client, plus a Legal page
- Modals for every CRUD operation (client form, prospect form, email editor, report config)
- Built-in i18n: two translation objects (`fr` / `en`) with ~100+ keys, selected per-client via `report_lang`

### API Routes (`app/api/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/agent/action` | POST | AI lead generation via Gemini 2.5 Pro; scrapes Google Maps (local) or NinjaPear (B2B); returns `{ subject, body, prospect }` |
| `/api/send-email` | POST | Sends emails via Resend; used for prospect outreach and report delivery |
| `/api/cron` | GET | Scheduler: sends automated follow-ups and periodic reports (daily/weekly/monthly); secured by Bearer token |

### Authentication

`middleware.ts` applies HTTP Basic Auth globally (except `/api/cron` and static assets). Credentials are set via environment variables — do not hardcode them.

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_API_KEY          # Gemini
GOOGLE_MAPS_API_KEY
NINJAPEAR_API_KEY
RESEND_API_KEY
CRON_SECRET             # Bearer token for /api/cron
```

### Key Conventions

- The `/api/cron` route uses `America/Toronto` as its reference timezone for scheduling logic
- All email signatures are formatted as: `L'équipe {clientName} via NTER Solutions`
- The AI prompt in `/api/agent/action` is language-aware and supports both French and English output
- Tailwind 4 is used via PostCSS plugin (`@tailwindcss/postcss`), not the classic `tailwind.config.js`
- Path alias `@/*` maps to the project root
