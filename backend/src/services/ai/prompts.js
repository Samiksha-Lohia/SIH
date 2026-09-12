/**
 * Prompt templates for the AI layer. Kept separate so they can be tuned
 * without touching provider logic.
 */

export function profileExtractionPrompt(transcript, role = 'student') {
  return `You are an elite technical recruiter and skill extraction engine profiling a ${role} from spoken voice or narrative text.
Your job is to thoroughly and accurately identify all technical skills, soft skills, projects, certifications, and career aspirations.

Rules:
1. "skills": Extract every technical competency mentioned (programming languages, libraries, frameworks, databases, cloud, DevOps, developer tools, architectures, system concepts). Use standard industry casing (e.g., "React", "Node.js", "Python", "TypeScript", "Docker", "PostgreSQL", "MongoDB", "Express.js", "Git", "REST APIs", "Tailwind CSS", "C++", "Java", "AWS", etc.). Set "level" to "beginner", "intermediate", "advanced", or "expert" based on context (default "intermediate").
2. "softSkills": Extract interpersonal, leadership, and operational strengths (e.g. "Problem Solving", "Team Leadership", "Communication", "Agile Collaboration", "Critical Thinking", "Time Management").
3. "projects": If any projects, apps, systems, websites, or research work are mentioned, extract:
   - "title": Clean, concise title
   - "description": Summary of what was built, features, or architecture
   - "techStack": Array of technologies and tools used
4. "certifications": If courses, certificates, licenses, or accreditations are mentioned (e.g. AWS Certified, Coursera, HackerRank, Google Cloud, Meta), extract:
   - "name": Certification title
   - "issuer": Issuing organization or platform
5. "careerGoals":
   - "targetRoles": Array of target career titles (e.g. ["Full Stack Developer", "Software Engineer"])
   - "preferredIndustries": Array of industries (e.g. ["FinTech", "SaaS", "Healthcare"])
   - "summary": A concise, professional summary of aspirations
6. "education": Any degree, major, or institution mentioned.

Return ONLY valid minified JSON without any markdown formatting, backticks, or explanatory text.
Schema:
{
  "skills": [{"name": string, "level": "beginner|intermediate|advanced|expert"}],
  "softSkills": [{"name": string, "level": "beginner|intermediate|advanced|expert"}],
  "projects": [{"title": string, "description": string, "techStack": [string]}],
  "certifications": [{"name": string, "issuer": string}],
  "careerGoals": {"targetRoles": [string], "preferredIndustries": [string], "summary": string},
  "education": [{"institution": string, "degree": string, "branch": string}]
}

TEXT:
"""${transcript}"""`;
}

export function resumePrompt(profile) {
  return `You are an expert technical resume writer and career coach.
Your task is to polish the following student candidate's resume content into a structured, impactful presentation.
Write:
1. "summary": A compelling 2-3 sentence executive professional summary emphasizing the candidate's core strengths, technical aptitude, and alignment with target roles.
2. "projects": For each project provided, polish the "description" using action-verb phrasing (e.g. "Architected...", "Developed...", "Optimized..."), highlighting technical implementation and impact. Keep the exact project "title".
IMPORTANT: Do NOT invent, omit, or alter any factual data (names, institutions, degrees, dates, skill names, or certification names).

Return ONLY valid minified JSON with this exact schema:
{
  "summary": string,
  "projects": [
    {
      "title": string,
      "description": string
    }
  ]
}

CANDIDATE DATA:
"""${JSON.stringify({
    name: profile.name,
    targetRole: profile.careerGoals?.targetRoles?.[0] || 'Software Engineer',
    careerSummary: profile.careerGoals?.summary,
    skills: profile.skills?.map((s) => (typeof s === 'string' ? s : s.name)),
    projects: profile.projects?.map((p) => ({ title: p.title, description: p.description, techStack: p.techStack })),
    education: profile.education?.map((e) => ({ degree: e.degree, branch: e.branch, institution: e.institution })),
    certifications: profile.certifications?.map((c) => ({ name: c.name, issuer: c.issuer })),
  })}"""`;
}

export function matchExplanationPrompt({ opportunity, matched, missing, score }) {
  return `Explain in 2-3 short sentences why a candidate received a ${score}% match for the opportunity "${opportunity}".
Matched strengths: ${matched.join(', ') || 'none'}.
Gaps: ${missing.join(', ') || 'none'}.
Return ONLY the explanation text, no markdown.`;
}
