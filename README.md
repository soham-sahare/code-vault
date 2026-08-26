# ⚡ CodeVault

> **Build your second brain for DSA and technical interview preparation. Solve, recall, master.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.7-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.3.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RLS_Enabled-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Database Schema & UML ER Diagram](#-database-schema--uml-er-diagram)
- [Spaced Repetition System (SRS) Engine](#-spaced-repetition-system-srs-engine)
- [Server Actions API Reference](#-server-actions-api-reference)
- [REST API Endpoints](#-rest-api-endpoints)
- [Row-Level Security (RLS) & Security Checklist](#-row-level-security-rls--security-checklist)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Environment Variables](#-environment-variables)
- [Attribution & Author](#-attribution--author)

---

## 🌟 Overview

Generic flashcard apps fail when applied to complex code. Mastering Data Structures & Algorithms (DSA) requires **relational context**:
- Intuition breakdown (why a specific approach works)
- Multiple solution implementations per problem (e.g. Brute Force $O(N^2)$ vs. Optimal Two-Pointer $O(N)$)
- Time & Space complexities
- Personal mistake logs & conceptual pitfalls
- Automated Spaced Repetition (SRS) scheduled in your active timezone (IST UTC+5:30)
- Curated Sheets, Company Tags, and Pattern tracking
- Public sharable sheets and profile portfolios

**CodeVault** is engineered from the ground up as a private, high-performance second brain for engineers preparing for competitive programming and technical interviews at top-tier companies.

---

## ✨ Key Features

- 🧠 **Multi-Stage Spaced Repetition (SRS)**: Automatically schedules reviews at 1, 3, 7, 14, and 30-day intervals. Supports recurring post-completion revisit cycles.
- 💻 **Multi-Solution Problem Vault**: Store multiple language approaches (Python, Java, C++, TypeScript, Go, Rust) per problem with syntax highlighting via Shiki and Prism.
- ⚡ **Server-Actions First**: 100% type-safe data layer using React Server Actions for instant client execution without REST overhead.
- 📊 **Real-Time Analytics & Streak Tracking**: Solved counts, topic mastery distributions, difficulty breakdowns, active recall calendar heatmap, and cached daily snapshots.
- 📚 **Curated Sheets & Drag-and-Drop Organization**: Group problems into custom practice sheets with custom ordering and shareable public links (`/sheet/:shareSlug`).
- 👤 **Public Portfolios & Live Username Search**: Optional public profiles (`/u/:username`) showcasing mastered problems and achievements, backed by $O(1)$ debounced live username uniqueness search.
- 🔒 **Enterprise-Grade Security**: PostgreSQL Row-Level Security (RLS) enabled across all 15 tables, Edge rate limiting (100 req/min per user), and secure HTTP-only NextAuth sessions.
- 🌓 **Dynamic Theme Engine**: Tailored dark mode (*Night Skin*) and light mode (*Sun Skin*) with smooth transitions and persistent preferences.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Next.js 16 Turbopack)"]
        UI["React 19 UI (Tailwind CSS v4 + Framer Motion)"]
        Forms["Debounced Reactive Forms & Live Username Checker"]
        Theme["Theme Engine (Night Skin / Sun Skin)"]
    end

    subgraph MiddlewareLayer["Edge Middleware (proxy.ts)"]
        AuthGuard["NextAuth v5 Session Verification"]
        RateLimiter["Upstash Redis Rate Limiting (100 req/min)"]
    end

    subgraph ServerLayer["Next.js Server Layer"]
        SA["React Server Actions (lib/actions.ts)"]
        Cron["Vercel Cron (/api/cron/srs-reminders)"]
        CheckUser["User Verification (/api/users/check-username)"]
        AuthRoute["NextAuth API (/api/auth/[...nextauth])"]
    end

    subgraph Database["PostgreSQL Database (Supabase)"]
        Prisma["Prisma ORM Client (v6.3.0)"]
        RLS["PostgreSQL Row-Level Security (15 Tables)"]
        Indices["Composite & Unique B-Tree Indices"]
    end

    UI -->|Direct Invocation| SA
    UI -->|Live Check / Cron| AuthGuard
    AuthGuard --> RateLimiter
    RateLimiter --> ServerLayer
    SA --> Prisma
    Cron --> Prisma
    CheckUser --> Prisma
    AuthRoute --> Prisma
    Prisma --> RLS
    RLS --> Indices
```

---

## 🗄️ Database Schema & UML ER Diagram

CodeVault uses PostgreSQL with Prisma ORM. All entities use pure UUID identifiers (`@default(uuid())`).

```mermaid
erDiagram
    User ||--o{ Problem : "owns"
    User ||--o{ Note : "writes"
    User ||--o{ Reminder : "receives"
    User ||--o{ Sheet : "creates"
    User ||--o{ SrsRevisitCycle : "tracks"
    User ||--o{ AnalyticsCache : "caches"
    User ||--o{ Notification : "gets"

    Problem ||--o{ Solution : "contains"
    Problem ||--o{ Note : "has"
    Problem ||--o{ Reminder : "schedules"
    Problem ||--o{ SheetProblem : "included_in"
    Problem ||--o{ ProblemCompany : "tagged_with"
    Problem ||--o{ ProblemPattern : "categorized_under"
    Problem ||--o{ SrsRevisitCycle : "cycles"

    Solution ||--o{ SolutionNote : "annotates"
    Sheet ||--o{ SheetProblem : "contains"
    CompanyTag ||--o{ ProblemCompany : "associates"
    Pattern ||--o{ ProblemPattern : "associates"

    User {
        String id PK "UUID"
        String email UK "Unique email"
        String username UK "Unique handle"
        String name "Display name"
        String passwordHash "Bcrypt hash"
        String defaultLanguage "Preferred language"
        Boolean isPublicProfile "Public profile flag"
        String theme "SYSTEM / DARK / LIGHT"
        DateTime createdAt "Timestamp"
    }

    Problem {
        String id PK "UUID"
        String userId FK "Owner UUID"
        Int num "Problem Number"
        String name "Title"
        String url "Source URL"
        String topic "Topic / Category"
        String difficulty "Easy / Medium / Hard"
        String status "Due Today / Solved / etc."
        String interval "Recall Stage"
        Boolean isFavorite "Starred flag"
        Boolean isPublic "Public visibility"
        DateTime solvedAt "First solved timestamp"
    }

    Solution {
        String id PK "UUID"
        String problemId FK "Problem UUID"
        String userId "Owner UUID"
        String name "Approach Name"
        String lang "Programming Language"
        String intuition "Mental model / insight"
        String approach "Algorithm steps"
        String code "Source Code"
        String time "Time Complexity O(N)"
        String space "Space Complexity O(1)"
        String[] tags "Sub-topics / techniques"
    }

    Reminder {
        String id PK "UUID"
        String problemId FK "Problem UUID"
        String userId FK "Owner UUID"
        DateTime dueDate "Due timestamp"
        String stage "Stage 1 to 5"
        Int cycle "SRS Cycle number"
        String status "PENDING / COMPLETED"
        DateTime completedAt "Completion timestamp"
    }

    Sheet {
        String id PK "UUID"
        String userId FK "Owner UUID"
        String name "Sheet Title"
        String description "Description"
        Boolean isPublic "Public share flag"
        String shareSlug UK "Unique share slug"
        Boolean isCurated "Curated sheet flag"
    }

    SheetProblem {
        String sheetId PK,FK "Sheet UUID"
        String problemId PK,FK "Problem UUID"
        Int order "Sort sequence index"
    }

    SrsRevisitCycle {
        String id PK "UUID"
        String problemId FK "Problem UUID"
        String userId FK "Owner UUID"
        Int cycleNumber "Cycle index"
        String status "active / paused / ended"
        DateTime startedAt "Start timestamp"
    }

    CompanyTag {
        String id PK "UUID"
        String name "Company Name"
        String slug UK "Company Slug"
        String logoUrl "Logo URL"
    }

    Pattern {
        String id PK "UUID"
        String name "Pattern Name"
        String slug UK "Pattern Slug"
        String parentTopic "Parent Topic"
    }
```

---

## 🔁 Spaced Repetition System (SRS) Engine

The SRS Engine operates on an exponential retention curve:

| Stage | Name | Interval Delta | Description |
| :--- | :--- | :--- | :--- |
| **Stage 1** | Immediate Recall | $+1\text{ day}$ | Initial concept review after first solve |
| **Stage 2** | Short-Term Consolidation | $+3\text{ days}$ | Reinforce intuition and syntax |
| **Stage 3** | Medium-Term Anchor | $+7\text{ days}$ | Test independent problem reconstruction |
| **Stage 4** | Long-Term Retention | $+14\text{ days}$ | Verify edge-case handling |
| **Stage 5** | Mastery | $+30\text{ days}$ | Permanent memory consolidation |

### Revisit Cycles
Once a problem completes **Stage 5**, it transitions to `Mastered`. Users can initiate an **SRS Revisit Cycle** anytime, which resumes a fresh interval loop to keep old algorithms permanently fresh.

---

## ⚡ Server Actions API Reference

All primary mutations and queries are implemented as **React Server Actions** in [`lib/actions.ts`](file:///Users/sohamsahare/Desktop/code-vault/lib/actions.ts):

### 1. Problems
| Action Function | Parameters | Description |
| :--- | :--- | :--- |
| `getUserProblems()` | `filters?: ProblemFilters` | Fetches full problem objects with solutions, notes, and tags |
| `getUserProblemSummaries()` | `filters?: ProblemFilters` | High-performance lightweight summary list for rapid UI rendering |
| `getProblemDetail(id)` | `problemId: string` | Fetches single problem with all nested relations |
| `createProblem(data)` | `CreateProblemInput` | Creates problem, initial solution, and schedules SRS Stage 1 |
| `updateProblem(id, data)` | `problemId, UpdateInput` | Updates problem metadata, topic, difficulty, or status |
| `deleteProblem(id)` | `problemId: string` | Cascading deletion of problem, solutions, notes, and reminders |
| `toggleProblemFavorite(id)` | `problemId: string` | Toggles starred state |
| `toggleProblemPublic(id)` | `problemId: string` | Toggles public visibility on `/problem/:slug` |

### 2. Solutions
| Action Function | Parameters | Description |
| :--- | :--- | :--- |
| `createSolution(data)` | `CreateSolutionInput` | Adds an additional approach/solution to a problem |
| `updateSolution(id, data)` | `solutionId, UpdateInput` | Updates code, complexity, intuition, or language |
| `deleteSolution(id)` | `solutionId: string` | Deletes a specific solution approach |

### 3. Notes & Annotations
| Action Function | Parameters | Description |
| :--- | :--- | :--- |
| `saveProblemNote(data)` | `problemId, text, isShared` | Saves or updates a mistake log / general note |
| `deleteNote(id)` | `noteId: string` | Deletes an annotation |
| `toggleNoteShare(id)` | `noteId: string` | Toggles public visibility of note on shared links |

### 4. Spaced Repetition (SRS)
| Action Function | Parameters | Description |
| :--- | :--- | :--- |
| `completeSrsItem(scheduleId)`| `scheduleId: string` | Advances current reminder to next stage or finishes cycle |
| `revisitProblem(problemId)` | `problemId: string` | Restarts a 30-day review cycle on a mastered problem |
| `pauseSrsCycle(cycleId)` | `cycleId: string` | Temporarily pauses interval countdowns |
| `resumeSrsCycle(cycleId)` | `cycleId: string` | Resumes active SRS countdown |

### 5. Sheets
| Action Function | Parameters | Description |
| :--- | :--- | :--- |
| `getUserSheets()` | `none` | Fetches all sheets owned by user with completion progress |
| `getSheetDetail(id)` | `sheetId: string` | Fetches full sheet problem list ordered by sequence index |
| `createSheet(data)` | `CreateSheetInput` | Creates a new practice sheet with unique shareSlug |
| `updateSheet(id, data)` | `sheetId, UpdateInput` | Updates sheet name, description, or visibility |
| `deleteSheet(id)` | `sheetId: string` | Deletes sheet |
| `addProblemToSheet(sheetId, problemId)` | `sheetId, problemId` | Appends a problem to a sheet |
| `removeProblemFromSheet(sheetId, problemId)` | `sheetId, problemId` | Removes a problem from a sheet |
| `reorderSheetProblems(sheetId, problemIds)` | `sheetId, string[]` | Updates problem display ordering via batch transaction |
| `getPublicSheetBySlug(slug)` | `shareSlug: string` | Public read access for shared sheets |

### 6. Analytics & User Settings
| Action Function | Parameters | Description |
| :--- | :--- | :--- |
| `getAnalyticsData()` | `none` | Aggregates user solve statistics, heatmaps, and streak data |
| `updateUserProfile(data)` | `name, username, lang, isPublic` | Updates settings with uniqueness validation |
| `checkUsernameAvailability(username)` | `username: string` | Case-insensitive $O(1)$ live search for username availability |
| `exportUserData()` | `none` | Exports complete user vault data into portable JSON |
| `importUserData(jsonData)` | `jsonData: object` | Imports and merges problems, solutions, and notes |
| `deleteUserAccount()` | `none` | Permanently purges user account and all relational data |

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Registers a new user with unique email and username validation | ❌ Public |
| `GET` | `/api/users/check-username` | Debounced live check for username uniqueness | ❌ Public |
| `GET` | `/api/cron/srs-reminders` | Vercel Cron Job to evaluate and queue daily SRS reminders | 🔐 Bearer Token (`CRON_SECRET`) |
| `*` | `/api/auth/[...nextauth]` | NextAuth.js session and token management | ❌ / 🔐 Built-in |

---

## 🔒 Row-Level Security (RLS) & Security Checklist

CodeVault enforces strict multi-layered security:

1. **PostgreSQL Row-Level Security (RLS)**:
   - Enabled across all 15 tables (`User`, `Problem`, `Solution`, `SolutionNote`, `Note`, `Reminder`, `SrsRevisitCycle`, `CompanyTag`, `ProblemCompany`, `Pattern`, `ProblemPattern`, `Notification`, `AnalyticsCache`, `Sheet`, `SheetProblem`).
   - Defined in [`prisma/enable_rls.sql`](file:///Users/sohamsahare/Desktop/code-vault/prisma/enable_rls.sql).
   - Automated migration runner in [`scripts/apply_rls.ts`](file:///Users/sohamsahare/Desktop/code-vault/scripts/apply_rls.ts) executed automatically on `npm run build` or manually via:
     ```bash
     npm run db:rls
     ```

2. **Edge Rate Limiting**:
   - Upstash Redis rate limiter protecting all `/api` routes at 100 requests/minute per user.

3. **Session Cookies**:
   - NextAuth JWT session cookies configured with `httpOnly: true`, `secure: true`, and `sameSite: "lax"`.

---

## 📁 Project Directory Structure

```
code-vault/
├── app/                        # Next.js 16 App Router
│   ├── analytics/              # Real-time analytics dashboard
│   ├── dashboard/              # Problem management & solution editor
│   ├── reminders/              # Spaced repetition queue & calendar
│   ├── settings/               # Profile, preferences, JSON backup/import
│   ├── sheets/                 # Curated problem sheets
│   ├── login/                  # Authentication login page
│   ├── signup/                 # Registration with live username validator
│   ├── forgot-password/        # Password reset request
│   ├── problem/[slug]/         # Public problem view
│   ├── sheet/[slug]/           # Public sheet view
│   ├── u/[username]/           # Public user profile portfolio
│   ├── api/                    # Essential HTTP route handlers
│   │   ├── auth/               # NextAuth & registration endpoints
│   │   ├── cron/               # Daily SRS cron runner
│   │   └── users/check-username# Live username search API
│   ├── layout.tsx              # Root HTML layout with fonts & theme provider
│   └── page.tsx                # Landing homepage
├── components/                 # Modular React UI Components
│   ├── landing/                # Header, Hero, Features, About, Footer
│   ├── shell/                  # App Sidebar, Navbar, Notifications
│   └── ui/                     # Cards, Modal Dialogs, Skeleton Loaders
├── lib/                        # Core Utilities & Server Logic
│   ├── actions.ts              # React Server Actions (Full data layer)
│   ├── prisma.ts               # Global Prisma Client instance
│   ├── srs.ts                  # Spaced repetition scheduling math
│   └── utils.ts                # Formatting, date calculations, helpers
├── prisma/                     # Database Configuration
│   ├── schema.prisma           # Prisma Schema with 15 models & indexes
│   └── enable_rls.sql          # PostgreSQL Row-Level Security migration
├── public/                     # Static assets & favicon SVGs
├── scripts/                    # Build & maintenance scripts
│   └── apply_rls.ts            # Idempotent RLS migration runner
├── proxy.ts                    # Edge middleware (Auth + Rate Limiting)
├── package.json                # Project dependencies & scripts
└── README.md                   # Comprehensive technical documentation
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** / **pnpm** / **yarn**
- **PostgreSQL Database** (e.g. Supabase, Neon, or local PostgreSQL)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/soham-sahare/code-vault.git
   cd code-vault
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` or create a `.env` file (see [Environment Variables](#-environment-variables) below).

4. **Initialize Database & Generate Prisma Client**:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:rls
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connections (PostgreSQL / Supabase)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth v5 Configuration
AUTH_SECRET="your-super-secret-auth-key"
NEXTAUTH_URL="http://localhost:3000"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Vercel Cron Security
CRON_SECRET="your-cron-secret-token"
```

---

## 👨‍💻 Attribution & Author

- **Author**: [Soham Sahare](https://sohamsahare.in)
- **GitHub**: [@soham-sahare](https://github.com/soham-sahare)
- **Repository**: [https://github.com/soham-sahare/code-vault](https://github.com/soham-sahare/code-vault)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://sohamsahare.in" target="_blank"><strong>sohamsahare</strong></a></p>
  <p>© 2026 CodeVault. All rights reserved.</p>
</div>
