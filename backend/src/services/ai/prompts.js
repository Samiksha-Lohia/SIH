/**
 * Prompt templates for the AI layer. Kept separate so they can be tuned
 * without touching provider logic.
 */

export function profileExtractionPrompt(transcript, role = 'student') {
  return `You are an assistant that extracts a structured ${role} profile from free text.
Return ONLY valid minified JSON (no markdown, no commentary) with this shape:
{
  "skills": [{"name": string, "level": "beginner|intermediate|advanced|expert"}],
  "softSkills": [{"name": string, "level": "beginner|intermediate|advanced|expert"}],
  "projects": [{"title": string, "description": string, "techStack": [string]}],
  "certifications": [{"name": string, "issuer": string}],
  "careerGoals": {"targetRoles": [string], "preferredIndustries": [string], "summary": string},
  "education": [{"institution": string, "degree": string, "branch": string}]
}
If a field is unknown, use an empty array or empty string. Do not invent data that is not implied by the text.

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
