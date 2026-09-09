# SUTRA Backend — API Test Report

Generated: 2026-08-31T16:56:07.523Z

Environment: MongoDB Atlas connected, AI = Gemini (`configured`), Storage = Cloudinary, Email = disabled (intentional).

**Total: 115 | Passed: 115 | Failed: 0**

## Notable runtime observations

- Voice profile extraction source: `gemini` (gemini = live AI, fallback = rule-based)
- Resume generation source: `gemini`
- Skill normalization matched-to-canonical count (js/nodejs/golang): 3 / 3
- Assessment attempt score: 50%
- Application match score: 90%
- Opportunity match recommendations returned: 3
- Published opportunity verification badge: true
- Document storage provider: `cloudinary`
- Notifications generated for student: 3
- Audit log entries visible to admin: 22

## Health

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/health` | public | 200 | 200 | PASS |  |
| GET | `/api/docs.json` | public | 200 | 200 | PASS | OpenAPI spec |

## Auth

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| POST | `/api/auth/register` | public | 201 | 201 | PASS | register new student |
| POST | `/api/auth/register` | public | 422 | 422 | PASS | invalid body -> validation |
| POST | `/api/auth/login` | public | 401 | 401 | PASS | wrong password |
| POST | `/api/auth/login` | student | 200 | 200 | PASS | login student |
| POST | `/api/auth/login` | faculty | 200 | 200 | PASS | login faculty |
| POST | `/api/auth/login` | institution | 200 | 200 | PASS | login institution |
| POST | `/api/auth/login` | industry | 200 | 200 | PASS | login industry |
| POST | `/api/auth/login` | admin | 200 | 200 | PASS | login admin |
| GET | `/api/auth/me` | student | 200 | 200 | PASS |  |
| POST | `/api/auth/refresh` | student | 200 | 200 | PASS |  |
| POST | `/api/auth/logout` | student | 200 | 200 | PASS |  |
| GET | `/api/auth/me` | public | 401 | 401 | PASS | no token -> 401 |

## Profiles

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/profiles/me` | student | 200 | 200 | PASS |  |
| GET | `/api/students/6a95a9a680f3366633179c85` | student | 200 | 200 | PASS |  |
| PUT | `/api/students/6a95a9a680f3366633179c85` | student | 200 | 200 | PASS | update profile |
| POST | `/api/students/6a95a9a680f3366633179c85/voice-profile` | student | 200 | 200 | PASS | AI voice extraction |
| GET | `/api/faculty/6a95a9a680f3366633179c87` | faculty | 200 | 200 | PASS |  |
| PUT | `/api/faculty/6a95a9a680f3366633179c87` | faculty | 200 | 200 | PASS |  |
| GET | `/api/institutions/6a95a9a680f3366633179c86` | institution | 200 | 200 | PASS |  |
| PUT | `/api/institutions/6a95a9a680f3366633179c86` | institution | 200 | 200 | PASS | name required on first create |
| GET | `/api/industries/6a95a9a680f3366633179c88` | industry | 200 | 200 | PASS |  |
| PUT | `/api/industries/6a95a9a680f3366633179c88` | industry | 200 | 200 | PASS |  |

## Skills & Roles

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/skills` | student | 200 | 200 | PASS |  |
| GET | `/api/skills/6a95a9a310dddad2ef492755` | student | 200 | 200 | PASS |  |
| POST | `/api/skills/normalize` | student | 200 | 200 | PASS | alias->canonical |
| POST | `/api/skills` | admin | 201 | 201 | PASS |  |
| PUT | `/api/skills/6a95b1fc6df7f5d9703b41be` | admin | 200 | 200 | PASS |  |
| POST | `/api/skills` | student | 403 | 403 | PASS | RBAC: student blocked |
| DELETE | `/api/skills/6a95b1fc6df7f5d9703b41be` | admin | 200 | 200 | PASS |  |
| GET | `/api/roles` | student | 200 | 200 | PASS |  |
| GET | `/api/roles/6a95a9a510dddad2ef492764` | student | 200 | 200 | PASS |  |
| POST | `/api/roles` | admin | 201 | 201 | PASS |  |
| PUT | `/api/roles/6a95b1fe6df7f5d9703b41cd` | admin | 200 | 200 | PASS |  |
| DELETE | `/api/roles/6a95b1fe6df7f5d9703b41cd` | admin | 200 | 200 | PASS |  |

## Assessments

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/assessments` | student | 200 | 200 | PASS |  |
| GET | `/api/assessments/6a95a9a880f3366633179c98` | student | 200 | 200 | PASS | answers hidden |
| POST | `/api/assessments/questions` | admin | 201 | 201 | PASS |  |
| GET | `/api/assessments/questions` | admin | 200 | 200 | PASS |  |
| POST | `/api/assessments/6a95a9a880f3366633179c98/submit` | student | 201 | 201 | PASS | submit + score |
| GET | `/api/assessments/results/6a95b2016df7f5d9703b41e3` | student | 200 | 200 | PASS |  |
| GET | `/api/assessments/attempts/me` | student | 200 | 200 | PASS |  |
| POST | `/api/assessments` | admin | 201 | 201 | PASS |  |
| PUT | `/api/assessments/6a95b2026df7f5d9703b41ef` | admin | 200 | 200 | PASS |  |
| DELETE | `/api/assessments/6a95b2026df7f5d9703b41ef` | admin | 200 | 200 | PASS |  |

## Skill Gap

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/students/6a95a9a680f3366633179c85/skill-gaps?role=Frontend%20Developer` | student | 200 | 200 | PASS |  |
| GET | `/api/students/6a95a9a680f3366633179c85/readiness?role=Frontend%20Developer` | student | 200 | 200 | PASS |  |
| POST | `/api/skill-gap/analyze` | student | 200 | 200 | PASS |  |

## Opportunities

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/opportunities` | student | 200 | 200 | PASS |  |
| POST | `/api/opportunities` | industry | 201 | 201 | PASS |  |
| GET | `/api/opportunities/6a95b2056df7f5d9703b4204` | student | 200 | 200 | PASS |  |
| PUT | `/api/opportunities/6a95b2056df7f5d9703b4204` | industry | 200 | 200 | PASS |  |
| PATCH | `/api/opportunities/6a95b2056df7f5d9703b4204/status` | industry | 200 | 200 | PASS | verified company can publish |
| POST | `/api/opportunities` | industry | 201 | 201 | PASS |  |
| DELETE | `/api/opportunities/6a95b2076df7f5d9703b4211` | industry | 200 | 200 | PASS |  |

## Learning

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/learning` | student | 200 | 200 | PASS |  |
| POST | `/api/learning` | industry | 201 | 201 | PASS |  |
| GET | `/api/learning/6a95b2086df7f5d9703b421a` | student | 200 | 200 | PASS |  |
| PUT | `/api/learning/6a95b2086df7f5d9703b421a` | industry | 200 | 200 | PASS |  |
| POST | `/api/learning/6a95b2086df7f5d9703b421a/enroll` | student | 201 | 201 | PASS |  |
| PATCH | `/api/learning/6a95b2086df7f5d9703b421a/progress` | student | 200 | 200 | PASS |  |
| POST | `/api/learning/6a95b2086df7f5d9703b421a/complete` | student | 200 | 200 | PASS | triggers PROGRAM_COMPLETION notification |
| GET | `/api/learning/me/enrollments` | student | 200 | 200 | PASS |  |
| POST | `/api/learning/recommend` | student | 200 | 200 | PASS | gap-based recommendations |

## Matching

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| POST | `/api/matching/opportunities` | student | 200 | 200 | PASS |  |
| POST | `/api/matching/candidates` | industry | 200 | 200 | PASS |  |

## Applications

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| POST | `/api/opportunities/6a95b2056df7f5d9703b4204/apply` | student | 201 | 201 | PASS |  |
| GET | `/api/applications/me` | student | 200 | 200 | PASS |  |
| GET | `/api/applications/6a95b20c6df7f5d9703b423e` | student | 200 | 200 | PASS |  |
| GET | `/api/applications/opportunity/6a95b2056df7f5d9703b4204` | industry | 200 | 200 | PASS |  |
| PATCH | `/api/applications/6a95b20c6df7f5d9703b423e/status` | industry | 200 | 200 | PASS | triggers notification+audit |
| POST | `/api/applications/6a95b20c6df7f5d9703b423e/notes` | industry | 201 | 201 | PASS |  |
| POST | `/api/applications/6a95b20c6df7f5d9703b423e/interviews` | industry | 201 | 201 | PASS |  |
| PATCH | `/api/applications/6a95b20c6df7f5d9703b423e/interviews/6a95b20f6df7f5d9703b425d` | industry | 200 | 200 | PASS |  |
| POST | `/api/applications/6a95b20c6df7f5d9703b423e/withdraw` | student | 200 | 200 | PASS |  |

## Portfolio

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| POST | `/api/portfolio` | student | 201 | 201 | PASS |  |
| GET | `/api/portfolio/me` | student | 200 | 200 | PASS | list my items |
| GET | `/api/portfolio/6a95b2106df7f5d9703b426a` | student | 200 | 200 | PASS |  |
| PUT | `/api/portfolio/6a95b2106df7f5d9703b426a` | student | 200 | 200 | PASS |  |
| PATCH | `/api/portfolio/6a95b2106df7f5d9703b426a/verify` | institution | 200 | 200 | PASS | verifier + audit |
| GET | `/api/portfolio/share/6a95a9a680f3366633179c85` | public | 200 | 200 | PASS | public share view |
| POST | `/api/portfolio/resume` | student | 200 | 200 | PASS | AI resume gen |
| DELETE | `/api/portfolio/6a95b2106df7f5d9703b426a` | student | 200 | 200 | PASS |  |

## Documents

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| POST | `/api/documents` | student | 201 | 201 | PASS | upload -> Cloudinary |
| GET | `/api/documents/me` | student | 200 | 200 | PASS |  |
| GET | `/api/documents/6a95b21b6df7f5d9703b4284` | student | 200 | 200 | PASS |  |
| PATCH | `/api/documents/6a95b21b6df7f5d9703b4284/verify` | institution | 200 | 200 | PASS |  |
| DELETE | `/api/documents/6a95b21b6df7f5d9703b4284` | student | 200 | 200 | PASS | removes from Cloudinary |

## Analytics

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/analytics/skills` | student | 200 | 200 | PASS |  |
| POST | `/api/analytics/skills/recompute` | admin | 200 | 200 | PASS |  |
| GET | `/api/analytics/institution` | institution | 200 | 200 | PASS |  |
| GET | `/api/analytics/industry` | industry | 200 | 200 | PASS |  |
| GET | `/api/analytics/student` | student | 200 | 200 | PASS |  |
| GET | `/api/analytics/student/6a95a9a680f3366633179c85` | admin | 200 | 200 | PASS |  |

## Mentorship

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/mentorship/mentors` | student | 200 | 200 | PASS |  |
| POST | `/api/mentorship` | student | 201 | 201 | PASS | notifies mentor |
| GET | `/api/mentorship/me` | faculty | 200 | 200 | PASS |  |
| PATCH | `/api/mentorship/6a95b2206df7f5d9703b42b9/respond` | faculty | 200 | 200 | PASS |  |
| PATCH | `/api/mentorship/6a95b2206df7f5d9703b42b9/complete` | faculty | 200 | 200 | PASS |  |

## Academician Opportunities

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| POST | `/api/academician-opportunities` | industry | 201 | 201 | PASS |  |
| GET | `/api/academician-opportunities` | faculty | 200 | 200 | PASS |  |
| GET | `/api/academician-opportunities/6a95b2226df7f5d9703b42c9` | faculty | 200 | 200 | PASS |  |
| PUT | `/api/academician-opportunities/6a95b2226df7f5d9703b42c9` | industry | 200 | 200 | PASS |  |
| POST | `/api/academician-opportunities/6a95b2226df7f5d9703b42c9/interest` | faculty | 201 | 201 | PASS |  |
| GET | `/api/academician-opportunities/6a95b2226df7f5d9703b42c9/interested` | industry | 200 | 200 | PASS |  |
| DELETE | `/api/academician-opportunities/6a95b2226df7f5d9703b42c9` | industry | 200 | 200 | PASS |  |

## Notifications

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/notifications` | student | 200 | 200 | PASS |  |
| GET | `/api/notifications/unread-count` | student | 200 | 200 | PASS |  |
| PATCH | `/api/notifications/6a95b20e6df7f5d9703b4252/read` | student | 200 | 200 | PASS |  |
| POST | `/api/notifications/read-all` | student | 200 | 200 | PASS |  |
| DELETE | `/api/notifications/6a95b20e6df7f5d9703b4252` | student | 200 | 200 | PASS |  |

## Audit

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/audit` | admin | 200 | 200 | PASS |  |
| GET | `/api/audit` | student | 403 | 403 | PASS | RBAC: admin only |

## Misc

| Method | Endpoint | Role | Status | Expected | Result | Notes |
|--------|----------|------|--------|----------|--------|-------|
| GET | `/api/nope` | student | 404 | 404 | PASS | unknown route |

