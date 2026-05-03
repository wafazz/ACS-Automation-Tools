# ACS — Agent Closing System

> A lightweight, automation-driven platform that helps sales agents close more deals with less manual effort.

ACS is a vertical SaaS for sales agents across multiple industries — takaful, insurance, property, automotive, and product reselling. Unlike traditional CRMs, ACS is positioned as a simple, affordable, agent-first tool with low entry cost, fast onboarding, and stackable revenue streams.

**Tagline**: *A simple tool that helps agents close more deals — for less than the price of one lost lead.*

---

## Why ACS

Sales agents face the same recurring problems:

- Leads scattered across WhatsApp, notebooks, and memory
- Inconsistent or forgotten follow-ups
- No clear visibility on lead status or pipeline
- High lost-opportunity rate due to poor follow-up discipline
- Existing CRMs too expensive, too complex, or built for corporate teams

ACS solves these with a focused, no-fluff platform built around the WhatsApp-first workflow Malaysian/Indonesian agents already use.

---

## Core Features (MVP)

| Module | What it does |
|---|---|
| **Lead Pipeline** | Capture, organize, and track every lead through New → Follow-up → Interested → Closed |
| **Smart Reminders** | Auto-scheduled Day 1 / 3 / 7 follow-ups, snooze/reschedule/complete |
| **WhatsApp Quick Send** | One-click `wa.me` redirect with pre-filled, variable-substituted templates |
| **Template Library** | Pre-loaded scripts per industry, custom builder, variables: `{name}`, `{product}`, `{price}` |
| **Lightweight Analytics** | Total leads, conversion rate, closed deals, weekly snapshot, monthly goal tracking |
| **Mobile-First PWA** | Works on phone browser, "Add to Home Screen" — no app-store install |

---

## Tech Stack

### Backend
- **Framework**: Laravel 12
- **PHP**: 8.4 (PHP-FPM)
- **Database**: MySQL (XAMPP local, port `3307`)
- **Queue**: Database driver (default), Redis on production
- **Auth**: Laravel Breeze (Inertia + React stack)

### Frontend
- **Bridge**: Inertia.js (Laravel + React, SPA-like flow)
- **Library**: React 18 + TypeScript
- **Styling (public + auth)**: Bootstrap 5.3 + bootstrap-icons
- **Styling (post-login admin shell)**: AdminLTE 4
- **Build**: Vite

### UX Libraries (mandatory across all post-login pages)
| Library | Purpose |
|---|---|
| `sweetalert2` | Confirm dialogs (replaces native `alert()`/`confirm()`) |
| `react-hot-toast` | Non-blocking toast notifications |
| `framer-motion` | Smooth page transitions and micro-animations |
| `datatables.net-bs5` | Searchable / sortable / paginated tables |
| `react-select` | Searchable dropdowns |
| `flatpickr` | Modern date/time picker |
| `chart.js` + `react-chartjs-2` | Interactive analytics charts |

### Payment
- **Billplz** (Malaysia-native, FPX support)

---

## Quick Start (Local Development)

### Prerequisites
- PHP 8.4 with PHP-FPM
- Node 20.x LTS
- Composer
- XAMPP with MySQL on port `3307`

### Setup

```bash
# 1. Clone
git clone https://github.com/wafazz/ACS-Automation-Tools.git acs
cd acs

# 2. Install dependencies
composer install
npm install

# 3. Environment
cp .env.example .env
php artisan key:generate

# 4. Database (in phpMyAdmin or CLI, create `acs_db` on MySQL :3307)
# Edit .env to set:
#   DB_HOST=127.0.0.1
#   DB_PORT=3307
#   DB_DATABASE=acs_db
#   DB_USERNAME=root
#   DB_PASSWORD=
php artisan migrate

# 5. Run dev servers (in two terminals)
php artisan serve          # → http://localhost:8000
npm run dev                # Vite HMR
```

Open http://localhost:8000, register an account, and you're in.

---

## Project Structure (high-level)

```
acs/
├── app/
│   ├── Http/Controllers/      # LeadController, ReminderController, etc.
│   ├── Models/                # User, Lead, Reminder, Template, Subscription
│   └── Services/              # WhatsAppService, ReminderEngine
├── resources/js/
│   ├── Pages/
│   │   ├── Auth/              # GuestLayout (Bootstrap)
│   │   ├── Public/            # Landing, pricing (Bootstrap)
│   │   ├── Dashboard.tsx      # AdminLTELayout
│   │   ├── Leads/             # AdminLTELayout
│   │   ├── Reminders/         # AdminLTELayout
│   │   ├── Templates/         # AdminLTELayout
│   │   └── Analytics/         # AdminLTELayout
│   ├── Components/
│   │   ├── AdminLTE/          # Sidebar, Topbar
│   │   └── UX/                # ConfirmButton, LoadingButton, EmptyState, DataTable
│   ├── Layouts/
│   │   ├── GuestLayout.tsx    # Plain Bootstrap (login/landing)
│   │   └── AdminLTELayout.tsx # AdminLTE shell (post-login)
│   └── Hooks/
│       └── useConfirm.ts      # SweetAlert2 wrapper
└── routes/
    ├── web.php
    └── auth.php
```

---

## UX Standards (NON-NEGOTIABLE)

Every post-login page must feel **interactive, fast, and user-friendly** — no clunky page reloads, no `alert()` boxes, no dead UI.

### The SweetAlert Confirmation Rule

**Every action button must use SweetAlert2 confirmation before executing.** This applies to:

| Action | Style | Example title |
|---|---|---|
| Save / Create | info, blue | "Save this lead?" |
| Update / Edit | info, blue | "Update changes?" |
| Delete / Remove | warning, red | "Delete this lead? This cannot be undone." |
| Status Change | question, blue | "Move lead to 'Closed'?" |
| Send WhatsApp | info, green | "Open WhatsApp with this message?" |
| Logout | question, blue | "Logout from ACS?" |
| Payment / Upgrade | info, green | "Proceed to payment of RM49?" |

Use the project's `<ConfirmButton>` component or `useConfirm()` hook — never raw onClick handlers for actions.

```tsx
import ConfirmButton from '@/Components/UX/ConfirmButton';

<ConfirmButton
  className="btn btn-danger"
  confirm={{
    title: 'Delete this lead?',
    text: 'This cannot be undone.',
    icon: 'warning',
    tone: 'danger',
  }}
  onConfirm={() => router.delete(`/leads/${lead.id}`)}
>
  Delete
</ConfirmButton>
```

### Forbidden (will fail review)
- Native `alert()`, `confirm()`, `prompt()`
- Action buttons firing without SweetAlert confirmation
- Full page reloads for simple actions (delete, status change)
- Empty tables without empty-state guidance
- Forms without inline validation feedback
- Buttons that don't show loading state
- Desktop-only layouts that break on mobile (must work at 320 / 375 / 768 / 1024px)

---

## Build Roadmap

| Phase | Scope | Status |
|---|---|---|
| **1. Foundation** | Laravel 12 + Inertia + React + TS + Bootstrap + AdminLTE + UX libs + reusables | Done |
| **2. Auth & User Profile** | Extend users table (phone, industry, plan, trial_ends_at), Profile page on AdminLTELayout | In progress |
| **3. Lead Management** | Leads CRUD, status pipeline, public lead-capture form | Planned |
| **4. Reminder System** | Day 1 / 3 / 7 auto-reminders, today/upcoming/overdue tabs | Planned |
| **5. WhatsApp + Templates** | Variable engine, `wa.me` redirect, industry-specific templates | Planned |
| **6. Analytics** | KPIs, conversion rate, charts, goal tracking | Planned |
| **7. Subscription + Billplz** | Plan limits, payment integration, 7-day trial, Founder LTD | Planned |
| **8. Template Pack Store** | One-time purchases per industry pack (RM29 each) | Planned |
| **9. Affiliate System** | 30% recurring commission, referral tracking | Planned |
| **10. Admin Panel** | Internal admin for users, subscriptions, payouts | Planned |
| **11. Polish + Deploy** | PWA manifest, SEO, error pages, production deployment | Planned |

Full task breakdown lives in `Planning.md` (parent directory).

---

## Pricing & Revenue Model

ACS uses a **stacked revenue model** rather than relying on subscriptions alone:

### Subscriptions
| Plan | Price | Limits |
|---|---|---|
| Starter | RM19/mo | 100 leads, 3 templates |
| Pro | RM49/mo | Unlimited leads & templates |
| Team | RM149/mo | 5 seats, all Pro features |

7-day free trial on signup.

### One-Time Add-Ons
- **Industry Template Pack** — RM29 (Takaful / Property / Auto / Dropship)
- **Done-For-You Setup** — RM99 (account setup + lead import + template customization)
- **WhatsApp Script Bundle** — RM39 (50 proven closing scripts per industry)
- **1-Hour Coaching Call** — RM149

### Pre-Launch Offer
- **Founding Member Lifetime Deal** — RM149 once, lifetime access (limit 50 seats)
- **Early Bird Annual** — RM199/year (limit 100 seats)

### Affiliate Program
- 30% recurring commission for referred paying agents

---

## Target Market

- Takaful and insurance agents
- Property and real estate agents
- Automotive sales agents
- Dropshippers and product resellers
- Freelance / part-time sales agents
- Small agency teams (2–10 agents)

**Initial geographic focus**: Malaysia + Indonesia (large WhatsApp-native agent population, low CRM penetration).

---

## Targets

- **First Revenue**: within 14 days of pre-sale launch
- **90-Day Revenue**: ~RM9,000–12,000 cash + RM1,200+ MRR

---

## Quality Gates (per phase)

Before any phase is marked complete:

- All routes protected by `auth` middleware (except public)
- All queries scoped by `user_id` (data isolation)
- Form requests validated via `FormRequest` classes
- CSRF tokens on every form
- No N+1 queries (use `with()` eager loading)
- All variables initialized (PHP 8.4 strict)
- No hardcoded secrets — everything in `.env`
- Mobile responsive verified at 320 / 375 / 768 / 1024px
- All action buttons confirmed via SweetAlert2 + toast on success
- Tables searchable / sortable / paginated via `<DataTable>` wrapper

---

## License

Proprietary. All rights reserved.

Built lean. Built for agents. Built mobile-first.
