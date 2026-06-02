# CodeVault — Project Plan

> A modern, minimal platform to **store, organize, and revisit coding problems & solutions** with built-in spaced-repetition reminders, sheets, notes, and analytics. Fully responsive across mobile, tablet, and desktop.

---

## 0. Naming

**Final name: CodeVault.** ✅

(Alternatives considered if you ever want to rebrand: Recurse, Refold, Synapse, Cortex, Loopback, Mnemo, ReCode, Revisit, Echo, Retain, Spaced, Anchor, Coil. Not needed — sticking with CodeVault.)

---

## 1. Product Overview

CodeVault is a personal coding-problem knowledge base. Developers log in, save problems they've solved (or want to solve), attach one or more solutions to each problem, organize them into **sheets** (like "Blind 75"), attach **notes**, and get reminded to revisit them on a spaced-repetition schedule (3d → 7d → 15d → 30d → repeat). The goal is long-term retention of DSA / interview problems.

### Core User Flow
1. **Sign up / Log in.**
2. **First login →** prompted to pick a *default language* (e.g. Python, Java, C++, JS). Changeable later in Settings.
3. Land on the **Problems Dashboard** — a searchable, filterable table.
4. Click **Add Problem** → fill in name, URL, topic, difficulty, tags.
5. Click any **row** → a **Problem Detail Modal** opens showing problem metadata, attached solutions, and notes.
6. Add **one or more solutions** per problem (intuition, approach, code, time/space complexity).
7. Adding a solution **schedules revisit reminders** automatically.
8. Revisit reminders surface in a **Reminders / "Due Today"** view; completing a revisit advances or restarts the cycle.
9. Organize problems into **Sheets**, track progress on the **Analytics dashboard**, and share **read-only** problems/sheets/profile publicly.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR/RSC, API routes, modern DX |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, accessible, consistent components |
| Animation | **Framer Motion** | Scroll reveals, hover lift, smooth modals |
| Icons | **lucide-react** | Clean, consistent icon set |
| Table | **TanStack Table** | Sorting, filtering, pagination out of the box |
| Auth | **Auth.js (NextAuth v5)** ✅ | Fully free, unlimited users, Prisma adapter, OAuth (Google/GitHub) + email/password. See [§13](#13-auth-decision). |
| Database | **PostgreSQL** | Relational data (problems → solutions → reminders → sheets → notes), arrays/JSON support |
| ORM | **Prisma** | Type-safe queries, migrations |
| Code editor/viewer | **Monaco Editor** | Syntax-highlighted code, language switching, copy button |
| Validation | **Zod** | Shared client/server schema validation |
| State/Data fetching | **TanStack Query** + Server Actions | Caching, optimistic updates |
| Charts/Analytics | **Recharts** + custom heatmap | Solved/unsolved, topic breakdown, streak calendar |
| Command palette | **cmdk** | Cmd+K quick add/search/navigate |
| Theme | **next-themes** | Dark / light toggle, system-aware |
| Date / time | **date-fns** + **date-fns-tz** (or **Luxon**) | IST timezone, `DD-MMM-YYYY` formatting. See [§16](#16-date-time--timezone-conventions). |
| Fonts | **next/font** (self-hosted) | Display + body + mono pairing. See [§3](#3-design-system--visual-direction). |
| Responsive | **Tailwind breakpoints** (mobile-first) | Phone, tablet, desktop. See [§11](#11-responsive-design-all-devices). |
| Reminders (v1) | DB-driven `due_date`, **computed on demand** (no cron) | In-app "Due Today" via simple query; lazy status reset |
| Push (later, optional) | **Web Push + service worker** + scheduler | PWA push notifications. See [§5 Notifications](#notifications--reminders-delivery). |
| PWA / offline | **next-pwa** (`@ducanh2912/next-pwa`) | Installable, offline cache |
| Deployment | **Vercel** + **Neon / Supabase** (managed Postgres) | Zero-config, serverless-friendly |

### Database Recommendation
**PostgreSQL** via **Neon** or **Supabase** (free, managed, serverless). Highly relational data with `text[]` for tags and `jsonb` for flexible fields. App-level authorization enforces that users only see their own data (see [§12 Security](#12-security--row-level-data-isolation)).

---

## 3. Design System & Visual Direction

The product borrows from **two reference designs** and unifies them into one cohesive, seamless system. The landing page and the in-app pages share the same brand color, typography, radii, spacing, and motion — so moving from marketing site → app feels like one product.

### References
- **Landing page →** [Spectra Landing Page](https://dribbble.com/shots/27424504-Spectra-Analytics-Dashboard) — light, airy, lots of whitespace, very large bold two-tone headlines, soft rounded white cards with gentle shadows, floating UI mockups (sticky notes, reminder cards, task cards), pill-shaped section labels, a single bold primary CTA.
- **App / dashboard →** [Spectra Analytics Dashboard](https://dribbble.com/shots/27424504-Spectra-Analytics-Dashboard) — dark charcoal canvas, left sidebar nav (logo top, items, log out bottom), top bar with title + search + theme toggle + bell + avatar, large rounded elevated cards, a violet/lavender highlight card, orange data accents, bar/line/donut charts, a data table with avatars and status pills.

> Both themes (light + dark) exist everywhere via the **theme toggle**. Landing defaults to the bright ChronoTask look; the app defaults to the dark Spectra look — but either can switch.

### Brand Color & Palette
Primary brand color is **violet/indigo** (bridges ChronoTask's blue CTA and Spectra's lavender), with **orange** as the energetic secondary accent (Spectra's charts).

**Light theme (landing-led — ChronoTask):**
| Token | Value | Use |
|---|---|---|
| `background` | `#F6F6F4` | page canvas (warm off-white) |
| `surface` | `#FFFFFF` | cards |
| `foreground` | `#16161A` | primary text (near-black) |
| `muted` | `#6B7280` | secondary text / second headline line |
| `border` | `#E8E8E4` | hairlines, card borders |
| `primary` | `#4F46E5` | CTAs, links, active states |
| `primary-fg` | `#FFFFFF` | text on primary |
| `accent` | `#F97316` | highlights, charts |

**Dark theme (app-led — Spectra):**
| Token | Value | Use |
|---|---|---|
| `background` | `#161619` | app canvas (charcoal) |
| `surface` | `#1F1F24` | cards / sidebar |
| `surface-2` | `#26262C` | nested cards, inputs |
| `foreground` | `#F4F4F5` | primary text |
| `muted` | `#9A9AA2` | secondary text |
| `border` | `#2C2C32` | hairlines |
| `primary` | `#A593F1` | active nav, highlight card, CTAs |
| `accent` | `#EE8E5A` | chart highlight bars, donut |
| `highlight-card` | `#B7A8F5` | featured "Profit"-style card |

**Semantic colors (both themes):**
- Difficulty: **Easy** = emerald, **Medium** = amber, **Hard** = rose.
- Status: **Solved** = violet/emerald pill, **Unsolved** = muted pill.

> Implement as CSS variables / Tailwind theme tokens so light/dark swap is automatic. Use shadcn's token convention (`--background`, `--primary`, etc.).

### Typography
- **Display / headings:** a clean geometric grotesk — **Plus Jakarta Sans** or **Geist** (both free, self-hosted via `next/font`). Big, bold, tight leading (mirrors ChronoTask's huge headlines). Two-tone headline treatment (solid `foreground` + `muted` second line).
- **Body / UI:** **Inter** or **Geist Sans**.
- **Code / mono:** **Geist Mono** or **JetBrains Mono** (Monaco + complexity badges).

### Shape, Elevation, Spacing
- **Radius:** generous — cards `rounded-2xl`/`rounded-3xl` (16–24px), buttons `rounded-xl` or pill (`rounded-full`), pill labels fully rounded.
- **Shadows:** soft, low-spread, diffuse on light (ChronoTask); subtle border + faint glow on dark (Spectra).
- **Spacing:** generous whitespace, roomy card padding, clear section rhythm.
- **Borders:** 1px hairline using `border` token; on dark, borders do more work than shadows.

### Motion (Framer Motion)
- Scroll-reveal fade/slide-up for landing sections.
- Hover **lift** + slight scale on cards/buttons.
- Smooth modal/drawer transitions; animated number counters on analytics.
- Keep it subtle and fast (150–300ms); respect `prefers-reduced-motion`.

### App Shell (Spectra-style)
- **Left sidebar:** logo top, nav items with icons (Dashboard, Sheets, Reminders, Analytics, Settings), active item highlighted with `surface-2` + violet text, **Log out** pinned bottom. Collapsible.
- **Top bar:** page title (left), centered/left search ("Search here…"), right cluster = theme toggle (moon/sun), notifications bell with "Due Today" count, avatar.
- **Content:** responsive grid of rounded elevated cards; one **featured violet highlight card** (e.g. streak or "Due Today") echoing Spectra's Profit card.
- **Tables:** dark rows, avatars/initials, **status pills** (Solved/Unsolved like Paid/Unpaid), row hover, "More" action.

### Component Inventory (shadcn/ui)
Button, Card, Badge/Pill, Dialog + Drawer (responsive modal), Tabs, Accordion, DropdownMenu, Select, Command (cmdk), Table, Avatar, Tooltip, Sheet, Skeleton, Sidebar, Switch (theme), Progress (sheet completion).

---

## 4. Data Model

```
User
 ├─ id (uuid, pk)
 ├─ email (unique)
 ├─ name
 ├─ username (unique — used for public profile URL)
 ├─ passwordHash (nullable if OAuth)
 ├─ defaultLanguage (text, set on first login)
 ├─ hasCompletedOnboarding (bool)
 ├─ isPublicProfile (bool, default false)
 ├─ theme (enum: LIGHT | DARK | SYSTEM, default SYSTEM)
 ├─ createdAt / updatedAt

Problem
 ├─ id (uuid, pk)
 ├─ userId (fk → User)
 ├─ name
 ├─ url            (problem link, e.g. LeetCode URL)
 ├─ topic          (e.g. "Dynamic Programming")
 ├─ difficulty     (enum: EASY | MEDIUM | HARD)
 ├─ tags           (text[]  e.g. ["array","two-pointers"])
 ├─ status         (enum: UNSOLVED | SOLVED — default UNSOLVED)
 ├─ isFavorite     (bool, default false)   # ⭐ favorite / pin
 ├─ createdAt / updatedAt

Solution
 ├─ id (uuid, pk)
 ├─ problemId (fk → Problem)
 ├─ language        (defaults to user's defaultLanguage)
 ├─ intuition       (text)
 ├─ approach        (text)
 ├─ code            (text — full solution)
 ├─ mistakesLog     (text, nullable)        # 📝 "what I got wrong last time"
 ├─ timeComplexity  (enum dropdown)
 ├─ spaceComplexity (enum dropdown)
 ├─ createdAt / updatedAt

Note                                        # notes related to a problem
 ├─ id (uuid, pk)
 ├─ problemId (fk → Problem)
 ├─ userId (fk → User)
 ├─ title (nullable)
 ├─ body (text — markdown supported)
 ├─ createdAt / updatedAt

Reminder
 ├─ id (uuid, pk)
 ├─ problemId (fk → Problem)
 ├─ userId (fk → User)
 ├─ dueDate (date)
 ├─ stage          (enum: D3 | D7 | D15 | D30)
 ├─ cycle          (int — full-cycle repeat count)
 ├─ status         (enum: PENDING | DONE | SKIPPED)
 ├─ createdAt / completedAt

Sheet                                       # collections / playlists (Blind 75, Neetcode 150)
 ├─ id (uuid, pk)
 ├─ userId (fk → User)
 ├─ name
 ├─ description (nullable)
 ├─ isPublic (bool, default false)          # 🔗 shareable read-only
 ├─ shareSlug (unique, nullable)            # public URL slug
 ├─ createdAt / updatedAt

SheetProblem (join)                         # a problem can live in many sheets
 ├─ sheetId (fk → Sheet)
 ├─ problemId (fk → Problem)
 ├─ order (int — manual ordering within sheet)
 └─ pk (sheetId, problemId)

FilterPreset                                # saved filters ("Hard DP due this week")
 ├─ id (uuid, pk)
 ├─ userId (fk → User)
 ├─ name
 ├─ query (jsonb — serialized filter state)
 ├─ createdAt

Streak / Gamification (on User or separate table)  # 🔥
 ├─ currentStreak (int)
 ├─ longestStreak (int)
 ├─ lastActiveDate (date)
 └─ Badge (id, userId, type, earnedAt)

PublicShare (optional, for per-problem shares)     # 🔗 read-only problem links
 ├─ id, userId, problemId, shareSlug (unique), createdAt
```

### Complexity Dropdown Values
Fixed enum keeps data clean and filterable:
`O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(n³)`, `O(2ⁿ)`, `O(n!)`.

---

## 5. Spaced-Repetition Reminder Logic

Intervals: **3d → 7d → 15d → 30d → (repeat)**.

```
INTERVALS = [3, 7, 15, 30]   // days
```

### When a solution is first added to a problem
- Create the first reminder: `dueDate = today + 3 days`, `stage = D3`, `cycle = 1`, `status = PENDING`.
- Only the *next* pending reminder exists at any time — the following one is generated when the current is completed.

### When a reminder is completed ("Revisit done")
- Mark current reminder `status = DONE`, set `completedAt`.
- Advance to the next interval in `[3,7,15,30]`:
  - If not at the end → create next reminder at `today + next_interval`, same `cycle`.
  - If at the end (D30 done) → **restart the cycle**: `cycle += 1`, next reminder = `today + 3 days`, `stage = D3`.

### Problem status reset
- New problems default to `UNSOLVED`. When a revisit comes due, the problem is treated as back in the practice queue; marking a revisit done sets it `SOLVED` until the next due date.
- **No background job needed.** "Is this due?" and "should this show as unsolved?" are derived **on read** by comparing `dueDate <= today` — computed lazily when the user loads the dashboard/reminders. (A scheduled job is only required later if we add *push/email*; see [§5 Notifications](#notifications--reminders-delivery).)

### Practice Mode (SM-2) — deferred to Future Enhancements
An adaptive spaced-repetition mode (Anki-style "Again / Good / Easy" self-grading that dynamically adjusts intervals) is **out of scope for v1**. v1 uses only the fixed `3/7/15/30` loop above. Full details are documented in [§17 Future Enhancements](#17-future-enhancements).

### Reminder Views
- **Due Today** badge/count in the navbar bell.
- **Reminders page** grouped by: Overdue · Today · Upcoming.
- Each reminder links straight to the Problem Detail Modal with a "Mark Revisited" button.

### Notifications & Reminders Delivery

**v1 — in-app only (no background infra). ✅ chosen**
- The bell shows a **"Due Today" count** = a simple query `count(reminders where dueDate <= today AND status = PENDING)`, run when the app loads.
- Reminders page lists Overdue/Today/Upcoming, also computed on demand.
- **No Vercel Cron, no service worker, nothing scheduled** — `dueDate` already lives in the DB, so "what's due" is derived on read. Cheapest, works on every device, zero setup.

**Later (optional) — PWA push notifications**
- PWAs *can* send real push (pop up even when the app is closed) via **service worker + Web Push API + VAPID keys**.
- Platform support: Android / Chrome / Edge / Firefox work well. **iOS only works on 16.4+ and only if the user installs the PWA to their home screen** (not in a normal Safari tab).
- **This is the only case that needs a scheduler:** to push "due today" at, say, 9am without the user opening the app, a server job must wake on a schedule and send the push. Options (all have free tiers): **Vercel Cron** (Hobby ≈ once/day), **GitHub Actions** scheduled workflow, **cron-job.org**, **Upstash QStash**, or **Supabase pg_cron**.
- Email reminders, if ever wanted, ride the same scheduler.

**Decision:** ship **in-app only** for v1 (no cron). Add PWA push as a later enhancement when desired — at which point we introduce a service worker + Web Push subscription + a daily scheduler.

---

## 6. UI / Screens

> All screens follow [§3 Design System](#3-design-system--visual-direction): landing = bright ChronoTask aesthetic, app = dark Spectra aesthetic, both with working theme toggle and full responsiveness.

### A. Landing Page (`/`) — public, marketing
See [§10 Landing Page](#10-landing-page) for full spec.

### B. Auth Pages
- `/login`, `/signup` (email+password and/or OAuth Google/GitHub). Clean centered card on the light canvas; brand mark top.

### C. Onboarding (first login only)
- Modal: "Pick your default language" → saves to `User.defaultLanguage`, sets `hasCompletedOnboarding = true`.

### D. Problems Dashboard (`/dashboard`) — Spectra shell
- **Sidebar + top bar** per [§3 App Shell](#app-shell-spectra-style).
- **Featured highlight card** (violet) up top: streak / "Due Today" count.
- **Top bar:** search, theme toggle, bell (Due Today), avatar.
- **Toolbar:** filters (difficulty, topic, tag, status, favorite), **saved filter presets** dropdown, **+ Add Problem**.
- **Table columns:** ⭐ · Tags · Topic · Difficulty · Problem Name · Status · Actions. Difficulty as colored badges; Status as pills (Solved/Unsolved).
- **Bulk actions:** multi-select rows → bulk tag, add-to-sheet, delete.
- **Row click → Problem Detail Modal.** Sorting + pagination via TanStack Table.

### E. Add / Edit Problem Modal
- Fields: Name, URL, Topic, Difficulty (select), Tags (chips), optionally assign to Sheet(s). (Drawer on mobile.)

### F. Problem Detail Modal
- **Header:** Problem name + 🔗 link icon (opens `url`) + ⭐ favorite toggle + share button.
- **Meta row:** difficulty badge, topic, tags, status, next revisit date, sheets it belongs to.
- **Tabs:** Solutions · Notes · History.
  - **Solutions:** accordion/tabs per solution — language selector, intuition, approach, code (Monaco viewer + **copy button**, language-aware highlighting), mistakes log, time & space complexity badges. **+ Add Solution.**
  - **Notes:** list of notes (markdown), add/edit/delete.
  - **History:** reminder timeline (3d/7d/15d/30d progress).
- **Revisit controls:** "Mark Revisited" button.

### G. Add Solution Form
- Language dropdown (prefilled with default language), Intuition, Approach, Code (Monaco), Mistakes log, Time/Space complexity dropdowns.

### H. Sheets (`/sheets`, `/sheets/[id]`)
- Create/edit/delete sheets (e.g. "Blind 75", "Neetcode 150").
- Add/remove problems, reorder, per-sheet **progress bar** (X/75 solved).
- Toggle **public** → generates a read-only `shareSlug`.

### I. Reminders (`/reminders`)
- Overdue / Today / Upcoming, with quick "Mark Revisited".

### J. Analytics (`/analytics`) — Spectra charts
- Solved vs unsolved, problems by topic & difficulty (bar/donut, orange accent), revisit streak, **GitHub-style heatmap calendar**, badges. Animated counters.

### K. Public/Shared (read-only, no auth)
- `/u/[username]` — public profile of solved problems (if enabled).
- `/s/[shareSlug]` — shared sheet, view-only.
- `/p/[shareSlug]` — shared single problem, view-only.

### L. Settings (`/settings`)
- Default language, profile info & username, public-profile toggle, notification prefs, theme.

### Global
- **Command palette (Cmd+K):** quick add problem, search, navigate.
- **PWA:** installable, offline cache of viewed problems.
- **Streaks & badges** surfaced in navbar/analytics.

---

## 7. API / Server Actions (sketch)

```
POST   /api/auth/*                 (Auth.js)
GET    /api/problems               list + filter + paginate
POST   /api/problems               create
GET    /api/problems/:id           detail (solutions + notes + reminders)
PATCH  /api/problems/:id           update / status / favorite
DELETE /api/problems/:id
POST   /api/problems/bulk          bulk tag / delete / add-to-sheet
POST   /api/problems/:id/solutions create solution (seeds first reminder)
PATCH  /api/solutions/:id          edit
DELETE /api/solutions/:id
GET/POST/PATCH/DELETE /api/notes   notes CRUD
GET/POST/PATCH/DELETE /api/sheets  sheets CRUD + add/remove problems
POST   /api/sheets/:id/share       toggle public, return shareSlug
GET    /api/reminders              due/upcoming/overdue
POST   /api/reminders/:id/complete advance/restart cycle
GET    /api/analytics              aggregates for dashboard
GET/POST/DELETE /api/filter-presets saved filters
PATCH  /api/user/settings          default language, prefs, theme, public profile
# Public (no auth):
GET    /api/public/u/:username
GET    /api/public/s/:slug
GET    /api/public/p/:slug
```
> Prefer **Next.js Server Actions** for mutations; route handlers for cron + public REST surface.

---

## 8. Project Structure (proposed)

```
codevault/
├─ app/
│  ├─ (marketing)/page.tsx           # landing page (ChronoTask style)
│  ├─ (auth)/login, signup
│  ├─ (app)/dashboard/page.tsx       # problems table (Spectra shell)
│  ├─ (app)/sheets, reminders, analytics, settings
│  ├─ (public)/u/[username], s/[slug], p/[slug]
│  └─ api/...
├─ components/
│  ├─ landing/ (hero, features, how-it-works, cta, footer, floating-mockups)
│  ├─ shell/ (sidebar, topbar, theme-toggle)
│  ├─ problems/ (table, add-modal, detail-modal, bulk-actions)
│  ├─ solutions/ (form, card, code-viewer)
│  ├─ notes/  sheets/  reminders/  analytics/
│  ├─ command-palette/
│  └─ ui/ (shadcn)
├─ lib/
│  ├─ db.ts (Prisma client)
│  ├─ auth.ts
│  ├─ reminders.ts (interval logic)
│  ├─ datetime.ts (IST timezone + DD-MMM-YYYY formatting helpers)
│  ├─ authz.ts (ownership checks)
│  └─ validators/ (zod schemas)
├─ styles/ (globals.css with theme tokens)
├─ prisma/schema.prisma
├─ public/ (icons, manifest for PWA)
└─ ...
```

---

## 9. Build Phases (milestones)

1. **Setup + Design tokens** — Next.js + TS + Tailwind + shadcn + Prisma + Postgres + next-themes; wire up the [§3](#3-design-system--visual-direction) color tokens, fonts, radii.
2. **Landing page** — ChronoTask-style marketing page (no backend needed).
3. **App shell** — Spectra-style sidebar + top bar + theme toggle, responsive nav.
4. **Auth + Onboarding** — Auth.js login/signup, default-language prompt, settings.
5. **Problems CRUD + Table** — Add Problem, dashboard table, filters/search, favorites, bulk actions.
6. **Problem Detail + Solutions + Notes** — multi-solution, Monaco + copy, complexity dropdowns, notes.
7. **Spaced-Repetition Reminders** — interval engine, reminders view, in-app "Due Today" (computed on read, no cron).
8. **Sheets** — collections, add/reorder problems, per-sheet progress.
9. **Analytics + Streaks** — charts, heatmap, badges.
10. **Sharing** — public profile, shared sheets & problems (read-only).
11. **PWA + Command Palette + Polish** — offline, Cmd+K, dark/light polish, deploy to Vercel.
12. **(Later, optional) Practice Mode (SM-2)** — adaptive flashcard flow, dynamic intervals. See [§17](#17-future-enhancements).
13. **(Later, optional) Push notifications** — service worker + Web Push + daily scheduler (Vercel Cron / GitHub Actions / etc.); optional email.
14. **(Later) Browser extension** — "Save to CodeVault" on LeetCode/Codeforces.

---

## 10. Landing Page

**Goal:** modern, minimal, attractive — communicate the value (never forget a solved problem) and drive sign-ups. **Visual direction = ChronoTask** (see [§3](#3-design-system--visual-direction)).

**Style:** bright off-white canvas, huge bold two-tone headline, generous whitespace, soft rounded white cards with gentle shadows, floating UI mockups, pill section labels, one strong primary CTA. Theme toggle present (can flip to dark). Smooth scroll-reveal animations.

**Sections:**
1. **Navbar** — logo (CodeVault) + nav (Features, How it works, Pricing) + Sign in / **Get started** (primary). Sticky, blurs on scroll.
2. **Hero** — big two-tone headline (e.g. *"Solve it once."* in solid + *"Remember it forever."* in muted), short subtext, primary CTA "Start free" + secondary "See how it works". **Floating mockup cards** around the hero (a problem row, a reminder card "Revisit in 3 days", a streak badge) — echoing ChronoTask's sticky notes / reminder / task-card motifs.
3. **Logos / mini stat strip** (optional) — "Spaced repetition that actually sticks."
4. **Features grid** — pill label "Features" + big headline + cards: Spaced-repetition reminders (3/7/15/30), Multiple solutions per problem, Sheets (Blind 75 etc.), Notes & mistakes log, Analytics & streaks, Syntax-highlighted code, Dark mode.
5. **How it works** — 3 steps: Add a problem → Save your solution → Get reminded to revisit (with small illustrative cards).
6. **Spaced-repetition visual** — timeline graphic (3d → 7d → 15d → 30d → loop).
7. **Testimonials** (optional placeholder, ChronoTask-style card masonry).
8. **CTA band** — "Build your second brain for code." → Get started.
9. **Footer** — links, GitHub, theme toggle.

**Tech:** static Server Components, Tailwind, shadcn/ui, next-themes, Framer Motion; no DB calls. Fast LCP, fully responsive (mobile → desktop), accessible.

---

## 11. Responsive Design (all devices)

The entire app — landing page and authenticated screens — must be fully responsive and usable on **mobile, tablet, laptop, and desktop** (matching the Spectra mobile mockups).

- **Mobile-first** Tailwind breakpoints (`sm` / `md` / `lg` / `xl`); design small first, scale up.
- **Navigation:** full sidebar on desktop → **bottom tab bar / hamburger drawer** on mobile.
- **Problems table:** on narrow screens, collapse to **stacked cards** (or horizontal scroll with a pinned name column) instead of a cramped grid.
- **Modals:** become full-screen **sheets/drawers** on mobile (shadcn `Drawer`/`Sheet`) for comfortable editing.
- **Dashboard cards:** single-column stack on mobile, multi-column grid on larger screens (like the Spectra phone layouts).
- **Monaco editor:** touch scrolling + readable font size on mobile; simpler read-only viewer on very small screens.
- **Analytics/heatmap:** charts resize fluidly; heatmap scrolls horizontally on mobile.
- **Touch targets:** minimum 44×44px; no hover-only interactions (provide tap equivalents).
- **PWA:** installable on mobile home screen, works offline for viewed problems.
- **Testing:** verify ≈375px phone, 768px tablet, 1024px laptop, 1280px+ desktop.

---

## 12. Security & Row-Level Data Isolation

- Every query is scoped by `userId` from the authenticated session (`lib/authz.ts` ownership checks on every mutation/read).
- Public read-only endpoints only expose records explicitly marked `isPublic`/`shareSlug`.
- If using Supabase, optionally enable **Postgres Row Level Security (RLS)** as defense-in-depth.
- Validate all input with Zod; never trust client-supplied `userId`.

---

## 13. Auth Decision

**Decision: Auth.js (NextAuth v5).** Both options have free tiers, but:
- **Auth.js** — completely free, **no user/MAU limits**, self-hosted, first-class **Prisma adapter**, supports email/password + OAuth (Google/GitHub). Best long-term cost ($0) and full control. Slightly more setup.
- **Clerk** — fastest to ship (prebuilt UI), free up to ~10k MAU, but adds a vendor dependency and cost past the free tier.

For a personal project that should stay free and own its data, **Auth.js** wins.

---

## 14. Resolved Decisions

- **Name:** CodeVault. ✅
- **Visual direction:** Landing = ChronoTask (light, minimal, bold type); App = Spectra (dark, violet + orange, sidebar dashboard); unified design system + theme toggle on both. ✅
- **Auth:** Auth.js (NextAuth v5). ✅
- **Tags:** start with `text[]` column; migrate to a normalized `Tag` table only if needed. ✅
- **Status semantics:** new = UNSOLVED; flips to UNSOLVED when a revisit is due; SOLVED after marking revisited. ✅
- **Sheets:** first-class feature (create sheets, add problems, share read-only). ✅
- **Sharing:** read-only public profile, sheets, and single problems via slugs. ✅
- **Notes:** dedicated table linked to a problem (markdown). ✅
- **Practice mode (SM-2):** **deferred to future** — out of scope for v1; documented in [§17](#17-future-enhancements). ✅
- **Notifications:** **in-app only for v1** — bell + "Due Today" count + Reminders page, all computed on read. **No Vercel Cron, no push, no email** in v1. PWA push + scheduler is a later optional enhancement (Phase 13). ✅
- **Responsive:** mandatory across phone/tablet/laptop/desktop. ✅

## 15. Still Open (nice to confirm later)

- **PWA push:** add later? (Needs service worker + Web Push + a daily scheduler; iOS requires installed PWA on 16.4+.) Default: deferred to Phase 13.
- **Multi-language solutions:** free-form multiple solutions (any language) — assumed yes.
- **Browser extension:** post-MVP (Phase 14).

---

## 16. Date, Time & Timezone Conventions

**All dates and times default to IST (India Standard Time, UTC+05:30).** Storage is UTC; display and day-boundary logic are IST.

### Storage (DB)
- Store all timestamps as **`timestamptz` (UTC)** in Postgres — the universal best practice. Prisma `DateTime` maps to `timestamptz`.
- Set the database session/server timezone to **`Asia/Kolkata`** so any raw SQL / DB-side defaults (`now()`, date truncation) resolve in IST.
- `Reminder.dueDate` and similar "calendar day" fields represent an **IST day** — compute "today", "due", and the `3/7/15/30` offsets against the **IST wall clock**, not the server's UTC clock. (Otherwise a reminder could appear a day early/late for an IST user.)

### Application layer
- A single helper module `lib/datetime.ts` centralizes all conversion + formatting. Nothing formats dates inline.
- Use **date-fns + date-fns-tz** (or Luxon). Convert UTC → `Asia/Kolkata` for display; convert user input → UTC before saving.
- "Today" / due-date comparisons use the **start of the IST day** (`zonedTimeToUtc(startOfDay(nowIST))`).

### Display formats
| Context | Format | Example |
|---|---|---|
| Dates (tables, badges, "next revisit") | **`DD-MMM-YYYY`** | `09-Jun-2026` |
| Date + time (created/updated, completed timestamps, logs) | **`DD-MMM-YYYY HH:mm:ss`** (24-hour, IST) | `09-Jun-2026 14:30:05` |
| Date + time without seconds (where seconds add noise) | **`DD-MMM-YYYY HH:mm`** | `09-Jun-2026 14:30` |
| Relative (optional, secondary) | "in 3 days", "2 days ago" | alongside the absolute date |

- Month is the 3-letter abbreviation (`Jan`…`Dec`), always title-case.
- Times are **24-hour** in **IST**; append `IST` label where ambiguity matters (e.g. shared/public pages viewed from other regions).
- Use these formats everywhere: dashboard table, problem detail, reminders, analytics axes/tooltips, public/shared pages.

> Note: even though display is fixed to IST for v1, storing UTC keeps the door open for per-user timezones later without a data migration.

---

## 17. Future Enhancements

Documented but **out of scope for v1**. Captured here so the data model and architecture stay compatible.

### Practice Mode (SM-2 adaptive scheduling)
SM-2 is the adaptive spaced-repetition algorithm behind Anki/SuperMemo. Unlike the fixed `3/7/15/30` loop (same for everyone), it **adapts intervals to your actual recall** — easy problems get pushed months out, forgotten ones return quickly.

- **Tracked per problem:** `easeFactor` (EF, starts 2.5, floor 1.3), `intervalDays`, `repetitions`.
- **Flow:** show a due problem with the **solution hidden**; user reveals, then self-grades **Again / Good / Easy**.
  - **Again** → `reps = 0`, interval → 1 day, `EF − 0.20` (floored 1.3).
  - **Good** → grow interval, EF ~unchanged.
  - **Easy** → grow interval more, `EF + 0.15`.
- **Interval growth (success):** 1st → 1 day, 2nd → 6 days, 3rd+ → `round(prev × EF)`.
- **New table** (when built): `ReviewLog (id, problemId, userId, grade, intervalDays, easeFactor, reviewedAt)` plus ease/interval fields on the problem. Coexists with the fixed loop (`Reminder` table drives fixed; `ReviewLog` drives SM-2).
- **Surfaces:** `/practice` page, `POST /api/practice/review`, sidebar "Practice" item, "Again/Good/Easy" semantic colors (rose/amber/emerald).

### Other future ideas
- **PWA push notifications** + email reminders (service worker + Web Push + daily scheduler).
- **Browser extension** — "Save to CodeVault" on LeetCode/Codeforces.
- **Per-user timezone** preference (storage is already UTC, so no migration needed).
- **AI assists** — auto-tagging, complexity suggestions, hint generation.
- **Import/export** — CSV/JSON, Markdown export.

---

*Next step: confirm the design direction, then start Phase 1 (Setup + design tokens) → Phase 2 (ChronoTask-style landing) → Phase 3 (Spectra app shell).*
