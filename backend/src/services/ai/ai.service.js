import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { profileExtractionPrompt, resumePrompt, matchExplanationPrompt } from './prompts.js';
import {
  fallbackExtractProfile,
  fallbackGenerateResume,
  fallbackMatchExplanation,
} from './fallback.js';

/**
 * Provider-agnostic AI service. Uses Google Gemini when GEMINI_API_KEY is set,
 * otherwise transparently falls back to deterministic rule-based logic so the
 * backend runs fully offline. Any provider error also degrades to fallback.
 */
let genAI = null;

async function getModel() {
  if (!env.ai.enabled) return null;
  try {
    if (!genAI) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      genAI = new GoogleGenerativeAI(env.ai.geminiApiKey);
    }
    return genAI.getGenerativeModel({ model: env.ai.geminiModel });
  } catch (err) {
    logger.warn(`AI provider init failed, using fallback: ${err.message}`);
    return null;
  }
}

/**
 * Extract JSON from an LLM text response, tolerating code fences / stray text.
 */
function parseJsonLoose(text) {
  if (!text) return null;
  let t = text.trim();
  // strip ```json ... ``` fences
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

async function generateText(prompt) {
  const model = await getModel();
  if (!model) return null;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.warn(`AI generateContent failed, using fallback: ${err.message}`);
    return null;
  }
}

export const aiService = {
  get mode() {
    return env.ai.enabled ? 'gemini' : 'fallback';
  },

  /**
   * Extract a structured profile from a free-text/voice transcript.
   */
  async extractProfile(transcript, { role = 'student' } = {}) {
    const raw = await generateText(profileExtractionPrompt(transcript, role));
    const parsed = raw ? parseJsonLoose(raw) : null;
    if (parsed && typeof parsed === 'object') {
      return { ...parsed, _meta: { source: 'gemini' } };
    }
    return fallbackExtractProfile(transcript);
  },

  /**
   * Generate structured resume content from a profile.
   */
  async generateResume(profile) {
    const raw = await generateText(resumePrompt(profile));
    const parsed = raw ? parseJsonLoose(raw) : null;
    if (parsed && typeof parsed === 'object') {
      return { ...parsed, _meta: { source: 'gemini' } };
    }
    return fallbackGenerateResume(profile);
  },

  /**
   * Produce a human-readable explanation for a match score.
   */
  async explainMatch({ opportunity, matched, missing, score }) {
    const raw = await generateText(matchExplanationPrompt({ opportunity, matched, missing, score }));
    if (raw && raw.trim()) return raw.trim();
    return fallbackMatchExplanation({ matched, missing, score });
  },

  /**
   * Transcribe an audio recording using Groq Whisper.
   * Uses https://api.groq.com/openai/v1/audio/transcriptions with model whisper-large-v3-turbo.
   */
  async transcribeAudio(fileBuffer, mimetype = 'audio/webm', originalname = 'audio.webm') {
    if (!env.ai.groqEnabled) {
      logger.info('Groq Whisper is not configured (GROQ_API_KEY missing).');
      return null;
    }

    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: mimetype });
      const safeName = originalname && /\.\w+$/.test(originalname) ? originalname : 'recording.webm';
      formData.append('file', blob, safeName);
      formData.append('model', env.ai.groqModel || 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.ai.groqApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(`Groq Whisper transcription failed (${response.status}): ${errText}`);
        throw new Error(`Groq Whisper error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (err) {
      logger.warn(`Error during Groq Whisper transcription: ${err.message}`);
      throw err;
    }
  },
};

export default aiService;
