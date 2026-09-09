# SUTRA — Backend Context (extracted from Sutra.docx)

This file is the single source of truth for all backend-relevant content from the SUTRA product/technical documentation. It exists so the backend can be built without re-extracting the `.docx`. Everything below that affects the backend (data, APIs, roles, AI logic, security, analytics) is captured here.

> Scope note: SUTRA = **Smart Unified Talent & Recruitment Alignment Platform** — an AI-enabled Academia–Industry platform that maps student skills to real industry competency requirements, analyzes skill gaps, recommends learning, verifies skills, and matches students to internships/jobs/projects/training. Only the backend is being built in this session. No frontend. The backend must run independently and expose REST APIs for later frontend integration.

---

## 1. User Roles (drives authentication + RBAC)

Five roles. Every protected API enforces role-based authorization.

| Role | Backend-relevant capabilities |
|------|-------------------------------|
| **Student** | Account/login, profile onboarding, maintain academic/technical/soft-skill/project/certification data, attempt assessments, view readiness & skill-gap reports, discover learning paths, search/apply to opportunities, track application status, maintain portfolio/resume, join mentorship/workshops, manage notifications/deadlines. |
| **Academician / Faculty** | Faculty profile, discover faculty internships & industrial training, explore FDPs/consultancy/research collaborations/guest lectures, connect with industry mentors, participate in collaborative projects/research proposals, maintain participation & completion records. |
| **Institution / College** | Manage student cohorts, create/monitor skill assessment campaigns, analyze department-wise skill gaps, track internship participation & placement progress, compare industry skill-demand trends, plan training interventions, generate placement-readiness dashboards/reports. |
| **Industry / Recruiter** | Company profile + verification, publish jobs/internships/apprenticeships/live projects, define required/preferred skills & proficiency, publish training programs/workshops/certifications, receive candidate recommendations, review/shortlist/update applicant status, create mentorship & collaborations, view skill-demand analytics & candidate pipeline. |
| **Administrator** | Governance of users/institutions/companies, company/institution verification, content moderation & opportunity quality checks, manage taxonomy/roles/skills/assessment bank, monitor platform-wide analytics & audit logs. |

---

## 2. Functional Modules (backend responsibilities)

### 2.1 Authentication & Role Management
- Secure signup/login with role-based access.
- Roles: student, faculty, institution, industry, admin.
- Profile completion status + onboarding workflow.
- Session/token based protected APIs.
- Optional email/phone verification.

### 2.2 Student Profile & Onboarding
- Personal info, academic details, branch, semester/year, graduation timeline.
- Technical skills, soft skills, experience, projects, certifications, achievements.
- Career goals, preferred roles, industries, work mode, locations.
- Resume, GitHub, LinkedIn, portfolio links.
- Profile completeness score.

### 2.3 AI / Voice-Assisted Onboarding
- Student describes skills/goals in natural language or voice.
- Speech-to-text generates a transcript.
- AI extracts structured profile fields from transcript.
- Extracted data merged into profile **after user confirmation**.
- Multilingual support (Hindi, English, Gujarati, other Indian languages) is a future phase.

### 2.4 Skill Assessment Engine
- Role-based questionnaires.
- Technical MCQs + coding/knowledge assessments.
- Soft-skill assessments.
- Aptitude tests.
- Difficulty levels: beginner, intermediate, advanced.
- Question bank, scoring, attempt history, assessment analytics.
- Convert assessment result → skill proficiency score.

### 2.5 Skill Taxonomy & Industry Competency Model
- Standardized skill names + aliases.
- Skill categories: technical, domain, tools, soft skills, communication, leadership, etc.
- Role-to-skill mapping.
- Required/preferred skill flags for industry requirements.
- Skill proficiency levels + weights.
- Synonym/normalization layer for consistent matching.

### 2.6 Skill Gap Analyzer
- Compare student's measured skills to target role's required competencies.
- Identify missing, weak, strong skills.
- Calculate gap severity.
- Connect high-priority gaps to learning recommendations.
- Provide explainable reasons.

### 2.7 Industry Opportunity Marketplace
- Types: internships, jobs, apprenticeships, live projects, industrial training, entry-level roles.
- Filters: role, skills, location, work mode, duration, stipend/salary, eligibility.
- Opportunity details, deadlines, application requirements.
- Industry verification badge.

### 2.8 Industry Learning Programs
- Training programs, certification courses, workshops, bootcamps, mentorship initiatives.
- Eligibility, duration, fee/stipend, schedule, completion criteria.
- Enrollment tracking.
- Completion/certificate record.

### 2.9 AI Recommendation & Matching Engine
- Student→opportunity matching.
- Student→learning-program matching.
- Student→mentor matching.
- Explainable compatibility score.
- Factors: skill, proficiency, career interest, education, location, work mode, eligibility.
- Recommendation ranking + filtering.

### 2.10 Application & Recruitment Tracking
- Apply, withdraw, application history.
- **Status flow: Applied → Under Review → Shortlisted → Interview → Selected/Rejected.**
- Recruiter notes and evaluation.
- Interview stage tracking.
- Notifications on status changes.

### 2.11 Digital Employability Portfolio
- Verified skills, certifications, projects, internships, achievements, assessments.
- Evidence/document upload.
- Verification status + issuer.
- Portfolio share view.
- AI-assisted resume generation.
- Placement-ready profile summary.

### 2.12 Institution Analytics
- Student skill distribution.
- Department-wise skill gaps.
- Industry readiness score.
- Internship participation.
- Placement funnel.
- Top demanded skills.
- Training impact before/after comparison.
- Downloadable reports.

### 2.13 Industry Analytics
- Applicant pipeline.
- Average skill compatibility.
- Top candidate skills.
- Skill supply vs demand.
- Opportunity performance.
- Training program participation.
- Recruitment outcome metrics.

### 2.14 Mentorship & Collaboration
- Mentor discovery.
- Mentorship requests.
- Availability slots.
- Industry workshops and guest lectures.
- Live project collaboration.
- Research collaboration.
- Faculty-industry consultancy.

### 2.15 Academician Opportunities
- Faculty internships.
- Industrial training.
- FDPs (Faculty Development Programs).
- Consultancy opportunities.
- Research collaborations.
- Guest lecture / subject-matter expert opportunities.

### 2.16 Notifications
- New matching opportunity alerts.
- Application status changes.
- Assessment reminders.
- Learning deadlines.
- Interview notifications.
- Mentorship requests.
- Program completion updates.

### 2.17 Document Management
- Resume, certificates, internship reports, assessment evidence, academic records.
- Metadata, verification status, access control.
- Secure upload and download.
- File type/size validation.
- Audit trail for sensitive documents.

---

## 3. Data Model (entities + important fields)

| Entity | Important Fields |
|--------|------------------|
| **User** | userId, role, email, phone, status, createdAt, lastLogin |
| **StudentProfile** | education, skills, softSkills, projects, certifications, goals, preferences, portfolio |
| **FacultyProfile** | institution, expertise, experience, interests, availability, collaboration preferences |
| **Institution** | institutionId, name, departments, verificationStatus, adminUsers |
| **Industry** | industryId, companyName, sector, location, verificationStatus, contact |
| **Skill** | skillId, canonicalName, category, aliases, proficiencyLevels |
| **Role** | roleId, title, category, mappedSkills |
| **Assessment** | assessmentId, role, skillSet, difficulty, questionIds |
| **AssessmentAttempt** | attemptId, userId, score, skillScores, startedAt, completedAt |
| **Opportunity** | type, title, companyId, requiredSkills, preferredSkills, eligibility, location, deadline |
| **LearningProgram** | type, title, provider, skillsCovered, duration, eligibility, certificate |
| **Application** | applicationId, applicantId, opportunityId, matchScore, status, timestamps |
| **PortfolioItem** | type, title, description, evidence, verificationStatus, issuer |
| **Mentorship** | mentorId, menteeId, topic, slots, status |
| **InternshipRecord** | studentId, companyId, startDate, endDate, mentor, progress, feedback |
| **Notification** | userId, type, title, message, readStatus, createdAt |
| **AnalyticsSnapshot** | scope, metrics, period, generatedAt |

### 3.1 Logical Relationships
```
User
 ├── StudentProfile / FacultyProfile / IndustryProfile
 ├── AssessmentAttempts
 ├── Applications
 ├── PortfolioItems
 ├── Notifications
 └── Mentorships

StudentProfile
 ├── Skills
 ├── Education
 ├── Projects
 ├── Certifications
 └── CareerGoals

Industry
 ├── Opportunities
 ├── LearningPrograms
 ├── Mentors
 └── CollaborationProjects

Opportunity
 ├── RequiredSkills
 ├── PreferredSkills
 └── Applications

Institution
 ├── Students
 ├── Assessments
 ├── Analytics
 └── IndustryCollaborations
```

---

## 4. Complete API Listing (from Sutra.docx Section 11)

These are the explicitly documented endpoints. They are the baseline contract; additional endpoints (e.g. faculty/institution/industry profiles, learning programs CRUD, mentorship, notifications, documents) will be needed to cover all modules and should follow the same conventions.

### 4.1 Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/me` | Get current profile |
| POST | `/api/auth/logout` | Logout / invalidate session |

### 4.2 Student & Profile
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/students/:id` | Get student profile |
| PUT | `/api/students/:id` | Update student profile |
| POST | `/api/students/:id/voice-profile` | Extract profile from voice/text |
| GET | `/api/students/:id/readiness` | Get readiness score |
| GET | `/api/students/:id/skill-gaps` | Get skill-gap report |

### 4.3 Assessments
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/assessments` | List assessments |
| GET | `/api/assessments/:id` | Get assessment |
| POST | `/api/assessments/:id/submit` | Submit attempt |
| GET | `/api/assessments/results/:attemptId` | Get result |

### 4.4 Opportunities & Applications
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/opportunities` | Create opportunity |
| GET | `/api/opportunities` | Search/filter opportunities |
| GET | `/api/opportunities/:id` | Opportunity details |
| PUT | `/api/opportunities/:id` | Edit opportunity |
| PATCH | `/api/opportunities/:id/status` | Publish/pause/close |
| POST | `/api/opportunities/:id/apply` | Apply |
| GET | `/api/applications/me` | Student applications |
| PATCH | `/api/applications/:id/status` | Recruiter updates status |

### 4.5 Intelligence
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/matching/opportunities` | Get ranked opportunities |
| POST | `/api/matching/candidates` | Get ranked candidates |
| POST | `/api/skill-gap/analyze` | Analyze skill gaps |
| POST | `/api/learning/recommend` | Generate learning recommendations |
| GET | `/api/analytics/skills` | Skill demand analytics |

---

## 5. AI / Intelligence Layer

AI is used for structured decision support, recommendation, profile extraction, and explainable skill alignment (not just a chatbot).

### 5.1 AI Components
| Component | Input | Output |
|-----------|-------|--------|
| Profile Extraction | Voice/text description | Structured student/faculty profile |
| Skill Normalization | Raw skill names | Canonical skill names |
| Skill Gap Analysis | Profile + target role | Missing/weak/strong competencies |
| Opportunity Matching | Profile + opportunity | Compatibility score + explanation |
| Learning Recommendation | Skill gaps + goal | Courses, projects, certifications, workshops |
| Career Guidance | Skills + interests + demand | Suggested roles and pathways |
| Resume Generation | Verified profile data | Structured resume content |
| Industry Demand Analysis | Opportunity requirements | Trending/high-demand skills |

### 5.2 Explainable Match Score (weighted model — weights configurable per opportunity type)
```
Match Score =
  35% Skill Compatibility
+ 20% Skill Proficiency
+ 15% Education / Eligibility
+ 10% Career Interest Alignment
+ 10% Experience / Project Relevance
+  5% Location / Work Mode
+  5% Certifications / Evidence

Final score = normalized value between 0 and 100.
```
- Weights are configurable. Different opportunity types can change weights.
  - Internship: education & learning potential can get higher weight.
  - Experienced entry-level role: relevant project/experience weight increased.

### 5.3 Skill Gap Logic (pseudocode)
```
For each required skill:
    required_level = opportunity.requiredSkill.level
    student_level  = student.skill.level
    gap = max(required_level - student_level, 0)

Aggregate gaps:
    Critical -> gap >= high threshold
    Moderate -> gap between medium/high
    Minor    -> small gap
    Met      -> student_level >= required_level

Then:
    rank gaps by (business importance × gap severity)
    map top gaps to learning resources
```

---

## 6. Matching Engine — Detailed Design (Section 15)

### 6.1 Matching Inputs
- Required skills and preferred skills.
- Skill proficiency level.
- Education and eligibility.
- Projects and relevant experience.
- Certifications.
- Career interests.
- Location and work mode.
- Availability and opportunity duration.
- Assessment-derived skill scores.

### 6.2 Matching Output
- Overall compatibility score.
- Matched skills.
- Missing skills.
- Strong evidence.
- Eligibility check.
- Recommended next action.
- Learning path if candidate is not yet ready.

### 6.3 Worked Example
```
Opportunity: Frontend Developer Intern
Required:  React - Advanced, JavaScript - Advanced, Git - Intermediate, Testing - Intermediate
Student:   React - Intermediate, JavaScript - Advanced, Git - Intermediate, Testing - Beginner

Result:
  Compatibility: 78%
  Strong:  JavaScript, Git
  Gaps:    React proficiency, Testing
  Recommendation: Complete Advanced React + Testing module, then re-assess for improved readiness.
```

---

## 7. Skill Ecosystem & Industry Demand (Section 16)

Long-term differentiator: a continuously improving skill graph. Each opportunity contributes required skills; aggregation identifies which skills/roles/competencies are in demand.
```
Industry Opportunities
   ↓ Required Skills
   ↓ Skill Demand Aggregation
   ↓ Role / Sector / Location Trends
   ↓ Institution Skill-Gap Comparison
   ↓ Recommended Training
   ↓ Student Skill Improvement
   ↓ Better Matching Outcomes
```

---

## 8. Analytics & KPIs (Section 17) — drives analytics endpoints/aggregations

| Area | Metrics |
|------|---------|
| Student | Readiness score, skill-gap %, assessment score, learning completion, applications, shortlist rate |
| Industry | Applicants, qualified applicants, shortlist rate, time-to-shortlist, skill demand, hiring outcomes |
| Institution | Assessment coverage, average readiness, skill gaps, internship rate, placement rate, training impact |
| Learning | Enrollments, completion rate, assessment improvement, certification completion |
| Platform | Active users, active companies, opportunities, successful matches, successful placements |
| Collaboration | Mentorships, workshops, live projects, research collaborations, faculty programs |

### Dashboard data requirements (Section 12) — what analytics endpoints must return
- **Student**: industry readiness score, profile completion %, top strengths + critical gaps, recommended internships/jobs, recommended learning programs, upcoming assessments/deadlines, application pipeline, portfolio verification summary.
- **Industry**: active opportunities, applications received, shortlisted candidates, avg compatibility score, top candidate skills, recruitment funnel, training program participation, skill demand insights.
- **Institution**: total students assessed, placement readiness distribution, department-wise skill gaps, top industry-demand skills, internship participation, placement funnel, training completion/improvement, industry collaboration count.
- **Faculty**: recommended faculty opportunities, FDPs/industrial training, mentorship requests, research/consultancy opportunities, collaboration history.

---

## 9. Notification Matrix (Section 18)

Which roles receive which notification (✓ = yes, Optional = configurable).

| Event | Student | Industry | Institution | Faculty |
|-------|:-------:|:--------:|:-----------:|:-------:|
| New matching opportunity | ✓ | — | Optional | — |
| Application status change | ✓ | ✓ | Optional | — |
| Assessment reminder | ✓ | — | ✓ | Optional |
| Skill-gap report ready | ✓ | — | ✓ | Optional |
| Training recommendation | ✓ | — | ✓ | ✓ |
| Mentorship request | ✓ | ✓ | — | ✓ |
| Program completion | ✓ | ✓ | ✓ | ✓ |

> Note: the doc's matrix columns are slightly sparse; the safe backend interpretation is captured above. Delivery channels: in-app (baseline); email optional.

---

## 10. Verification & Trust Framework (Section 13)

- Company verification before publishing high-impact opportunities.
- Institution verification before accessing institutional analytics.
- Certificate verification metadata: issuer, credential ID, issue date, expiry (if applicable).
- Skill evidence: assessment score, project evidence, certification, or institution verification.
- Internship completion: company mentor feedback + institution acknowledgement.
- Badges must clearly state what has been verified and by whom.

---

## 11. Security & Privacy (Section 14) — backend requirements

- Role-based authorization on **every** protected API.
- Least-privilege access to student/faculty/recruiter/institution data.
- HTTPS for all production communication.
- Passwords never stored plain text; managed auth or strong hashing.
- Sensitive documents in private buckets/collections with signed/authorized access.
- Input validation + file-type/size validation.
- Rate limiting on authentication, assessment submission, and AI endpoints.
- Audit logs for sensitive actions (verification, application status changes, document access).
- AI prompts should avoid unnecessary exposure of sensitive personal info.
- Data retention & deletion policies defined before production.
- Consent collected where voice recordings or sensitive documents are processed.

---

## 12. Non-Functional Requirements (Section 19)

| Requirement | Target / Principle |
|-------------|--------------------|
| Performance | Common API requests target sub-second to low-second responses (excluding long AI jobs). |
| Scalability | Stateless API design, horizontally scalable services. |
| Availability | Production services designed for high availability. |
| Security | Role-based authorization, encrypted transport, secure document access. |
| Maintainability | Modular services, validation layer, reusable components, clear API contracts. |
| Accessibility | (frontend concern — keyboard-friendly, contrast, semantic, responsive) |
| Localization | Architecture allows Indian languages and localized content. |
| Observability | Structured logs, error tracking, metrics, audit events. |

---

## 13. Recommended Technology Stack (Section 10.1) — backend-relevant

| Layer | Recommended | Purpose |
|-------|-------------|---------|
| Backend | Node.js + Express | REST APIs and business logic |
| Database | Cloud Firestore or PostgreSQL | Profiles, opportunities, applications, analytics |
| Authentication | Firebase Auth / JWT | Secure identity + role-based access |
| AI | Gemini / OpenRouter / compatible LLM | Extraction, explanations, recommendations, learning paths |
| Speech | Speech-to-text provider | Voice onboarding |
| File Storage | Cloud Storage / S3-compatible | Certificates, resumes, reports |
| Deployment | Cloud backend | API deployment |
| Monitoring | App logs + error tracking | Reliability + debugging |

> Frontend layers (React + Vite, Tailwind, React Native, Recharts, Vercel) are out of scope but noted so API design stays compatible.

---

## 14. System Architecture (Section 10) — logical layers

```
SUTRA UI (Web/Mobile)              [out of scope — future frontend]
        │  HTTPS / REST / WS
API / Backend Layer                [THIS BUILD]
  Auth • Profiles • Jobs • Assessments • Applications • Learning • Analytics
        ├── Data Layer:          Users, Skills, Opportunities, Applications, Portfolio
        └── Intelligence Layer:  Matching, Skill Gap, Recommendations, AI Extraction, Analytics
              ├── Database (Primary DB)
              └── AI / ML Providers
```

---

## 15. MVP Scope (Section 20)

Recommended MVP (hackathon-controlled scope):
- Role-based authentication.
- Student onboarding and digital profile.
- Skill taxonomy and role-skill mapping.
- Skill assessment with scoring.
- Industry opportunity creation.
- AI-based student ↔ opportunity matching.
- Skill-gap analysis with explanations.
- Personalized learning recommendations.
- Application and status tracking.
- Digital portfolio with certificates/projects.
- Industry dashboard.
- Institution dashboard with skill-gap and placement-readiness analytics.
- Basic notifications.

---

## 16. Key End-to-End Flows (backend orchestration reference)

**Student Skill-to-Placement:** Registration → Profile Onboarding → Skill Assessment → Skill Profile + Readiness Score → Target Role Selection → Industry Requirement Mapping → Skill Gap Analysis → Personalized Learning Path → Learning/Certification/Project → Skill Verification → Updated Portfolio → Internship/Job Recommendations → Application → Recruiter Screening → Interview → Selection → Internship/Placement → Outcome & Portfolio Update.

**Industry:** Company Registration → Verification → Company Profile → Create Opportunity → Define Required + Preferred Skills → Publish → AI Candidate Matching → Recommended Candidate Pool → Application Review → Shortlist → Interview → Select → Track Outcome.

**Institution:** Institution Registration → Student/Cohort Onboarding → Assessment Campaign → Skill Analytics → Department/Batch Skill Gaps → Industry Demand Comparison → Training Intervention → Re-assessment → Readiness Improvement → Internship/Placement Tracking → Institutional Report.
