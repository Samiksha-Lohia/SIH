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
  return `Generate a concise, professional resume in structured JSON from the following candidate profile data.
Return ONLY valid minified JSON with this shape:
{
  "summary": string,
  "sections": [{"heading": string, "items": [string]}]
}

PROFILE DATA:
"""${JSON.stringify(profile)}"""`;
}

export function matchExplanationPrompt({ opportunity, matched, missing, score }) {
  return `Explain in 2-3 short sentences why a candidate received a ${score}% match for the opportunity "${opportunity}".
Matched strengths: ${matched.join(', ') || 'none'}.
Gaps: ${missing.join(', ') || 'none'}.
Return ONLY the explanation text, no markdown.`;
}
