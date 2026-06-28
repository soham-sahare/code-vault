# CodeVault — Master Architecture, Design & Engineering Reference

> **Version:** 2.0 · **Stack:** Next.js 16.2.7 / Supabase (PostgreSQL 16) / Upstash Redis / Monaco Editor + Shiki  
> **Deployment:** Vercel (Edge + Serverless) · **Audience:** Engineering team, contributors, reviewers  
> **Goal:** Production-grade DSA problem tracker with spaced repetition, designed for 10k+ users and 100k+ problems at zero perceived latency  
> **Timezone:** All displayed timestamps strictly in **IST (UTC+5:30)** formatted as `dd-MON-yyyy HH:mm IST`

---

## Table of Contents

1. [Goals & Scope](#1-goals--scope)
2. [Tech Stack & Dependency Matrix](#2-tech-stack--dependency-matrix)
3. [Repository Structure (Next.js 16 App Router)](#3-repository-structure)
4. [Database Schema — ER Diagram](#4-database-schema--er-diagram)
5. [Data Models — Field-Level Specification](#5-data-models--field-level-specification)
6. [API Endpoint Catalog](#6-api-endpoint-catalog)
7. [UI/UX Layout Specification](#7-uiux-layout-specification)
8. [Full UML Suite](#8-full-uml-suite)
   - [8.1 System Architecture (Component Diagram)](#81-system-architecture)
   - [8.2 Frontend Component Tree](#82-frontend-component-tree)
   - [8.3 Backend Service Class Diagram](#83-backend-service-class-diagram)
   - [8.4 Sequence: Auth + Onboarding](#84-sequence-auth--onboarding)
   - [8.5 Sequence: Add Problem → Solution → SRS Init](#85-sequence-add-problem--solution--srs-init)
   - [8.6 Sequence: SRS Notification Polling & Review](#86-sequence-srs-notification-polling--review)
   - [8.7 Sequence: Public Sheet Access (Cross-user)](#87-sequence-public-sheet-access)
   - [8.8 Problem Lifecycle State Machine](#88-problem-lifecycle-state-machine)
   - [8.9 SRS Engine Activity Diagram](#89-srs-engine-activity-diagram)
   - [8.10 Use Case Overview](#810-use-case-overview)
9. [Spaced Repetition Engine — Deep Dive](#9-spaced-repetition-engine--deep-dive)
10. [Onboarding — Default Language Selection](#10-onboarding--default-language-selection)
11. [Syntax Highlighting — Monaco + Shiki](#11-syntax-highlighting--monaco--shiki)
12. [Performance & Scalability Blueprint](#12-performance--scalability-blueprint)
    - [12.1 PostgreSQL Indexing Strategy (DDL)](#121-postgresql-indexing-strategy)
    - [12.2 Table Partitioning](#122-table-partitioning)
    - [12.3 Redis Data Structure Map](#123-redis-data-structure-map)
    - [12.4 Frontend Performance](#124-frontend-performance)
    - [12.5 Connection Pooling & Edge Deployment](#125-connection-pooling--edge-deployment)
13. [Security Checklist](#13-security-checklist)
14. [Additional Features Roadmap (20 Items)](#14-additional-features-roadmap)
15. [Git Commit Conventions](#15-git-commit-conventions)
16. [Notes Feature — Problem & Solution Level](#16-notes-feature)
17. [Timestamp & Timezone Convention](#17-timestamp--timezone-convention)
18. [Deployment — Vercel + Supabase + Upstash](#18-deployment--vercel--supabase--upstash)

---

## 1. Goals & Scope

| Goal | Mechanism | Target Metric |
|---|---|---|
| **Track** problems from any OJ | Manual entry + URL field | < 500ms modal open |
| **Solve** with multi-language solutions | Monaco Editor (40+ langs) | < 200ms keystroke lag |
| **Remember** via SRS | Redis-queued intervals (3d/7d/15d/30d) | < 50ms queue poll |
| **Share** knowledge publicly | Per-problem + Sheet public links | CDN-cached read paths |
| **Analyse** growth over time | Heatmap + distribution charts | Materialized view refresh < 1s |
| **Scale** to 10k+ users | Indexed PG + Redis + cursor pagination | p99 API < 200ms at 10k users |

---

## 2. Tech Stack & Dependency Matrix

| Layer | Technology | Package / Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js 16.2.7 (App Router) | `next@16.2.7` | Full-stack SSR + RSC + API Routes |
| **UI Runtime** | React 19 | `react@19` | Component model, Suspense |
| **Styling** | Tailwind CSS v4 | `tailwindcss@4` | Utility-first, zero-runtime CSS |
| **UI Primitives** | shadcn/ui + Radix | `@radix-ui/*` | Accessible headless components |
| **ORM** | Drizzle ORM | `drizzle-orm` | Type-safe SQL, zero-overhead |
| **Database** | **Supabase** (PostgreSQL 16) | `@supabase/supabase-js@2` | Managed Postgres; row-level security; connection pooler built-in |
| **Cache / Queue** | **Upstash Redis** (Serverless) | `@upstash/redis` | HTTP-based serverless Redis — zero cold-start connections; SRS queues, session cache, rate limits |
| **Auth** | iron-session | `iron-session@8` | Stateless encrypted cookies |
| **Validation** | Zod v3 | `zod@3` | Schema validation at API boundaries |
| **Client State** | Zustand v5 | `zustand@5` | Lightweight global UI state |
| **Data Fetching** | TanStack Query v5 | `@tanstack/react-query@5` | SWR + cache invalidation |
| **Code Editor** | Monaco Editor | `@monaco-editor/react@4` | VS Code–grade editing with full IntelliSense |
| **Syntax Display** | **Shiki v1** | `shiki@1` | Zero-runtime, Textmate-grammar highlighting for **read-only** code views (solution cards, public pages) — both light & dark themes via built-in theme bundles |
| **Charts** | Recharts v3 | `recharts@3` | Analytics SVG charts |
| **Heatmap** | react-activity-calendar | `react-activity-calendar@2` | GitHub-style contribution heatmap |
| **Virtualization** | TanStack Virtual v3 | `@tanstack/react-virtual@3` | Render 10k+ rows without lag |
| **Animations** | Framer Motion v12 | `framer-motion@12` | Modal/sidebar/page transitions |
| **Icons** | Lucide React | `lucide-react` | Consistent icon system |
| **Date Handling** | date-fns v3 + date-fns-tz | `date-fns@3` `date-fns-tz` | Interval arithmetic for SRS; IST timezone formatting |
| **Testing (Unit)** | Vitest | `vitest` | Fast ESM-native unit tests |
| **Testing (E2E)** | Playwright | `@playwright/test` | Cross-browser E2E |
| **Linting** | Biome | `@biomejs/biome` | Single tool: lint + format |
| **Hosting** | **Vercel** | — | Serverless + Edge deployment; ISR CDN for public routes |

> **Note on Next.js version:** `16.2.7` is specified as the target. If this pre-dates an official release at time of build, pin to the latest stable `15.x` release and upgrade once `16.x` is GA. All architecture here is App Router–compatible.  
> **Infrastructure trio:** Vercel (compute) + Supabase (Postgres) + Upstash (Redis) are all serverless-native — no persistent TCP connections required, ideal for Vercel's ephemeral function model.

---

## 3. Repository Structure

```
codevault/
├── app/                                    # Next.js App Router root
│   ├── (auth)/                             # Unauthenticated route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/                        # Authenticated route group
│   │   ├── layout.tsx                      # Sidebar + TopBar shell
│   │   ├── problems/
│   │   │   └── page.tsx
│   │   ├── sheets/
│   │   │   └── page.tsx
│   │   └── analytics/
│   │       └── page.tsx
│   ├── (public)/                           # Public read-only views
│   │   ├── u/[username]/
│   │   │   └── page.tsx                    # Public profile
│   │   └── s/[shareToken]/
│   │       └── page.tsx                    # Shared sheet
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── problems/
│   │   │   ├── route.ts                    # GET (list+search), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET, PATCH, DELETE
│   │   │       └── solutions/
│   │   │           ├── route.ts            # GET (list), POST (create)
│   │   │           └── [solutionId]/
│   │   │               └── route.ts        # PATCH, DELETE
│   │   ├── sheets/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── problems/route.ts       # Add/remove problems from sheet
│   │   ├── srs/
│   │   │   ├── queue/route.ts              # GET due items
│   │   │   ├── [scheduleId]/complete/route.ts
│   │   │   └── [scheduleId]/revisit/route.ts  # POST start/pause/end revisit after 30d
│   │   ├── notifications/
│   │   │   ├── route.ts                    # GET unread list
│   │   │   └── [id]/read/route.ts
│   │   ├── problems/
│   │   │   ├── route.ts                    # GET (list+search), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET, PATCH, DELETE
│   │   │       ├── notes/
│   │   │       │   └── route.ts            # GET, POST problem-level notes
│   │   │       └── solutions/
│   │   │           ├── route.ts            # GET (list), POST (create)
│   │   │           └── [solutionId]/
│   │   │               ├── route.ts        # PATCH, DELETE
│   │   │               └── notes/
│   │   │                   └── route.ts    # GET, POST solution-level notes
│   ├── layout.tsx                          # Root HTML shell + ThemeProvider
│   └── page.tsx                            # Landing page
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                     # Nav + collapse logic
│   │   ├── TopBar.tsx                      # Bell + ThemeToggle + Avatar
│   │   └── ThemeToggle.tsx
│   ├── problems/
│   │   ├── ProblemsTable.tsx               # Virtualized table component
│   │   ├── ProblemCard.tsx                 # Mobile stacked card variant
│   │   ├── AddProblemModal.tsx
│   │   ├── ProblemDetailModal.tsx          # SRS timeline + notes panel
│   │   ├── SolutionModal.tsx
│   │   ├── SRSTimeline.tsx                 # Visual revisit timeline strip
│   │   ├── DifficultyBadge.tsx
│   │   └── TagPill.tsx
│   ├── notes/
│   │   ├── NotesPanel.tsx                  # Collapsible notes panel (problem or solution level)
│   │   ├── NoteCard.tsx                    # Renders a single note with type badge
│   │   └── AddNoteModal.tsx                # Create / edit note with type selector
│   ├── sheets/
│   │   ├── SheetsGrid.tsx
│   │   ├── SheetCard.tsx
│   │   └── SheetDetailModal.tsx
│   ├── analytics/
│   │   ├── ActivityHeatmap.tsx
│   │   ├── TopicDonutChart.tsx
│   │   ├── DifficultyBarChart.tsx
│   │   ├── ComplexityBarChart.tsx
│   │   └── StatsRow.tsx
│   ├── editor/
│   │   ├── CodeEditor.tsx                  # Monaco wrapper (lazy loaded)
│   │   ├── LanguageSelector.tsx
│   │   └── ComplexityCombobox.tsx
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   └── NotificationDropdown.tsx
│   ├── onboarding/
│   │   └── LanguageOnboardingModal.tsx
│   └── ui/                                 # shadcn/ui generated components
│
├── lib/
│   ├── db/
│   │   ├── schema.ts                       # Drizzle table definitions (incl. notes)
│   │   ├── index.ts                        # Supabase + Drizzle client singleton
│   │   ├── migrations/                     # Drizzle migration files
│   │   └── queries/
│   │       ├── problems.ts
│   │       ├── solutions.ts
│   │       ├── notes.ts                    # Problem & solution note queries
│   │       ├── srs.ts
│   │       ├── sheets.ts
│   │       ├── analytics.ts
│   │       └── users.ts
│   ├── redis/
│   │   ├── client.ts                       # Upstash Redis HTTP client singleton
│   │   └── srs-queue.ts                    # ZADD/ZRANGEBYSCORE wrappers
│   ├── auth/
│   │   ├── session.ts                      # iron-session config
│   │   └── middleware.ts
│   ├── srs/
│   │   └── scheduler.ts                    # SRS interval logic + revisit cycle
│   ├── utils/
│   │   ├── timestamps.ts                   # formatIST() — dd-MON-yyyy HH:mm IST
│   │   ├── tags.ts                         # Lowercase normalization
│   │   └── pagination.ts                   # Cursor encode/decode
│
├── hooks/
│   ├── useProblems.ts
│   ├── useSolutions.ts
│   ├── useSRS.ts
│   ├── useAnalytics.ts
│   ├── useNotifications.ts
│   └── useTheme.ts
│
├── store/
│   ├── ui.store.ts                         # Modal open state, sidebar
│   └── editor.store.ts                     # Editor preferences
│
├── types/
│   └── index.ts                            # Shared TypeScript interfaces
│
├── middleware.ts                            # Auth guard + rate limiting
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── biome.json
```

---

## 4. Database Schema — ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar username
        varchar email
        text password_hash
        varchar default_language
        varchar theme
        boolean onboarding_complete
        timestamptz created_at
        timestamptz updated_at
    }

    PROBLEMS {
        uuid id PK
        uuid user_id FK
        varchar name
        text url
        varchar difficulty
        varchar status
        boolean is_public
        boolean is_favorite
        timestamptz solved_at
        timestamptz created_at
        timestamptz updated_at
    }

    TAGS {
        uuid id PK
        uuid user_id FK
        varchar name
        timestamptz created_at
    }

    PROBLEM_TAGS {
        uuid problem_id FK
        uuid tag_id FK
    }

    SOLUTIONS {
        uuid id PK
        uuid problem_id FK
        uuid user_id FK
        varchar name
        varchar language
        varchar time_complexity
        varchar space_complexity
        text intuition
        text code
        timestamptz created_at
        timestamptz updated_at
    }

    NOTES {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        uuid solution_id FK
        varchar type
        text content
        boolean is_public
        timestamptz created_at
        timestamptz updated_at
    }

    SHEETS {
        uuid id PK
        uuid user_id FK
        varchar name
        text description
        boolean is_public
        varchar share_token
        timestamptz created_at
        timestamptz updated_at
    }

    SHEET_PROBLEMS {
        uuid sheet_id FK
        uuid problem_id FK
        int position
        timestamptz added_at
    }

    SRS_SCHEDULE {
        uuid id PK
        uuid problem_id FK
        uuid user_id FK
        int interval_days
        timestamptz due_date
        varchar status
        varchar revisit_status
        boolean loop_enabled
        timestamptz completed_at
        timestamptz revisit_started_at
        timestamptz created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        varchar type
        text message
        uuid related_id
        boolean is_read
        timestamptz created_at
    }

    ANALYTICS_CACHE {
        uuid id PK
        uuid user_id FK
        date snapshot_date
        int problems_solved
        int current_streak
        int longest_streak
        jsonb topic_distribution
        jsonb difficulty_distribution
        jsonb complexity_distribution
        timestamptz cached_at
    }

    USERS ||--o{ PROBLEMS : "owns"
    USERS ||--o{ TAGS : "creates"
    USERS ||--o{ SHEETS : "creates"
    USERS ||--o{ SRS_SCHEDULE : "has"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ANALYTICS_CACHE : "tracks"
    USERS ||--o{ NOTES : "writes"
    PROBLEMS ||--o{ PROBLEM_TAGS : "tagged_with"
    TAGS ||--o{ PROBLEM_TAGS : "applied_to"
    PROBLEMS ||--o{ SOLUTIONS : "has"
    PROBLEMS ||--o{ SRS_SCHEDULE : "scheduled_in"
    PROBLEMS ||--o{ SHEET_PROBLEMS : "part_of"
    PROBLEMS ||--o{ NOTES : "has"
    SOLUTIONS ||--o{ NOTES : "has"
    SHEETS ||--o{ SHEET_PROBLEMS : "contains"
    PROBLEMS ||--o{ NOTIFICATIONS : "triggers"
```

---

## 5. Data Models — Field-Level Specification

### 5.1 `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Stable identifier |
| `username` | `varchar(32)` | NOT NULL, UNIQUE | Alphanumeric + underscore only; min 3 chars |
| `email` | `varchar(255)` | UNIQUE, nullable | Optional at signup |
| `password_hash` | `text` | NOT NULL | bcrypt / argon2id, never stored plain |
| `default_language` | `varchar(32)` | NOT NULL, default `'python'` | Set at onboarding; drives Monaco default |
| `theme` | `varchar(8)` | NOT NULL, default `'system'` | `light` \| `dark` \| `system` |
| `onboarding_complete` | `boolean` | NOT NULL, default `false` | Flipped after language selection |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` | — |
| `updated_at` | `timestamptz` | NOT NULL, default `NOW()` | Trigger auto-updates on row change |

### 5.2 `problems`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `user_id` | `uuid` | FK → users.id, ON DELETE CASCADE | Owner |
| `name` | `varchar(256)` | NOT NULL | Trimmed on write |
| `url` | `text` | Nullable | External OJ link |
| `difficulty` | `varchar(8)` | NOT NULL | `easy` \| `medium` \| `hard` |
| `status` | `varchar(10)` | NOT NULL, default `'unsolved'` | `unsolved` \| `solved` — auto-set on first solution |
| `is_public` | `boolean` | NOT NULL, default `false` | Required `true` for sheet sharing |
| `is_favorite` | `boolean` | NOT NULL, default `false` | Star toggle |
| `solved_at` | `timestamptz` | Nullable | Populated when first solution added |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` | — |
| `updated_at` | `timestamptz` | NOT NULL | — |

### 5.3 `tags`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `user_id` | `uuid` | FK → users.id, ON DELETE CASCADE | Tags are user-scoped |
| `name` | `varchar(64)` | NOT NULL | **Always lowercase**, trimmed on write |

> **Uniqueness:** `UNIQUE(user_id, name)` prevents duplicate tags per user.

### 5.4 `problem_tags` (junction)

| Column | Type | Constraints |
|---|---|---|
| `problem_id` | `uuid` | FK → problems.id, ON DELETE CASCADE |
| `tag_id` | `uuid` | FK → tags.id, ON DELETE CASCADE |

> **PK:** Composite `(problem_id, tag_id)`

### 5.5 `solutions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `problem_id` | `uuid` | FK → problems.id, ON DELETE CASCADE | — |
| `user_id` | `uuid` | FK → users.id | Denormalized for direct queries |
| `name` | `varchar(128)` | NOT NULL | e.g. "Two-pointer optimized" |
| `language` | `varchar(32)` | NOT NULL | e.g. `python`, `typescript`, `java` |
| `time_complexity` | `varchar(32)` | NOT NULL | `O(n)`, `O(n log n)`, custom etc. |
| `space_complexity` | `varchar(32)` | NOT NULL | Same range |
| `intuition` | `text` | Nullable | Markdown supported |
| `code` | `text` | NOT NULL | Raw source code |
| `created_at` | `timestamptz` | NOT NULL | — |
| `updated_at` | `timestamptz` | NOT NULL | — |

### 5.6 `sheets`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `user_id` | `uuid` | FK → users.id, ON DELETE CASCADE | — |
| `name` | `varchar(128)` | NOT NULL | — |
| `description` | `text` | Nullable | — |
| `is_public` | `boolean` | NOT NULL, default `false` | Share only if ALL problems in sheet are also public |
| `share_token` | `varchar(32)` | UNIQUE, nullable | Random token, set when first made public |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |

### 5.7 `srs_schedule`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `problem_id` | `uuid` | FK → problems.id, ON DELETE CASCADE | — |
| `user_id` | `uuid` | FK → users.id | Denormalized for direct queue fetch |
| `interval_days` | `smallint` | NOT NULL | `3`, `7`, `15`, or `30`; `0` for revisit cycle rows |
| `due_date` | `timestamptz` | NOT NULL | `solved_at + interval_days` |
| `status` | `varchar(12)` | NOT NULL, default `'pending'` | `pending` \| `completed` \| `skipped` |
| `loop_enabled` | `boolean` | NOT NULL, default `false` | Legacy: if true, auto-restart on 30d completion |
| `revisit_status` | `varchar(12)` | Nullable | `active` \| `paused` \| `ended` — only set for post-30d revisit rows |
| `revisit_started_at` | `timestamptz` | Nullable | When the revisit cycle was manually initiated |
| `completed_at` | `timestamptz` | Nullable | — |
| `created_at` | `timestamptz` | NOT NULL | — |

> **Revisit cycle:** After the 30d interval is completed, a new set of `srs_schedule` rows is inserted **only on explicit user request** (not automatic). These rows carry `revisit_status = 'active'`. The user can `PATCH` to `paused` (freeze) or `ended` (archive) at any time.

### 5.8 `notifications`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `user_id` | `uuid` | FK → users.id, ON DELETE CASCADE | — |
| `type` | `varchar(24)` | NOT NULL | `srs_due` \| `streak_milestone` \| `loop_complete` |
| `message` | `text` | NOT NULL | — |
| `related_id` | `uuid` | Nullable | FK to problem or sheet (polymorphic, not enforced) |
| `is_read` | `boolean` | NOT NULL, default `false` | — |
| `created_at` | `timestamptz` | NOT NULL | — |

### 5.9 `analytics_cache`

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | FK → users.id |
| `snapshot_date` | `date` | One row per user per day |
| `problems_solved` | `int` | Cumulative count |
| `current_streak` | `int` | Days active in a row |
| `longest_streak` | `int` | All-time best |
| `topic_distribution` | `jsonb` | `{"arrays": 12, "dp": 8, ...}` |
| `difficulty_distribution` | `jsonb` | `{"easy": 10, "medium": 22, "hard": 5}` |
| `complexity_distribution` | `jsonb` | `{"time": {"O(n)": 18, ...}, "space": {...}}` |
| `cached_at` | `timestamptz` | Refresh trigger on problem solve/update |

> **PK:** `(user_id, snapshot_date)` — one snapshot per user per day.

### 5.10 `notes`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `user_id` | `uuid` | FK → users.id, ON DELETE CASCADE | Owner |
| `problem_id` | `uuid` | FK → problems.id, ON DELETE CASCADE, **nullable** | Set for problem-level notes |
| `solution_id` | `uuid` | FK → solutions.id, ON DELETE CASCADE, **nullable** | Set for solution-level notes (can be set alongside `problem_id`) |
| `type` | `varchar(8)` | NOT NULL | `note` \| `warning` \| `success` \| `error` — drives badge color/icon in UI |
| `content` | `text` | NOT NULL | Markdown supported (sanitized via DOMPurify on render) |
| `is_public` | `boolean` | NOT NULL, default `false` | `true` only when parent problem `is_public = true`; auto-synced on problem visibility change |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` | — |
| `updated_at` | `timestamptz` | NOT NULL | — |

> **Constraint:** Exactly one of `problem_id` or `solution_id` must be non-null (enforced via `CHECK (problem_id IS NOT NULL OR solution_id IS NOT NULL)`). A note can be attached to a solution **and** carry the parent `problem_id` for fast cascades.  
> **Sharing:** Notes are included in public sheet payloads and public problem views when `is_public = true`. A note is never independently public — it inherits visibility from the parent problem.

---

## 6. API Endpoint Catalog

All authenticated endpoints require a valid iron-session cookie. Responses follow `{ data, error, meta }` envelope.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | No | Create account. Returns session cookie. |
| `POST` | `/api/auth/login` | No | Validates credentials. Sets cookie. |
| `POST` | `/api/auth/logout` | Yes | Destroys session. |
| `PATCH` | `/api/users/me` | Yes | Update `default_language`, theme, `onboarding_complete`. |

### Problems

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/problems` | Yes | List problems. Supports: `?q=`, `?difficulty=`, `?tag=`, `?status=`, `?cursor=`, `?limit=` |
| `POST` | `/api/problems` | Yes | Create problem. Auto-creates tags if new. |
| `GET` | `/api/problems/:id` | Yes | Single problem with solutions + tags. |
| `PATCH` | `/api/problems/:id` | Yes | Update name, url, difficulty, is_public, is_favorite. |
| `DELETE` | `/api/problems/:id` | Yes | Cascade deletes solutions, tags, SRS schedules. |
| `GET` | `/api/problems/:id/solutions` | Yes | All solutions for a problem. |
| `POST` | `/api/problems/:id/solutions` | Yes | Add solution → triggers SRS init if first solution. |
| `PATCH` | `/api/problems/:id/solutions/:sId` | Yes | Update solution fields. |
| `DELETE` | `/api/problems/:id/solutions/:sId` | Yes | Remove solution. |

### Notes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/problems/:id/notes` | Yes | List all notes attached to a problem (excludes solution-scoped notes). |
| `POST` | `/api/problems/:id/notes` | Yes | Create a problem-level note. Body: `{ type, content }`. |
| `GET` | `/api/problems/:id/solutions/:sId/notes` | Yes | List all notes attached to a specific solution. |
| `POST` | `/api/problems/:id/solutions/:sId/notes` | Yes | Create a solution-level note. Body: `{ type, content }`. |
| `PATCH` | `/api/notes/:noteId` | Yes | Edit note content or type. |
| `DELETE` | `/api/notes/:noteId` | Yes | Delete a note (ownership verified). |

### Tags

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tags` | Yes | Get all user tags. Supports `?prefix=` for autocomplete. |
| `POST` | `/api/tags` | Yes | Create tag (lowercase-forced). |

### Sheets

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sheets` | Yes | List user's sheets. |
| `POST` | `/api/sheets` | Yes | Create sheet. |
| `GET` | `/api/sheets/:id` | Yes | Sheet detail with problem list. |
| `PATCH` | `/api/sheets/:id` | Yes | Update name, description, is_public (validates all problems are public). |
| `DELETE` | `/api/sheets/:id` | Yes | Delete sheet. |
| `POST` | `/api/sheets/:id/problems` | Yes | Add problem to sheet. |
| `DELETE` | `/api/sheets/:id/problems/:pId` | Yes | Remove problem from sheet. |
| `GET` | `/api/s/:shareToken` | No | Public sheet read (problems + solutions). |

### SRS

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/srs/queue` | Yes | Fetch problems due for review today. Checks Redis first. |
| `POST` | `/api/srs/:scheduleId/complete` | Yes | Mark interval reviewed. Queues next interval or surfaces revisit prompt when 30d is done. |
| `POST` | `/api/srs/:scheduleId/revisit` | Yes | Start a revisit cycle after 30d completion. Body: `{ action: 'start' \| 'pause' \| 'end' }`. Only callable when `interval_days=30` and `status='completed'`. |

### Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Yes | All notifications. `?unread=true` for count badge. |
| `PATCH` | `/api/notifications/:id/read` | Yes | Mark single notification read. |
| `PATCH` | `/api/notifications/read-all` | Yes | Mark all as read. |

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics` | Yes | Full analytics payload (heatmap, distributions, streaks). Returns cached snapshot, regenerates if stale (> 1 hour). |

---

## 7. UI/UX Layout Specification

### 7.1 Landing Page

**Route:** `/`  
**Auth:** None required

**Layout (single-page scroll):**

```
┌─────────────────────────────────────────────┐
│  NAVBAR (sticky, 64px)                       │
│  [⚡ CodeVault logo]          [☀/🌙 Toggle]  │
├─────────────────────────────────────────────┤
│  HERO (100vh, gradient mesh background)      │
│                                             │
│         ⚡ CodeVault                         │
│  Track · Solve · Remember · Master          │
│                                             │
│   [  Sign Up  ]   [  How it works?  ]       │
│                                             │
│    (subtle animated grid / noise texture)   │
├─────────────────────────────────────────────┤
│  ABOUT (2-col: text left, mockup right)      │
├─────────────────────────────────────────────┤
│  FEATURES (3-col card grid, 6 cards)         │
│  [Problem Tracking] [Multi-Solution] [SRS]  │
│  [Analytics]  [Public Sharing]  [Sheets]    │
├─────────────────────────────────────────────┤
│  HOW IT WORKS (numbered steps, icon+text)   │
│  1 → Add a problem  2 → Write solution      │
│  3 → SRS auto-starts  4 → Review when due   │
├─────────────────────────────────────────────┤
│  MEMORY CURVE (animated SRS timeline viz)   │
│  Day 0 ──3d──7d──15d──30d → Mastered ✓      │
├─────────────────────────────────────────────┤
│  FOOTER (logo, nav links, dark/light)        │
└─────────────────────────────────────────────┘
```

- Background: Animated gradient mesh (CSS `@keyframes` or Three.js canvas)  
- Hero typography: Display font (e.g. `Sora` or `Cabinet Grotesk`), 72px desktop / 40px mobile  
- Buttons: "Sign Up" = filled accent, "How it works" = ghost outline  
- Feature cards: Glass-morphism cards with icon + title + 2-line description  
- SRS timeline viz: SVG curve showing forgetting curve with review points marked  

---

### 7.2 Auth Pages

**Routes:** `/login`, `/signup`  
**Layout:** Centered card on split background (left: brand graphic, right: form)

```
┌──────────────────────────────────────────────────┐
│  [← Back to CodeVault]           [☀/🌙 Toggle]   │
│                                                  │
│  ┌────────────────────┐  ┌────────────────────┐  │
│  │                    │  │  Sign Up            │  │
│  │   Brand graphic /  │  │                     │  │
│  │   tagline + SRS    │  │  Username*          │  │
│  │   timeline art     │  │  [_______________]  │  │
│  │                    │  │                     │  │
│  │                    │  │  Email (optional)   │  │
│  │                    │  │  [_______________]  │  │
│  │                    │  │                     │  │
│  │                    │  │  Password*          │  │
│  │                    │  │  [_______________]  │  │
│  │                    │  │                     │  │
│  │                    │  │  [  Create Account] │  │
│  │                    │  │                     │  │
│  │                    │  │  Already have one?  │  │
│  │                    │  │  Log in →           │  │
│  └────────────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────┘
```

- Inline Zod validation with error messages below each field  
- Password strength indicator (entropy bar)  
- On successful signup: redirect to `/problems` → `onboarding_complete=false` triggers language modal  

---

### 7.3 Dashboard Shell (Authenticated Layout)

```
┌──────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px, collapsible → icon rail on tablet)              │
│  ┌────────────────┐  ┌───────────────────────────────────────┐   │
│  │ ⚡ CodeVault   │  │ TOP BAR (60px)                         │   │
│  │                │  │  [Page Title]    🔔(n)  [☀/🌙] [👤]   │   │
│  │ 📋 Problems    │  ├───────────────────────────────────────┤   │
│  │ 📁 Sheets      │  │                                        │   │
│  │ 📊 Analytics   │  │          MAIN CONTENT AREA             │   │
│  │                │  │          (scrollable, flex-1)          │   │
│  │   ─────────    │  │                                        │   │
│  │ ⚙  Settings   │  │                                        │   │
│  │ ↪  Logout      │  │                                        │   │
│  └────────────────┘  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile behavior:**  
- Sidebar collapses to a hamburger icon in the TopBar  
- Drawer slide-in on hamburger tap (overlay)  
- Bottom navigation bar alternative for mobile (Problems / Sheets / Analytics)  

---

### 7.4 Problems Tab

```
┌────────────────────────────────────────────────────────┐
│  [🔍 Search problems...] [⊞ Filters ▼]  [+ Add Problem]│
├────────────────────────────────────────────────────────┤
│  DIFFICULTY │ PROBLEM NAME           │ TAGS    │ ACTIONS│
│  ──────────────────────────────────────────────────────│
│  🟢 Easy    │ Two Sum                │ arrays  │ 👁 ⭐ ✏ 🗑│
│  🟡 Medium  │ Longest Substring...   │ sliding │ 👁 ⭐ ✏ 🗑│
│  🔴 Hard    │ Trapping Rain Water    │ arrays  │ 👁 ⭐ ✏ 🗑│
│  ...                                                   │
│  (virtualized — renders 20 visible rows at a time)     │
├────────────────────────────────────────────────────────┤
│  Showing 1-20 of 347  [← Prev]  [1] [2] ... [Next →]  │
└────────────────────────────────────────────────────────┘
```

**Filters dropdown:**  
Multi-select panel with two sections:  
- **Topic:** checkboxes for all user tags  
- **Difficulty:** Easy / Medium / Hard toggles  
- **Status:** Solved / Unsolved toggles  

**Mobile fallback:**  
Table collapses to stacked cards:
```
┌──────────────────────────┐
│ 🟢 Easy                  │
│ Two Sum                  │
│ #arrays #hashtable       │
│ [View] [⭐] [Edit] [🗑]  │
└──────────────────────────┘
```

---

### 7.5 Add Problem Modal

```
┌─────────────────────────────────────────┐
│  Track New Problem                   [×]│
│                                         │
│  Problem Name*                          │
│  [Two Sum                           ]   │
│                                         │
│  Problem URL                            │
│  [https://leetcode.com/problems/...  ]  │
│                                         │
│  Topic Tags                             │
│  [arrays ×] [hashtable ×] [+ add tag]   │
│                                         │
│  Difficulty*                            │
│  [ Easy ] [ Medium ] [ Hard ]           │
│                                         │
│  Public                                 │
│  ○──────● (toggle switch)               │
│                                         │
│  [  Cancel  ]          [  Add Problem →]│
└─────────────────────────────────────────┘
```

- Tags input: typeahead autocomplete from user's existing tags, create on Enter, forced lowercase  
- Difficulty: segmented control, green/yellow/red background active state  
- On submit: modal closes → Problem Detail Modal opens immediately  

---

### 7.6 Problem Detail Modal

```
┌──────────────────────────────────────────────────────────────┐
│  Two Sum                                    [🔗] [⭐] [Edit] [×]│
│  🟢 Easy   #arrays  #hashtable                               │
│  Added: 03-JUN-2026 · Solved: 03-JUN-2026 14:30 IST          │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  ── SRS Timeline ───────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [✅ Solved]──[✅ 3d]──[🔔 7d Due]──[⬜ 15d]──[⬜ 30d] │   │
│  │  03-JUN     06-JUN   10-JUN ◄NOW   25-JUN   10-JUL  │   │
│  │                                                      │   │
│  │  ⓘ Next review: 10-JUN-2026 00:00 IST (in 4 days)   │   │
│  │  [Request Revisit Cycle] ← visible only after 30d ✅ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Solutions  (2) ──────────────────── [+ Add Solution] ── │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Brute Force       Python    O(n²) / O(1)  [View] [✏]│   │
│  │  Added: 03-JUN-2026 14:30 IST                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HashMap Approach  Python    O(n) / O(n)   [View] [✏]│   │
│  │  Added: 03-JUN-2026 15:00 IST                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Problem Notes ────────────────────── [+ Add Note] ───── │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📝 NOTE  │ Check edge case: empty array input         │   │
│  │          │ 03-JUN-2026 16:00 IST               [✏][🗑]│   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ⚠️ WARN  │ Off-by-one in brute force — verify bounds  │   │
│  │          │ 03-JUN-2026 16:05 IST               [✏][🗑]│   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**SRS Timeline strip rules:**
- Shows every interval node: Solved → 3d → 7d → 15d → 30d  
- ✅ = completed, 🔔 = due today / overdue, ⬜ = upcoming  
- Each node shows its date in `dd-MON-yyyy` IST format  
- After 30d is ✅: a `[Request Revisit Cycle]` button appears (never auto-starts)  
- During revisit: shows `[Pause Revisit]` and `[End Revisit]` instead; revisit timeline repeats the 4-node strip below the primary strip  

**Notes panel rules:**
- Problem-level notes shown directly in the Problem Detail Modal  
- Note badge colors: `note` = blue, `warning` = amber, `success` = green, `error` = red  
- Notes are visible to viewers when problem is public (read-only)  
- If `is_public = true`, show share link button (copy-to-clipboard)  

---

### 7.7 Add / View Solution Modal (Monaco Editor embedded)

```
┌───────────────────────────────────────────────────────────────┐
│  Add Solution                                             [×]  │
│                                                               │
│  Solution Name*      Language*                               │
│  [HashMap Approach]  [Python ▼] ← default_language pre-fills │
│                                                               │
│  Time Complexity         Space Complexity                     │
│  [O(n)           ▼]      [O(n)           ▼]                   │
│  (predefined: O(1), O(log n), O(n), O(n log n), O(n²), custom)│
│                                                               │
│  Intuition & Approach (Markdown supported)                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Use a hashmap to store complement pairs...              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Code  (Monaco Editor — editable; Shiki — read-only view)    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 1  def twoSum(nums: list[int], target: int)...          │  │
│  │ 2      seen = {}                                        │  │
│  │ 3      for i, num in enumerate(nums):                   │  │
│  │ 4          comp = target - num                          │  │
│  │ 5          if comp in seen:                             │  │
│  │ 6              return [seen[comp], i]                   │  │
│  │ 7          seen[num] = i                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ── Solution Notes ──────────────────────── [+ Add Note] ──  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ✅ SUCCESS │ Passes all LeetCode test cases incl. neg nums│  │
│  │            │ 03-JUN-2026 15:30 IST              [✏][🗑] │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 🔴 ERROR   │ Fails when nums=[0,0], target=0 — fix seen  │  │
│  │            │ 03-JUN-2026 15:45 IST              [✏][🗑] │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  [  Cancel  ]                         [  Save Solution →  ]   │
└───────────────────────────────────────────────────────────────┘
```

Monaco editor height: min 240px, max 480px, resizable handle at bottom.  
**Edit mode:** Monaco Editor (full IntelliSense).  
**View-only mode (read-only / public):** Shiki renders highlighted HTML — no Monaco bundle loaded.

---

### 7.8 Sheets Tab

```
┌─────────────────────────────────────────────────────┐
│  My Sheets                          [+ New Sheet]    │
│                                                     │
│  ┌─────────────────┐ ┌─────────────────┐            │
│  │ Blind 75        │ │ Dynamic Prog    │            │
│  │ 42 problems     │ │ 18 problems     │            │
│  │ 🔓 Public       │ │ 🔒 Private      │            │
│  │ Updated 2d ago  │ │ Updated 5d ago  │            │
│  └─────────────────┘ └─────────────────┘            │
│                                                     │
│  ┌─────────────────┐ ┌─────────────────┐            │
│  │ + New Sheet     │ │                 │            │
│  │   (ghost card)  │ │                 │            │
│  └─────────────────┘ └─────────────────┘            │
└─────────────────────────────────────────────────────┘
```

- Grid: 3 cols desktop, 2 cols tablet, 1 col mobile  
- Sheet card: hover shows "Open", "Share", "Delete" action buttons  
- Making a sheet public: system checks all contained problems are `is_public=true`; if not, shows warning with list of private problems  

---

### 7.9 Analytics Tab

```
┌──────────────────────────────────────────────────────────┐
│  📊 Analytics                                            │
│                                                          │
│  [Total: 85] [Solved: 62] [Streak: 🔥14d] [Best: 21d]   │
│                                                          │
│  ── Activity Heatmap (GitHub-style, 52 weeks) ──────────│
│  [░░▒▒▒▓▓▓▓▓░░░░▒▒▒▒▓▓▓▓▓▓▒░░░░░▒▒▒▒▒▓▓▓▓░░░░▒▒▒▒▒▓▓]  │
│  Jan  Feb  Mar  Apr  May  Jun  Jul ...                   │
│                                                          │
│  ┌──────────────────────┐ ┌──────────────────────────┐  │
│  │  Topic Distribution   │ │  Difficulty Distribution  │  │
│  │  (Donut chart)        │ │  (Horizontal bar chart)   │  │
│  │  Arrays 35%           │ │  🟢 Easy  ██████ 30       │  │
│  │  DP 20%               │ │  🟡 Med   ████████ 24     │  │
│  │  Graphs 15%           │ │  🔴 Hard  ████ 8          │  │
│  │  ...                  │ │                           │  │
│  └──────────────────────┘ └──────────────────────────┘  │
│                                                          │
│  ┌──────────────────────┐ ┌──────────────────────────┐  │
│  │  Time Complexity      │ │  Space Complexity         │  │
│  │  (Bar chart)          │ │  (Bar chart)              │  │
│  └──────────────────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

### 7.10 Settings Page

```
┌──────────────────────────────────────────────┐
│  ⚙ Settings                                  │
│                                              │
│  ── Profile ─────────────────────────────   │
│  Username      [soham_codes              ]   │
│  Email         [soham@example.com        ]   │
│                                              │
│  ── Preferences ──────────────────────────  │
│  Default Language  [Python           ▼]      │
│  Theme             [System           ▼]      │
│                                              │
│  ── Notifications ────────────────────────  │
│  SRS Reminders     ●──── On                  │
│  Loop SRS by default ○── Off                 │
│                                              │
│  ── Security ─────────────────────────────  │
│  [Change Password]                           │
│                                              │
│  ── Danger Zone ──────────────────────────  │
│  [Delete Account]  (confirmation required)   │
└──────────────────────────────────────────────┘
```

---

## 8. Full UML Suite

### 8.1 System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        Browser["Browser / PWA"]
        MobileApp["Mobile (future)"]
    end

    subgraph NextJS["Next.js 16 Application"]
        AppRouter["App Router (RSC + SSR)"]
        APIRoutes["API Routes (Server Actions)"]
        Middleware["Auth Middleware\n(iron-session)"]
    end

    subgraph Services["Backend Services"]
        ProblemSvc["ProblemService"]
        SRSSvc["SRSScheduler"]
        NotifSvc["NotificationService"]
        AnalyticsSvc["AnalyticsService"]
        SheetSvc["SheetService"]
    end

    subgraph DataLayer["Data Layer"]
        PG[("PostgreSQL 16\n(Primary Store)")]
        Redis[("Redis 7\n(Queue + Cache)")]
    end

    subgraph CDN["CDN / Edge"]
        PublicCache["Public Sheets Cache\n(ISR / CDN)"]
        MonacoCDN["Monaco Editor\n(CDN chunks)"]
    end

    Browser --> AppRouter
    Browser --> APIRoutes
    APIRoutes --> Middleware
    Middleware --> Services
    Services --> PG
    Services --> Redis
    SRSSvc --> Redis
    AppRouter --> PublicCache
    Browser --> MonacoCDN
```

---

### 8.2 Frontend Component Tree

```mermaid
flowchart TD
    Root["app/layout.tsx\n(ThemeProvider, QueryProvider)"]

    Root --> Landing["page.tsx\nLanding Page"]
    Root --> AuthGroup["(auth) group"]
    Root --> DashGroup["(dashboard) group"]
    Root --> PublicGroup["(public) group"]

    AuthGroup --> LoginPage["login/page.tsx"]
    AuthGroup --> SignupPage["signup/page.tsx"]

    DashGroup --> DashLayout["layout.tsx\n(Sidebar + TopBar)"]
    DashLayout --> Sidebar["Sidebar.tsx"]
    DashLayout --> TopBar["TopBar.tsx"]
    DashLayout --> ProblemsPage["problems/page.tsx"]
    DashLayout --> SheetsPage["sheets/page.tsx"]
    DashLayout --> AnalyticsPage["analytics/page.tsx"]

    ProblemsPage --> ProblemsTable["ProblemsTable.tsx\n(TanStack Virtual)"]
    ProblemsPage --> AddProblemModal["AddProblemModal.tsx"]
    ProblemsPage --> ProblemDetailModal["ProblemDetailModal.tsx"]
    ProblemDetailModal --> SolutionModal["SolutionModal.tsx"]
    SolutionModal --> CodeEditor["CodeEditor.tsx\n(Monaco, lazy)"]
    SolutionModal --> LanguageSelector["LanguageSelector.tsx"]
    SolutionModal --> ComplexityCombobox["ComplexityCombobox.tsx"]

    TopBar --> NotificationBell["NotificationBell.tsx"]
    NotificationBell --> NotificationDropdown["NotificationDropdown.tsx"]
    TopBar --> ThemeToggle["ThemeToggle.tsx"]

    SheetsPage --> SheetsGrid["SheetsGrid.tsx"]
    SheetsGrid --> SheetCard["SheetCard.tsx"]

    AnalyticsPage --> StatsRow["StatsRow.tsx"]
    AnalyticsPage --> ActivityHeatmap["ActivityHeatmap.tsx"]
    AnalyticsPage --> TopicDonutChart["TopicDonutChart.tsx"]
    AnalyticsPage --> DifficultyBarChart["DifficultyBarChart.tsx"]
    AnalyticsPage --> ComplexityBarChart["ComplexityBarChart.tsx"]

    Root --> OnboardingModal["LanguageOnboardingModal.tsx\n(shown if !onboarding_complete)"]
```

---

### 8.3 Backend Service Class Diagram

```mermaid
classDiagram
    class ProblemService {
        +createProblem(userId: string, dto: CreateProblemDTO) Problem
        +getProblems(userId: string, filters: ProblemFilters) PaginatedResult~Problem~
        +getProblemById(id: string, userId: string) Problem
        +updateProblem(id: string, dto: UpdateProblemDTO) Problem
        +deleteProblem(id: string) void
        +searchProblems(userId: string, query: string) Problem[]
        -assertOwnership(userId: string, problemId: string) void
    }

    class SolutionService {
        +addSolution(problemId: string, dto: CreateSolutionDTO) Solution
        +getSolutions(problemId: string) Solution[]
        +updateSolution(id: string, dto: UpdateSolutionDTO) Solution
        +deleteSolution(id: string) void
        -markProblemSolved(problemId: string) void
        -triggerSRSInit(problemId: string, userId: string) void
    }

    class SRSScheduler {
        -INTERVALS: number[] = [3, 7, 15, 30]
        +initSchedule(problemId: string, userId: string, loopEnabled: boolean) void
        +getDueItems(userId: string) SRSScheduleRow[]
        +markComplete(scheduleId: string) void
        +resetSchedule(problemId: string, userId: string) void
        -enqueueRedis(userId: string, problemId: string, dueAt: Date) void
        -dequeueRedis(userId: string, problemId: string) void
    }

    class NotificationService {
        +createNotification(userId: string, dto: CreateNotifDTO) Notification
        +getUnread(userId: string) Notification[]
        +getUnreadCount(userId: string) number
        +markRead(notifId: string) void
        +markAllRead(userId: string) void
        -getCachedCount(userId: string) number
        -invalidateCountCache(userId: string) void
    }

    class AnalyticsService {
        +getAnalytics(userId: string) AnalyticsPayload
        -buildSnapshot(userId: string) AnalyticsCache
        -isStale(cachedAt: Date) boolean
        -computeStreak(userId: string) StreakData
        -computeHeatmap(userId: string) HeatmapData
        -computeDistributions(userId: string) DistributionData
    }

    class SheetService {
        +createSheet(userId: string, dto: CreateSheetDTO) Sheet
        +getSheets(userId: string) Sheet[]
        +updateSheet(id: string, dto: UpdateSheetDTO) Sheet
        +deleteSheet(id: string) void
        +addProblem(sheetId: string, problemId: string) void
        +removeProblem(sheetId: string, problemId: string) void
        +getPublicSheet(shareToken: string) PublicSheetView
        -validatePublicEligibility(sheetId: string) void
        -generateShareToken() string
    }

    class TagService {
        +getUserTags(userId: string) Tag[]
        +autocomplete(userId: string, prefix: string) Tag[]
        +createTag(userId: string, name: string) Tag
        +normalizeName(name: string) string
    }

    SolutionService --> SRSScheduler : "triggers on first solution"
    SRSScheduler --> NotificationService : "creates srs_due notifications"
    ProblemService --> TagService : "delegates tag resolution"
    ProblemService --> AnalyticsService : "invalidates cache on solve"
```

---

### 8.4 Sequence: Auth + Onboarding

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant API as /api/auth/signup
    participant DB as PostgreSQL
    participant Redis as Redis

    User->>UI: Fill username + password + submit
    UI->>API: POST /api/auth/signup { username, password }
    API->>API: Hash password (argon2id)
    API->>DB: INSERT INTO users (onboarding_complete=false)
    DB-->>API: user row
    API->>Redis: HSET session:{token} user_id expires_at
    API-->>UI: 201 Set-Cookie: session={token}
    UI->>UI: Store session, redirect /problems

    Note over UI: Checks onboarding_complete === false
    UI->>UI: Mount LanguageOnboardingModal (blocks dashboard)

    User->>UI: Select "Python" from language grid
    UI->>API: PATCH /api/users/me { default_language: "python", onboarding_complete: true }
    API->>DB: UPDATE users SET default_language, onboarding_complete=true
    DB-->>API: OK
    API-->>UI: 200 { user }
    UI->>UI: Dismiss modal → Dashboard fully visible
```

---

### 8.5 Sequence: Add Problem → Solution → SRS Init

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant API as API Routes
    participant DB as PostgreSQL
    participant Redis as Redis
    participant SRS as SRSScheduler

    User->>UI: Fill Add Problem modal + submit
    UI->>API: POST /api/problems { name, url, tags, difficulty, is_public }
    API->>DB: INSERT INTO problems (status='unsolved')
    API->>DB: UPSERT tags (user-scoped, lowercase)
    API->>DB: INSERT INTO problem_tags (batch)
    DB-->>API: { problem }
    API-->>UI: 201 { problem }
    UI->>UI: Close modal → Open ProblemDetailModal

    User->>UI: Click "+ Add Solution" → Fill SolutionModal
    UI->>API: POST /api/problems/{id}/solutions { name, language, code, ... }
    API->>DB: INSERT INTO solutions
    API->>DB: UPDATE problems SET status='solved', solved_at=NOW()
    API->>SRS: triggerSRSInit(problemId, userId, loop_enabled)
    SRS->>DB: INSERT 4 rows into srs_schedule (3d, 7d, 15d, 30d)
    SRS->>Redis: ZADD srs:queue:{userId} {due_ts_3d} "problem:{id}:3"
    SRS->>Redis: ZADD srs:queue:{userId} {due_ts_7d} "problem:{id}:7"
    SRS->>Redis: ZADD srs:queue:{userId} {due_ts_15d} "problem:{id}:15"
    SRS->>Redis: ZADD srs:queue:{userId} {due_ts_30d} "problem:{id}:30"
    API->>DB: INVALIDATE analytics_cache for user (DELETE WHERE snapshot_date=TODAY)
    DB-->>API: OK
    API-->>UI: 201 { solution }
    UI->>UI: Update problem badge → "Solved" ✅
```

---

### 8.6 Sequence: SRS Notification Polling & Review

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant API as /api/srs + /api/notifications
    participant Redis as Redis
    participant DB as PostgreSQL

    Note over UI: On mount + every 5 minutes (polling)
    UI->>API: GET /api/notifications?unread=true
    API->>Redis: GET notif:count:{userId}
    alt Cache hit
        Redis-->>API: count=3
    else Cache miss
        API->>Redis: ZRANGEBYSCORE srs:queue:{userId} 0 {now_unix}
        Redis-->>API: ["problem:abc:3", "problem:xyz:7"]
        API->>DB: SELECT unread notifications WHERE user_id
        DB-->>API: 3 rows
        API->>Redis: SET notif:count:{userId} 3 EX 300
    end
    API-->>UI: { count: 3 }
    UI->>UI: Render 🔔 badge with count

    User->>UI: Click Bell icon
    UI->>API: GET /api/notifications
    API->>DB: SELECT notifications ORDER BY created_at DESC LIMIT 20
    DB-->>API: [notifications]
    API-->>UI: notification list
    UI->>UI: Show dropdown: "Review Two Sum (Day 7 due)"

    User->>UI: Click "Review Two Sum"
    UI->>UI: Open ProblemDetailModal in Review mode
    User->>UI: Click "Mark Reviewed ✓"
    UI->>API: POST /api/srs/{scheduleId}/complete
    API->>DB: UPDATE srs_schedule SET status='completed', completed_at=NOW()
    API->>Redis: ZREM srs:queue:{userId} "problem:abc:3"
    API->>Redis: DEL notif:count:{userId} (invalidate)
    API->>DB: INSERT notification { type:'srs_due' next interval message }
    DB-->>API: OK
    API-->>UI: 200
    UI->>UI: Dismiss review, update notification count
```

---

### 8.7 Sequence: Public Sheet Access (Cross-user)

```mermaid
sequenceDiagram
    actor User2 as User 2 (Viewer)
    participant UI as Browser
    participant API as /api/s/:token
    participant Cache as Redis / CDN Cache
    participant DB as PostgreSQL

    User2->>UI: Navigate to /s/abc123token
    UI->>API: GET /api/s/abc123token
    API->>Cache: GET sheet:public:abc123token
    alt Cache hit (TTL 24h)
        Cache-->>API: { sheet, problems, solutions }
        API-->>UI: 200 { sheetView }
    else Cache miss
        API->>DB: SELECT sheet WHERE share_token='abc123token'
        DB-->>API: sheet row
        API->>DB: SELECT problems WHERE sheet_id AND is_public=true
        API->>DB: SELECT solutions WHERE problem_id IN (...)
        DB-->>API: full dataset
        API->>Cache: SET sheet:public:abc123token {...} EX 86400
        API-->>UI: 200 { sheetView }
    end

    UI->>UI: Render read-only sheet view
    Note over UI: No edit/delete controls visible
    Note over UI: Code, intuition, approach all readable
```

---

### 8.8 Problem Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Unsolved : Problem added\n(no solutions yet)
    Unsolved --> Solved : First solution added\nauto: solved_at = NOW()

    Solved --> SRS_Active : SRSScheduler.init()\n4 intervals queued in Redis

    state SRS_Active {
        [*] --> Interval_3d : Day 0
        Interval_3d --> Interval_7d : Day 3 reviewed ✓
        Interval_7d --> Interval_15d : Day 7 reviewed ✓
        Interval_15d --> Interval_30d : Day 15 reviewed ✓
        Interval_30d --> Cycle_Complete : Day 30 reviewed ✓
    }

    SRS_Active --> Review_Overdue : Due date passed\nno review action

    Review_Overdue --> SRS_Active : User completes review\n(late)

    Cycle_Complete --> [*] : loop_enabled = false\nSchedule archived

    Cycle_Complete --> SRS_Active : loop_enabled = true\nReset: new 4-interval cycle
```

---

### 8.9 SRS Engine Activity Diagram

```mermaid
flowchart TD
    A([Problem solved]) --> B[Create 4 srs_schedule rows\n3d · 7d · 15d · 30d]
    B --> C[ZADD Redis sorted set\nscore = due_unix_timestamp]
    C --> D{Background: poll every\n5 min via client}
    D --> E[ZRANGEBYSCORE 0 NOW\nfetch due items]
    E --> F{Any due?}
    F -- No --> D
    F -- Yes --> G[Create notifications in DB\nINCR notif:count:userId in Redis]
    G --> H[Bell badge updates in UI]
    H --> I{User opens due review}
    I -- Skips --> J[srs_schedule.status = skipped\nNotif remains]
    I -- Reviews --> K[POST /srs/:id/complete]
    K --> L[Mark schedule row completed\nZREM from Redis]
    L --> M{Is this the last interval\nAND loop_enabled?}
    M -- Yes, loop --> N[Reset: new 4-interval\ncycle from today]
    N --> C
    M -- No, done --> O[All intervals archived\nSRS cycle complete]
    O --> P([End])
```

---

### 8.10 Use Case Overview

```mermaid
flowchart LR
    subgraph Actors
        Anon["👤 Anonymous User"]
        Auth["👤 Authenticated User"]
    end

    subgraph Anon_UC["Anonymous Use Cases"]
        UC1["View Landing Page"]
        UC2["Sign Up"]
        UC3["Log In"]
        UC4["View Public Sheet"]
        UC5["View Public Problem + Solutions"]
    end

    subgraph Auth_UC["Authenticated Use Cases"]
        UC6["Add / Edit / Delete Problem"]
        UC7["Add / Edit / Delete Solution"]
        UC8["Filter & Search Problems"]
        UC9["Favorite a Problem"]
        UC10["Create & Manage Sheets"]
        UC11["Share Sheet Publicly"]
        UC12["Review SRS Due Problems"]
        UC13["View Analytics & Heatmap"]
        UC14["Change Settings & Default Language"]
        UC15["Toggle Dark / Light Mode"]
    end

    Anon --> UC1
    Anon --> UC2
    Anon --> UC3
    Anon --> UC4
    Anon --> UC5

    Auth --> UC6
    Auth --> UC7
    Auth --> UC8
    Auth --> UC9
    Auth --> UC10
    Auth --> UC11
    Auth --> UC12
    Auth --> UC13
    Auth --> UC14
    Auth --> UC15
```

---

## 9. Spaced Repetition Engine — Deep Dive

### 9.1 Interval Logic

```typescript
// lib/srs/scheduler.ts

const SRS_INTERVALS_DAYS = [3, 7, 15, 30] as const;

/**
 * Initializes a full 4-interval SRS schedule for a newly solved problem.
 * Inserts DB rows AND enqueues all 4 entries in Redis sorted set.
 *
 * @param problemId - UUID of the solved problem
 * @param userId    - UUID of the problem owner
 * @param solvedAt  - Timestamp when problem was first solved (default: NOW())
 * @param loop      - Whether to restart the cycle after day-30 completion
 */
async function initSchedule(
  problemId: string,
  userId: string,
  solvedAt: Date = new Date(),
  loop: boolean = false,
): Promise<void> {
  const rows = SRS_INTERVALS_DAYS.map((days) => ({
    id: crypto.randomUUID(),
    problem_id: problemId,
    user_id: userId,
    interval_days: days,
    due_date: addDays(solvedAt, days),   // date-fns addDays
    status: "pending",
    loop_enabled: loop,
    created_at: new Date(),
  }));

  // DB bulk insert (Drizzle)
  await db.insert(srsSchedule).values(rows);

  // Redis: ZADD srs:queue:{userId} {score=unix_ts} {member=scheduleId}
  const redisArgs = rows.flatMap((r) => [
    r.due_date.getTime() / 1000,  // Unix seconds as score
    r.id,
  ]);
  await redis.zadd(`srs:queue:${userId}`, ...redisArgs);
}
```

### 9.2 Redis Queue Operations

```
# Enqueue (on solve)
ZADD srs:queue:{userId} {unix_due_timestamp} {scheduleId}

# Poll due items (every client tick)
ZRANGEBYSCORE srs:queue:{userId} 0 {unix_now}
→ Returns list of scheduleIds whose due_date <= now

# Dequeue on review
ZREM srs:queue:{userId} {scheduleId}

# Peek count without removing
ZCOUNT srs:queue:{userId} 0 {unix_now}
```

### 9.3 Notification Deduplication

A notification is only created once per `(user_id, related_id, type)` per day. Before inserting, check:

```sql
SELECT id FROM notifications
WHERE user_id = $1
  AND related_id = $2
  AND type = 'srs_due'
  AND created_at::date = CURRENT_DATE
LIMIT 1;
```

If exists → skip insert.

### 9.4 Post-30d Revisit Cycle

The revisit cycle is **opt-in only** — it is never started automatically. It only makes sense for problems the user still feels uncertain about after completing the full 3d → 7d → 15d → 30d cycle.

#### User Flow

```
ProblemDetailModal: 30d review ✅ complete
  └→ [Request Revisit Cycle] button appears in SRS Timeline strip
       └→ User clicks it
            └→ POST /api/srs/:scheduleId/revisit { action: 'start' }
                 └→ Insert new srs_schedule rows (3d/7d/15d/30d from today)
                      revisit_status = 'active', revisit_started_at = NOW()
                 └→ Enqueue in Upstash Redis sorted set

During revisit cycle — user sees two options in the timeline:
  ┌──────────────────────────────────────────────┐
  │ Revisit Cycle — Started: 05-JUN-2026 IST              │
  │ [✅ R-3d]───[🔔 R-7d Due]───[⬜ R-15d]───[⬜ R-30d]      │
  │                                                    │
  │ [Pause Revisit]          [End Revisit]              │
  └──────────────────────────────────────────────┘
```

#### API Actions

| Action body | Behaviour |
|---|---|
| `{ action: 'start' }` | Insert 4 new `srs_schedule` rows with `revisit_status = 'active'`; enqueue in Redis. Blocked if an active revisit cycle already exists for this problem. |
| `{ action: 'pause' }` | `UPDATE srs_schedule SET revisit_status = 'paused'` for all active revisit rows; `ZREM` from Redis queue (stops notifications). Resume by calling `start` again. |
| `{ action: 'end' }` | `UPDATE srs_schedule SET revisit_status = 'ended', status = 'skipped'`; `ZREM` from Redis queue. The primary 30d completion remains archived. |

#### Revisit State Machine (inline)

```
[30d Completed] ── user clicks Request ──▶ [Revisit Active]
                                              │           │
                              user Pauses ◄─┘     └─▶ [Revisit Paused]
                                                            │
                              [Revisit Active] ◄── user Resumes

[Revisit Active] ── user Ends ──▶ [Revisit Ended (archived)]
[Revisit Paused] ── user Ends ──▶ [Revisit Ended (archived)]
[Revisit Active] ── 30d completed again ──▶ [Revisit Active] (button reappears for another cycle)
```

> **Guard:** A revisit cycle is only applicable if `interval_days = 30` and `status = 'completed'` for the target schedule row. The API returns `409 Conflict` if a revisit is already active for the same problem.

---

## 10. Onboarding — Default Language Selection

### 10.1 Trigger Logic

```typescript
// app/(dashboard)/layout.tsx (server component)
const user = await getSessionUser();
if (!user.onboarding_complete) {
  // Pass flag to client → mounts modal
}
```

### 10.2 Language Selection Modal UI

```
┌──────────────────────────────────────────────────────┐
│       Welcome to CodeVault! 🚀                       │
│                                                      │
│   What's your primary programming language?          │
│   This pre-fills your solution editor.               │
│   (You can change it anytime in Settings)            │
│                                                      │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│   │  🐍    │ │  🟨    │ │  🔷    │ │  ☕    │       │
│   │ Python │ │  JS    │ │  TS    │ │  Java  │       │
│   └────────┘ └────────┘ └────────┘ └────────┘       │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│   │  ⚙️    │ │  🦀    │ │  🐹    │ │  🎯    │       │
│   │  C++   │ │  Rust  │ │   Go   │ │  C#    │       │
│   └────────┘ └────────┘ └────────┘ └────────┘       │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│   │  🍎    │ │  💎    │ │  🐘    │ │  🌐    │       │
│   │ Swift  │ │ Kotlin │ │  PHP   │ │ Other  │       │
│   └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                      │
│             [  Continue →  ] (disabled until pick)   │
└──────────────────────────────────────────────────────┘
```

- Selected card: highlighted with accent border + checkmark  
- "Other" option: shows a text input for custom language string  
- On confirm: `PATCH /api/users/me` → modal dismissed, not shown again  

### 10.3 Settings Override

`/settings` page shows the same language selector dropdown. Changing it calls the same `PATCH /api/users/me` endpoint. All new SolutionModals will read `user.default_language` from session/query cache.

---

## 11. Syntax Highlighting — Monaco + Shiki

CodeVault uses **two separate tools** for code display depending on context:

| Context | Tool | Why |
|---|---|---|
| **Edit / Add Solution modal** | Monaco Editor (lazy-loaded) | Full IntelliSense, bracket pair coloring, live typing |
| **Read-only view** (solution card, Problem Detail Modal, public sheet) | **Shiki v1** | Zero JS weight on client; renders pre-highlighted HTML on server; supports 100+ languages and themes natively |

### 11.1 Monaco Editor Setup (Edit Mode, lazy-loaded)

```typescript
// components/editor/CodeEditor.tsx
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    ssr: false,           // Never render on server
    loading: () => <CodeEditorSkeleton />,
  }
);

export function CodeEditor({ language, value, onChange }: Props) {
  const { resolvedTheme } = useTheme();

  return (
    <MonacoEditor
      height="min(480px, 60vh)"
      language={language}           // Monaco language id
      value={value}
      onChange={onChange}
      theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}  // Monaco built-in themes
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        lineNumbers: "on",
        folding: true,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,      // Resize-aware
        tabSize: 4,
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        formatOnPaste: true,
      }}
    />
  );
}
```

> **No custom token color maps.** Monaco's built-in `vs-dark` (dark) and `vs` (light) themes are used directly. Theme switches automatically when `resolvedTheme` changes via the `theme` prop.

### 11.2 Shiki Setup (Read-Only Code Display)

Shiki renders syntax-highlighted HTML **on the server** (Next.js Server Component or `generateHTML` API route), meaning **zero JavaScript is sent to the client** for read-only code blocks.

```typescript
// lib/utils/highlightCode.ts
import { createHighlighter } from "shiki";

let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;

async function getHighlighter() {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ["github-dark", "github-light"],   // Built-in Shiki theme bundles
      langs: [
        "python", "javascript", "typescript", "java", "cpp", "c",
        "csharp", "go", "rust", "kotlin", "swift", "ruby", "php",
        "scala", "haskell", "sql", "bash", "r", "erlang",
      ],
    });
  }
  return highlighterInstance;
}

export async function highlightCode(
  code: string,
  lang: string,
  theme: "dark" | "light" = "dark",
): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, {
    lang,
    theme: theme === "dark" ? "github-dark" : "github-light",
  });
}
```

```tsx
// components/editor/CodeDisplay.tsx  (Server Component)
import { highlightCode } from "@/lib/utils/highlightCode";
import { cookies } from "next/headers";

export async function CodeDisplay({ code, language }: Props) {
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
  const html = await highlightCode(code, language, theme);
  return (
    <div
      className="code-display rounded-lg overflow-auto"
      dangerouslySetInnerHTML={{ __html: html }}   // Shiki output is safe
    />
  );
}
```

### 11.3 Supported Languages

Both Monaco and Shiki support the same language set. Shiki uses its own language IDs (fully compatible):

| Language | Monaco ID | Shiki ID | Notes |
|---|---|---|---|
| Python | `python` | `python` | |
| JavaScript | `javascript` | `javascript` | + JSX |
| TypeScript | `typescript` | `typescript` | + TSX |
| Java | `java` | `java` | |
| C++ | `cpp` | `cpp` | |
| C | `c` | `c` | |
| C# | `csharp` | `csharp` | |
| Go | `go` | `go` | |
| Rust | `rust` | `rust` | |
| Kotlin | `kotlin` | `kotlin` | |
| Swift | `swift` | `swift` | |
| Ruby | `ruby` | `ruby` | |
| PHP | `php` | `php` | |
| Scala | `scala` | `scala` | |
| Haskell | `haskell` | `haskell` | |
| SQL | `sql` | `sql` | |
| Bash | `shell` | `bash` | |
| R | `r` | `r` | |

### 11.4 Theme Pairing

| Site Theme | Monaco theme | Shiki theme |
|---|---|---|
| Dark | `vs-dark` | `github-dark` |
| Light | `vs` | `github-light` |

No manual token color definitions needed — both libraries ship their own complete, well-tested theme bundles.

---

## 12. Performance & Scalability Blueprint

### 12.1 PostgreSQL Indexing Strategy

```sql
-- ═══════════════════════════════════════════
-- PROBLEMS (highest query volume table)
-- ═══════════════════════════════════════════

-- Primary list fetch (user's problems, sorted by creation)
CREATE INDEX idx_problems_user_created
  ON problems(user_id, created_at DESC);

-- Filter by status
CREATE INDEX idx_problems_user_status
  ON problems(user_id, status);

-- Filter by difficulty
CREATE INDEX idx_problems_user_difficulty
  ON problems(user_id, difficulty);

-- Favorites-only view (partial index — only indexes true rows)
CREATE INDEX idx_problems_user_favorite
  ON problems(user_id, created_at DESC)
  WHERE is_favorite = TRUE;

-- Public problems (for cross-user browsing)
CREATE INDEX idx_problems_public
  ON problems(user_id, created_at DESC)
  WHERE is_public = TRUE;

-- Full-text search on problem name
CREATE INDEX idx_problems_name_fts
  ON problems USING gin(to_tsvector('english', name));

-- ═══════════════════════════════════════════
-- SRS_SCHEDULE (hot path — polled every 5 min)
-- ═══════════════════════════════════════════

-- Fetch due items by user (partial index: only pending rows stored)
CREATE INDEX idx_srs_user_due_pending
  ON srs_schedule(user_id, due_date)
  WHERE status = 'pending';

-- Problem-level schedule lookup (for detail modal SRS status)
CREATE INDEX idx_srs_problem
  ON srs_schedule(problem_id, interval_days);

-- ═══════════════════════════════════════════
-- SOLUTIONS
-- ═══════════════════════════════════════════

CREATE INDEX idx_solutions_problem
  ON solutions(problem_id, created_at);

-- Language distribution for analytics
CREATE INDEX idx_solutions_user_lang
  ON solutions(user_id, language);

-- ═══════════════════════════════════════════
-- PROBLEM_TAGS (junction — used in filter)
-- ═══════════════════════════════════════════

CREATE INDEX idx_problem_tags_tag
  ON problem_tags(tag_id, problem_id);

-- ═══════════════════════════════════════════
-- TAGS
-- ═══════════════════════════════════════════

-- Autocomplete prefix search
CREATE INDEX idx_tags_user_name
  ON tags(user_id, name text_pattern_ops);  -- supports LIKE 'prefix%'

-- ═══════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = FALSE;

-- ═══════════════════════════════════════════
-- SHEETS
-- ═══════════════════════════════════════════

CREATE INDEX idx_sheets_user
  ON sheets(user_id, created_at DESC);

CREATE INDEX idx_sheets_share_token
  ON sheets(share_token)
  WHERE share_token IS NOT NULL;

-- ═══════════════════════════════════════════
-- ANALYTICS_CACHE
-- ═══════════════════════════════════════════

-- Unique snapshot per user per day (also the PK)
CREATE UNIQUE INDEX idx_analytics_user_date
  ON analytics_cache(user_id, snapshot_date);
```

> **Explain before deploying:** Run `EXPLAIN (ANALYZE, BUFFERS)` on the top 5 queries per table before going to production. Partial indexes on `is_favorite`, `is_public`, and SRS `status='pending'` are critical — they keep index size minimal while covering the exact hotpath.

---

### 12.2 Table Partitioning

#### `solutions` — Hash-partitioned by `user_id` (for 10k+ users, each with 100+ solutions)

```sql
CREATE TABLE solutions (
  id          uuid        NOT NULL,
  problem_id  uuid        NOT NULL,
  user_id     uuid        NOT NULL,
  name        varchar(128),
  language    varchar(32),
  time_complexity  varchar(32),
  space_complexity varchar(32),
  intuition   text,
  code        text,
  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL
) PARTITION BY HASH (user_id);

CREATE TABLE solutions_p0 PARTITION OF solutions
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE solutions_p1 PARTITION OF solutions
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE solutions_p2 PARTITION OF solutions
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE solutions_p3 PARTITION OF solutions
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

#### `analytics_cache` — Range-partitioned by `snapshot_date` (auto-prune old snapshots)

```sql
CREATE TABLE analytics_cache (
  ...
) PARTITION BY RANGE (snapshot_date);

-- Created annually via cron / migration
CREATE TABLE analytics_cache_y2025
  PARTITION OF analytics_cache
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE analytics_cache_y2026
  PARTITION OF analytics_cache
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

#### `srs_schedule` — Hash-partitioned by `user_id` (high row volume)

```sql
CREATE TABLE srs_schedule (
  ...
) PARTITION BY HASH (user_id);
-- 4 partitions (same pattern as solutions)
```

---

### 12.3 Redis Data Structure Map

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `srs:queue:{userId}` | Sorted Set (ZSET) | No TTL (managed manually) | Score = Unix due-timestamp; member = scheduleId |
| `session:{token}` | Hash | 7d | `{ user_id, username, theme, default_language }` |
| `notif:count:{userId}` | String (counter) | 5 min | Cached unread notification count |
| `analytics:{userId}` | String (JSON) | 1 hour | Serialized AnalyticsPayload |
| `sheet:public:{shareToken}` | String (JSON) | 24 hours | Public sheet + problems + solutions |
| `tags:{userId}` | Set | 1 hour | All tag names for autocomplete (SMEMBERS) |
| `rl:{userId}:{route}` | String | 60 sec | Rate limit counter (INCR + EXPIRE) |

```typescript
// Example: SRS queue operations
await redis.zadd(`srs:queue:${userId}`, dueUnix, scheduleId);
const dueIds = await redis.zrangebyscore(`srs:queue:${userId}`, 0, Date.now() / 1000);
await redis.zrem(`srs:queue:${userId}`, scheduleId);

// Example: Rate limiting (100 req/min per user)
const key = `rl:${userId}:POST:/api/problems`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60);
if (count > 100) throw new TooManyRequestsError();
```

---

### 12.4 Frontend Performance

| Concern | Solution | Detail |
|---|---|---|
| **Large problem lists** | TanStack Virtual | Renders only visible rows; tested to 50k rows at 60fps |
| **Initial page load** | React Server Components | Dashboard skeleton SSR, data streams in |
| **Code editor weight** | `next/dynamic` with `ssr:false` | Monaco (~4MB) only loads when SolutionModal opens |
| **Data caching** | TanStack Query v5 | `staleTime: 30s`, `gcTime: 5m`, optimistic updates on mutations |
| **Pagination** | Cursor-based (no OFFSET) | `?cursor={base64_last_id_ts}` eliminates deep-page slowness |
| **Chart loading** | Lazy + Suspense | Recharts dynamically imported; shows skeleton until loaded |
| **Tag autocomplete** | Debounced + Redis Set | 150ms debounce on input, Redis `SMEMBERS` return < 2ms |
| **Images / assets** | next/image + WebP | Auto-optimized, responsive srcsets |
| **JS bundle** | Route-level code splitting | Each dashboard tab is a separate JS chunk |
| **API response size** | Field projection | All list endpoints return only columns needed for the table; solutions fetched on detail open only |

#### Cursor Pagination Pattern (prevents OFFSET slowness at page 500+)

```typescript
// Encode cursor: last row's (created_at, id) pair
const cursor = Buffer.from(
  JSON.stringify({ created_at: lastRow.created_at, id: lastRow.id })
).toString("base64url");

// SQL using cursor (index-friendly)
WHERE (created_at, id) < (${cursorCreatedAt}, ${cursorId})
ORDER BY created_at DESC, id DESC
LIMIT ${limit}
```

---

### 12.5 Connection Pooling & Edge Deployment

#### PgBouncer / Neon Pooler config

```
pool_mode = transaction          # Best for Next.js serverless
max_client_conn = 1000           # Total incoming connections
default_pool_size = 20           # Connections to PG per pool
reserve_pool_size = 5
server_idle_timeout = 60
```

#### Drizzle connection singleton (prevent pool exhaustion in dev)

```typescript
// lib/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool);
```

#### Edge-cached public routes

`/s/[shareToken]` and `/u/[username]` use `export const revalidate = 3600` (ISR) — cached at the CDN edge, regenerated at most once per hour. Read-only public data never hits the origin DB on cache hit.

---

## 13. Security Checklist

| Category | Measure |
|---|---|
| **Passwords** | argon2id with `memoryCost: 65536, timeCost: 3` |
| **Sessions** | iron-session encrypted + signed cookie; `httpOnly`, `secure`, `sameSite: lax` |
| **CSRF** | SameSite cookie + origin check in middleware |
| **SQL Injection** | Drizzle ORM parameterized queries only; no raw SQL with user input |
| **XSS** | React auto-escapes; Monaco renders code safely; Markdown in `intuition` sanitized with `DOMPurify` before display |
| **Rate Limiting** | Redis-based: 100 req/min per user per route; 10 signup attempts/IP/hour |
| **Ownership Checks** | Every DB mutation verifies `user_id = session.userId` before proceeding |
| **Public Share Validation** | Setting sheet `is_public=true` validates ALL contained problems have `is_public=true` |
| **Secrets** | All env vars in `.env.local`; never committed; rotated quarterly |
| **Dependency Audit** | `pnpm audit` in CI; Dependabot enabled |
| **Headers** | `next.config.ts` sets: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` |

---

## 14. Additional Features Roadmap

These are high-value additions that extend the core platform:

| # | Feature | Description | Priority |
|---|---|---|---|
| 1 | **AI Hint System** | "Get a nudge" button on any unsolved problem → calls Claude API for a structured hint (approach direction, no full solution). Configurable hint verbosity. | 🔥 High |
| 2 | **LeetCode / Codeforces URL Auto-fill** | Paste a LeetCode problem URL → scrape problem name, difficulty, and tags via server-side scraper. Saves 90% of the add-problem friction. | 🔥 High |
| 3 | **Company Tags** | Tag problems with target companies (Google, Amazon, Meta, Apple, Netflix, Microsoft + 50 others). Filter by company on Problems tab. | 🔥 High |
| 4 | **Timed Interview Mode** | Start a 45-minute timed session on a problem. No solution hints, no external links, just editor + problem URL. Timer ends → solution modal auto-opens. | 🔥 High |
| 5 | **Code Execution (Sandboxed)** | "Run Code" button in solution modal via Judge0 API or Piston API. Shows stdout/stderr/verdict inline. No install required. | ⚡ Medium |
| 6 | **Browser Extension** | Chrome/Firefox extension: one-click "Add to CodeVault" from any LeetCode/HackerRank/Codeforces problem page. Auto-fills all fields. | ⚡ Medium |
| 7 | **GitHub Auto-Sync** | OAuth with GitHub → auto-commit solutions to a dedicated `codevault-solutions` repo on save. File name: `{problem-slug}/{language}/{solution-name}.{ext}`. | ⚡ Medium |
| 8 | **Collaborative Sheets** | Invite teammates to a sheet by username. Invited users get read access (and optionally write access). Useful for study groups. | ⚡ Medium |
| 9 | **Notes / Scratchpad** | Per-problem free-form markdown notepad separate from solutions. For "brain dump" before writing clean code. | ⚡ Medium |
| 10 | **Progress Export** | Export all problems + solutions as: PDF (formatted), CSV (metadata only), or JSON (full dump). Scheduled weekly email digest option. | ⚡ Medium |
| 11 | **Curated Built-in Sheets** | Pre-loaded sheets: Blind 75, NeetCode 150, Top Interview 150, Grind 169. Users can fork these to their own account. | ⚡ Medium |
| 12 | **Problem Pattern Tags** | Structured "pattern" taxonomy: Sliding Window, Two Pointers, BFS, DFS, Backtracking, DP, Greedy, etc. Separate from free-form topic tags. | ⚡ Medium |
| 13 | **Search Across Solution Code** | Full-text / trigram search (`pg_trgm`) across solution code bodies. "Find all my problems where I used a heap." | 🌱 Low |
| 14 | **Video Solution Links** | Attach a YouTube or Loom URL per solution. Renders as an embedded preview in the solution card. | 🌱 Low |
| 15 | **Daily Practice Reminders** | Push notification / email at a configurable time ("Remind me daily at 8pm to practice one problem"). Separate from SRS reminders. | 🌱 Low |
| 16 | **Streak Gamification & Badges** | Daily streak counter with flame emoji. Milestone badges: 7-day 🔥, 30-day 🏆, 100 problems 💯. Leaderboard among friends. | 🌱 Low |
| 17 | **Problem Similarity Engine** | After solving N problems, surface "problems similar to what you've seen" using tag + complexity overlap scoring. | 🌱 Low |
| 18 | **Offline Mode (PWA)** | Service Worker caches the last 50 problems + their solutions. View and write code offline; sync when reconnected. | 🌱 Low |
| 19 | **Bulk CSV Import** | Upload a CSV with columns: `name, url, difficulty, tags, status`. Batch-creates problems. Useful for migrating from spreadsheets. | 🌱 Low |
| 20 | **Native Mobile Apps** | React Native (Expo) apps for iOS and Android. Same backend, mobile-native editor via CodeMirror 6 (Monaco is too heavy for mobile). | 🌱 Low |

---

## 15. Git Commit Conventions

All commits follow **Conventional Commits v1.0**. Every logical change or completed feature produces its own commit.

### Format

```
<type>(<scope>): <short imperative description>

[optional body explaining WHY, not WHAT]
[optional BREAKING CHANGE: ...]
```

### Type Reference

| Type | When to use |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `chore` | Build, tooling, config change (no prod code change) |
| `refactor` | Code restructure with no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `ci` | CI/CD pipeline changes |
| `db` | Schema migrations or index changes |

### Examples

```bash
# Database
git add .
git commit -m "db: add partial index on srs_schedule for pending status"

# New feature
git add .
git commit -m "feat(problems): add Problem Detail Modal with solution list"

# SRS engine
git add .
git commit -m "feat(srs): init 4-interval schedule on first solution creation"

# Monaco integration
git add .
git commit -m "feat(editor): integrate Monaco Editor with dark/light theme sync"

# Onboarding
git add .
git commit -m "feat(onboarding): add default language selection modal on first login"

# Performance
git add .
git commit -m "perf(problems): replace OFFSET pagination with cursor-based strategy"

# Redis
git add .
git commit -m "feat(redis): implement SRS queue with sorted set + ZRANGEBYSCORE polling"

# Fix
git add .
git commit -m "fix(sheets): block is_public=true if any contained problem is private"

# Auth
git add .
git commit -m "feat(auth): implement iron-session with argon2id password hashing"

# Analytics
git add .
git commit -m "feat(analytics): add GitHub-style activity heatmap with 52-week view"
```

---

## 16. Notes Feature

### 16.1 Overview

Notes allow users to attach contextual annotations to **problems** or **individual solutions**. They are typed to communicate intent at a glance.

| Type | Badge color | Icon | Use case |
|---|---|---|---|
| `note` | Blue | 📝 | General observations, reminders, links |
| `warning` | Amber | ⚠️ | Edge cases, gotchas, off-by-one risks |
| `success` | Green | ✅ | Confirmed passing, accepted submission notes |
| `error` | Red | 🔴 | Known bugs, failing test cases, broken assumptions |

### 16.2 Scope

- **Problem-level notes** (`problem_id` set, `solution_id` null): Visible in the Problem Detail Modal under the **Problem Notes** panel.
- **Solution-level notes** (`solution_id` set, `problem_id` set): Visible inside the Solution Modal under the **Solution Notes** panel.

### 16.3 Sharing Behaviour

| Scenario | Visibility |
|---|---|
| Problem is private | Notes visible only to owner |
| Problem set to `is_public = true` | All attached notes with `is_public = true` become visible in the public problem/sheet view (read-only, no edit/delete controls) |
| Problem flipped back to private | `UPDATE notes SET is_public = false WHERE problem_id = $1` (trigger or API side-effect) |

> Notes are **never independently shareable** — their public state is always derived from the parent problem's `is_public` value.

### 16.4 `NoteCard` Component Spec

```tsx
// components/notes/NoteCard.tsx
type NoteType = "note" | "warning" | "success" | "error";

const NOTE_META: Record<NoteType, { icon: string; bgClass: string; borderClass: string }> = {
  note:    { icon: "📝", bgClass: "bg-blue-950/40",  borderClass: "border-blue-500" },
  warning: { icon: "⚠️", bgClass: "bg-amber-950/40", borderClass: "border-amber-500" },
  success: { icon: "✅", bgClass: "bg-green-950/40", borderClass: "border-green-500" },
  error:   { icon: "🔴", bgClass: "bg-red-950/40",   borderClass: "border-red-500" },
};
```

Each card shows:
- Type badge (icon + label) with colored left-border
- Markdown-rendered content (via `react-markdown` + `DOMPurify`)
- Timestamp: `dd-MON-yyyy HH:mm IST`
- Edit (✏) and Delete (🗑) buttons (hidden in public/read-only view)

### 16.5 DB Migration

```sql
CREATE TABLE notes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id   uuid        REFERENCES problems(id) ON DELETE CASCADE,
  solution_id  uuid        REFERENCES solutions(id) ON DELETE CASCADE,
  type         varchar(8)  NOT NULL CHECK (type IN ('note','warning','success','error')),
  content      text        NOT NULL,
  is_public    boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT note_has_parent CHECK (problem_id IS NOT NULL OR solution_id IS NOT NULL)
);

-- Index for fast problem-level fetch
CREATE INDEX idx_notes_problem ON notes(problem_id, created_at DESC);

-- Index for fast solution-level fetch
CREATE INDEX idx_notes_solution ON notes(solution_id, created_at DESC);

-- Index for public notes (used in public sheet payloads)
CREATE INDEX idx_notes_public ON notes(problem_id, created_at DESC)
  WHERE is_public = TRUE;
```

---

## 17. Timestamp & Timezone Convention

### 17.1 Rule

> **All timestamps displayed in the CodeVault UI and stored in application logs MUST use IST (UTC+5:30) in the format `dd-MON-yyyy HH:mm IST`.**  
> Examples: `05-JUN-2026 00:30 IST`, `03-JAN-2027 14:05 IST`

### 17.2 Storage vs Display

| Layer | Convention |
|---|---|
| **PostgreSQL** | All `timestamptz` columns store in **UTC** (default Postgres behaviour). Never store in IST. |
| **Upstash Redis** | All scores in sorted sets are **Unix seconds (UTC)**. |
| **API responses** | Return raw ISO 8601 UTC strings (`2026-06-05T00:30:00.000Z`). Never convert in the API. |
| **UI / display layer** | Convert UTC → IST using `date-fns-tz` and format to `dd-MON-yyyy HH:mm IST`. |

### 17.3 Utility Function

```typescript
// lib/utils/timestamps.ts
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const IST_TZ = "Asia/Kolkata";

/**
 * Formats a UTC date to: "05-JUN-2026 00:30 IST"
 */
export function formatIST(utcDate: Date | string): string {
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  const ist = toZonedTime(d, IST_TZ);
  return format(ist, "dd-MMM-yyyy HH:mm 'IST'").toUpperCase();
  // date-fns MMM = "Jun" → toUpperCase → "JUN"
}

/**
 * Formats a UTC date to date-only: "05-JUN-2026"
 * Used for SRS timeline node labels.
 */
export function formatISTDate(utcDate: Date | string): string {
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  const ist = toZonedTime(d, IST_TZ);
  return format(ist, "dd-MMM-yyyy").toUpperCase();
}
```

### 17.4 Where `formatIST` is Used

| Component / Context | Field(s) formatted |
|---|---|
| Problem Detail Modal header | `solved_at`, `created_at` |
| SRS Timeline node labels | `due_date` for each interval |
| Solution card in detail modal | `created_at`, `updated_at` |
| Note cards | `created_at` |
| Notification dropdown items | `created_at` |
| Public sheet / problem view | `solved_at`, solution `created_at` |
| Analytics snapshot tooltip | `snapshot_date` |

### 17.5 SRS Date Calculation (IST-aware)

When computing due dates, use **calendar-day arithmetic in IST** (not UTC-midnight):

```typescript
import { addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Compute SRS due date: solved_at + intervalDays, at IST midnight.
 */
export function computeDueDate(solvedAtUtc: Date, intervalDays: number): Date {
  const solvedIST = toZonedTime(solvedAtUtc, IST_TZ);
  const dueIST = addDays(solvedIST, intervalDays);
  // Set to midnight IST on due day
  dueIST.setHours(0, 0, 0, 0);
  return fromZonedTime(dueIST, IST_TZ);  // returns UTC Date for DB storage
}
```

---

## 18. Deployment — Vercel + Supabase + Upstash

### 18.1 Infrastructure Overview

```
┌──────────────────────────────────────────────────────────────┐
│  VERCEL (Hosting + Edge + CDN)                               │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  Next.js App    │  │  Edge Middleware │  │  ISR Cache  │  │
│  │  (Serverless    │  │  (Auth guard,   │  │  /s/:token  │  │
│  │   Functions)    │  │   Rate limit)   │  │  /u/:user   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌───────────────────────────────────┐                       │
│  │  Supabase (PostgreSQL 16)         │                       │
│  │  - Connection pooler (pgBouncer)  │                       │
│  │  - Row Level Security (RLS)       │                       │
│  │  - Drizzle ORM over HTTPS         │                       │
│  └───────────────────────────────────┘                       │
│                                                              │
│  ┌───────────────────────────────────┐                       │
│  │  Upstash Redis (Serverless)       │                       │
│  │  - HTTP API (REST, no TCP)        │                       │
│  │  - SRS sorted sets                │                       │
│  │  - Session / rate-limit counters  │                       │
│  │  - Public sheet cache             │                       │
│  └───────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

### 18.2 Why This Stack

| Concern | Solution | Reason |
|---|---|---|
| **No persistent connections** | Upstash HTTP Redis + Supabase pooler | Vercel serverless functions are stateless; `ioredis` TCP connections would exhaust pool on cold starts |
| **Zero-config scaling** | Vercel auto-scales functions | No EC2/GKE capacity planning needed |
| **CDN edge for public routes** | Vercel ISR + Edge Cache | `/s/:shareToken` and `/u/:username` served from edge, DB never hit on cache hit |
| **Managed Postgres** | Supabase | Built-in connection pooler, automated backups, PITR, SQL editor, Row Level Security |
| **Serverless Redis** | Upstash | Pay-per-request, zero idle cost, HTTP client works in any runtime (Edge included) |

### 18.3 Environment Variables

```env
# Supabase
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://[region].upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# iron-session
SESSION_SECRET=your-32-char-secret-minimum-length

# App
NEXT_PUBLIC_APP_URL=https://codevault.vercel.app
```

> **`DATABASE_URL`** uses the Supabase connection pooler (port `6543`) for serverless-safe connections.  
> **`DIRECT_URL`** uses the direct connection (port `5432`) for Drizzle migrations (`drizzle-kit push`).

### 18.4 Drizzle Config for Supabase

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL!,   // Direct URL for migrations
  },
});
```

### 18.5 Upstash Redis Client

```typescript
// lib/redis/client.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

> `@upstash/redis` is fully compatible with Vercel Edge Runtime. No `ioredis` or `node:net` dependency.

### 18.6 Vercel Project Config

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["bom1"],
  "env": {
    "TZ": "UTC"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options",           "value": "DENY" },
        { "key": "X-Content-Type-Options",     "value": "nosniff" },
        { "key": "Referrer-Policy",            "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",         "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

> Region `bom1` = Mumbai. Closest Vercel edge region to IST users. Supabase project should also be in `ap-south-1` (AWS Mumbai) to minimise latency.

### 18.7 Deployment Checklist

- [ ] Create Supabase project in `ap-south-1` (Mumbai)
- [ ] Run `drizzle-kit push` using `DIRECT_URL` to apply schema
- [ ] Create Upstash Redis database (region: `ap-south-1`)
- [ ] Set all env vars in Vercel project settings
- [ ] Add `bom1` to Vercel project regions
- [ ] Configure Vercel domain / custom domain DNS
- [ ] Enable Vercel Analytics + Speed Insights
- [ ] Set up Vercel deployment protection (preview branch password)
- [ ] Enable Supabase automated daily backups + PITR
- [ ] Run `pnpm audit` — no critical vulnerabilities

### 18.8 Git Commit Examples (New Features)

```bash
# Notes feature
git commit -m "feat(notes): add problem-level and solution-level notes with type badges"
git commit -m "db: add notes table with CHECK constraint and partial public index"

# SRS revisit
git commit -m "feat(srs): add post-30d revisit cycle with start/pause/end actions"
git commit -m "feat(srs-ui): add revisit timeline strip to ProblemDetailModal"

# Timestamps
git commit -m "chore(utils): add formatIST() and formatISTDate() for dd-MON-yyyy display"
git commit -m "feat(ui): apply IST timestamp formatting across all modals and cards"

# Deployment
git commit -m "chore(infra): migrate from ioredis to @upstash/redis for serverless compat"
git commit -m "chore(db): configure Supabase pooler URL + DIRECT_URL for Drizzle"
git commit -m "chore(vercel): add vercel.json with bom1 region and security headers"
```

---

*Document maintained alongside the codebase. Update this file when schema, API contracts, or architectural decisions change. Version it in Git alongside code.*
