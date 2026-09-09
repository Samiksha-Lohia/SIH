# SUTRA — Backend Implementation Plan

Backend-only build for the SUTRA (Smart Unified Talent & Recruitment Alignment Platform) project. No frontend is created in this effort. The backend must run and be testable entirely on its own, exposing REST APIs that a frontend can integrate with later.

---

## Guiding Principles (applied across the whole build)

- **Frontend-agnostic**: backend exposes clean REST APIs only. No SSR, no coupling to any UI. Every response uses a consistent JSON envelope (`{ success, data, error, meta }`) so any frontend can consume it later.
- **Independently runnable**: backend boots, connects to its DB/external services, and serves requests on its own. No build or runtime dependency on a frontend.
- **Easy future integration**: CORS configured, stateless JWT auth, DTO/request validation, and auto-generated OpenAPI/Swagger docs so frontend devs get a live contract.
- **Modular structure**: each domain (auth, profiles, skills, opportunities, etc.) is its own module with routes -> controller -> service -> model, so batches stay isolated and testable.
- **External services allowed**: managed DB, storage, auth, AI, etc. are fine. Backend depends only on these external providers, never on a frontend.

---

## Proposed Folder Structure (inside `backend/`)

```
backend/
  src/
    config/          # env loading, db connection, constants
    middleware/      # auth, rbac, validation, error handler, rate limit
    modules/
      auth/
      users/
      profiles/
      skills/          # taxonomy + roles
      assessments/
      skill-gap/
      opportunities/
      learning/
      matching/
      applications/
      portfolio/
      documents/
      analytics/
      mentorship/
      notifications/
    utils/           # response envelope, logger, helpers
    app.js           # express app wiring
    server.js        # bootstrap/entry
  tests/
  .env.example
  package.json
```

---

## Implementation Batches

Each batch groups a few related tasks. Batches are ordered so later work builds on earlier work.

### Batch 0 — Foundation & Scaffolding
- Init project (package.json, dependencies), folder skeleton, env config loader
- DB connection + health-check endpoint (`GET /api/health`)
- Global error handler, request logger, standard response envelope, CORS, base validation setup

### Batch 1 — Authentication & RBAC
- User model (roles: student, faculty, institution, industry, admin)
- Register / login / me / logout, password hashing, JWT issue/verify
- Role-based access middleware + `/api/auth/*` endpoints

### Batch 2 — Profiles & Onboarding
- Student, faculty, institution, industry profile models + CRUD
- Profile completeness score, onboarding status
- `/api/students/*` and related profile endpoints

### Batch 3 — Skill Taxonomy & Roles
- Skill entity (canonical name, aliases, category, proficiency levels), Role entity, role -> skill mapping
- Synonym/normalization layer, admin seed endpoints/scripts

### Batch 4 — Assessment Engine
- Assessment + question bank + attempt models
- Submit attempt, scoring, convert score -> skill proficiency, attempt history
- `/api/assessments/*`

### Batch 5 — Skill-Gap Analyzer & Readiness
- Gap logic (missing/weak/strong, severity), readiness score
- Explainable output; `/api/students/:id/skill-gaps`, `/readiness`

### Batch 6 — Opportunities & Learning Programs
- Opportunity CRUD + filters + publish/pause/close, verification flag
- Learning programs CRUD + enrollment/completion tracking

### Batch 7 — Matching & Recommendation Engine
- Weighted match score (configurable weights per opportunity type) + explainability
- Student <-> opportunity, student <-> learning, student <-> mentor ranking
- Learning recommendations from gaps; `/api/matching/*`, `/api/learning/recommend`

### Batch 8 — Applications & Recruitment Tracking
- Apply/withdraw, status flow (Applied -> Under Review -> Shortlisted -> Interview -> Selected/Rejected), recruiter notes, interview stages
- `/api/applications/*`

### Batch 9 — Portfolio & Document Management
- Portfolio items + verification status/issuer, evidence uploads
- Document metadata, access control, file type/size validation, AI-assisted resume generation

### Batch 10 — Analytics
- Institution analytics (skill distribution, dept gaps, placement funnel, readiness)
- Industry analytics (applicant pipeline, compatibility, demand vs supply)

### Batch 11 — Mentorship, Collaboration & Academician Opportunities
- Mentor discovery, requests, slots; workshops, live/research projects
- Faculty internships, FDPs, consultancy

### Batch 12 — Notifications
- Notification model + triggers per the doc's notification matrix (in-app; optional email)

### Batch 13 — Hardening & Docs
- Rate limiting, audit logs, security review, input validation pass
- OpenAPI/Swagger spec, seed data for demo, basic tests

> Note: The AI/voice features (profile extraction, matching explanations, learning recommendations, resume generation, speech-to-text) are woven into Batches 2, 7, and 9 rather than being a separate batch, so each feature ships together with its API.

---

## Decisions Needed (external services & stack)

Choose one per item, or say "use sensible defaults".

1. **Runtime & framework** (doc recommends Node.js + Express)
   - Express (simple, matches the doc)
   - NestJS (structured/opinionated, good for large modular apps)
   - Fastify (fast, lighter)

2. **Database** (doc suggests Firestore or PostgreSQL)
   - PostgreSQL + Prisma ORM (relational, strong for these entity relationships)
   - MongoDB + Mongoose (flexible/document-based)
   - Firestore (managed, matches the Firebase suggestion)

3. **Authentication**
   - Self-managed JWT (full control, no vendor lock-in)
   - Firebase Auth
   - Auth0 / Clerk

4. **File/object storage** (certificates, resumes, evidence)
   - AWS S3 / Cloudinary / Firebase Cloud Storage / Supabase Storage

5. **AI / LLM provider** (profile extraction, match explanations, learning recs, resume gen)
   - Google Gemini / OpenAI / OpenRouter / Anthropic Claude

6. **Speech-to-text** (voice onboarding; can be deferred to a later batch)
   - OpenAI Whisper / Google STT / AssemblyAI / Deepgram

7. **Email/notification delivery** (real emails now, or in-app only for MVP)
   - Resend / SendGrid / AWS SES / SMTP via Nodemailer

### Open questions
- For the MVP, do you want **all 13 batches**, or stop at the doc's recommended MVP scope (roughly Batches 0-10, deferring mentorship/collaboration)?
- Should notifications be **in-app only** for now, or should real email delivery be wired up too?

---

## Confirmed Decisions (sensible defaults — locked for this build)

The user will supply real API keys after all tasks are complete, so every external integration is built to **run without keys** via graceful fallbacks (no crash, degraded-but-functional behavior).

1. **Runtime & framework**: Node.js + **Express** (ES modules). Matches the doc; simplest to integrate with any frontend.
2. **Database**: **MongoDB + Mongoose**. Document-shaped profiles (nested skills/projects/certifications) map cleanly; single connection string via MongoDB Atlas (external provider). Aligns with the doc's Firestore (document DB) leaning.
3. **Authentication**: **Self-managed JWT** (`jsonwebtoken` + `bcryptjs`). No vendor lock-in; backend authenticates fully on its own.
4. **File/object storage**: **Storage abstraction** with a **Cloudinary** provider + **local-disk fallback** for dev (so uploads work without keys).
5. **AI / LLM**: **Google Gemini** (`@google/generative-ai`) behind an AI-service interface + **deterministic rule-based fallback** (keyword extraction, templated resume, rule-based explanations) so AI features work without a key.
6. **Speech-to-text**: Deferred (future phase). `/voice-profile` accepts a **text transcript** now; STT provider is pluggable later.
7. **Email/notifications**: **In-app notifications** are the baseline. Email delivery is abstracted and **no-op/logged** without keys.

**Scope**: Building the full set (Batches 0-13), MVP-critical modules first.

## Plan Verification (checked against CONTEXT.md)

- All **17 functional modules** (CONTEXT.md 2.1-2.17) are mapped to a batch. AI/voice onboarding (2.3) is woven into Batches 2/7; resume generation (2.11) into Batch 9.
- All **26 documented endpoints** (CONTEXT.md Section 4) are covered; inferred endpoints for modules without explicit docs (faculty/institution/industry profiles, learning CRUD, portfolio, documents, mentorship, notifications, analytics) are added under the same conventions.
- **Data model** (17 entities) maps across Batches 1-12.
- Cross-cutting requirements (RBAC, verification/trust, security/privacy, NFRs, audit logs) are covered in the relevant batches + Batch 13.
- Verdict: plan is complete and consistent with the documentation.

## Status

- [x] `backend/` folder created
- [x] External service choices confirmed (sensible defaults above)
- [x] Plan verified against CONTEXT.md
- [x] Batch 0 — Foundation & scaffolding
- [x] Batch 1 — Authentication & RBAC
- [x] Batch 2 — Profiles & onboarding (+ AI voice extraction)
- [x] Batch 3 — Skill taxonomy & roles (+ seed)
- [x] Batch 4 — Assessment engine
- [x] Batch 5 — Skill-gap analyzer & readiness
- [x] Batch 6 — Opportunities & learning programs
- [x] Batch 7 — Matching & recommendation engine
- [x] Batch 8 — Applications & recruitment tracking
- [x] Batch 9 — Portfolio & document management (+ storage abstraction)
- [x] Batch 10 — Analytics
- [x] Batch 11 — Mentorship & academician opportunities
- [x] Batch 12 — Notifications (+ email fallback)
- [x] Batch 13 — Hardening & docs (audit log, OpenAPI/Swagger, demo seed, tests)

## How to run

1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and set `MONGODB_URI` (MongoDB Atlas). Optionally add `GEMINI_API_KEY`, `CLOUDINARY_*`, SMTP — all optional (graceful fallbacks otherwise).
3. Seed taxonomy: `npm run seed` (or `npm run seed:demo` for demo users + sample data).
4. Start: `npm start` (or `npm run dev`).
5. API docs: `http://localhost:5000/api/docs` — health: `/api/health`.
6. Tests: `npm test` (pure-logic unit tests, no DB needed).

Note: with an Atlas URI set, ensure your current IP is whitelisted in the Atlas Network Access settings, otherwise DB-backed routes return 503 while the server still boots.
