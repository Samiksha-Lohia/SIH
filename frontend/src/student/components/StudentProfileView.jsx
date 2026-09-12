import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { studentApi } from '../student.api.js';

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const WORK_MODES = ['remote', 'onsite', 'hybrid'];

function formatTimer(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function StudentProfileView({ onProfileUpdated }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Active sub-section
  const [activeSection, setActiveSection] = useState('skills');

  // Voice / Text AI assistant state
  const [transcript, setTranscript] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);

  // Audio Recording & Groq Whisper state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    branch: '',
    semester: '',
    graduationYear: '',
    skills: [],
    softSkills: [],
    projects: [],
    certifications: [],
    achievements: [],
    careerGoals: { targetRoles: [], preferredIndustries: [], summary: '' },
    preferences: { workMode: '', locations: [], stipendExpectation: '' },
    portfolio: { resumeUrl: '', github: '', linkedin: '', website: '' },
  });

  // Temporary inputs for array additions
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });
  const [newSoftSkill, setNewSoftSkill] = useState({ name: '', level: 'intermediate' });
  const [newTargetRole, setNewTargetRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '', link: '', role: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', credentialId: '', url: '' });

  // Resume Preview & Download State
  const [resumeData, setResumeData] = useState(null);
  const [editableResume, setEditableResume] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const activeUserId = user?.id || user?._id || profile?.user;

  const syncFormDataFromProfile = useCallback((p) => {
    if (!p) return;
    setFormData({
      branch: p.branch || '',
      semester: p.semester || '',
      graduationYear: p.graduationYear || '',
      skills: p.skills || [],
      softSkills: p.softSkills || [],
      projects: p.projects || [],
      certifications: p.certifications || [],
      achievements: p.achievements || [],
      careerGoals: {
        targetRoles: p.careerGoals?.targetRoles || [],
        preferredIndustries: p.careerGoals?.preferredIndustries || [],
        summary: p.careerGoals?.summary || '',
      },
      preferences: {
        workMode: p.preferences?.workMode || '',
        locations: p.preferences?.locations || [],
        stipendExpectation: p.preferences?.stipendExpectation || '',
      },
      portfolio: {
        resumeUrl: p.portfolio?.resumeUrl || '',
        github: p.portfolio?.github || '',
        linkedin: p.portfolio?.linkedin || '',
        website: p.portfolio?.website || '',
      },
    });
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getMyProfile();
      if (res?.profile) {
        setProfile(res.profile);
        syncFormDataFromProfile(res.profile);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [syncFormDataFromProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Cleanup media recording on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      setFeedback(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        setAudioBlob(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start browser live speech preview in parallel
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (e) => {
            let fullText = '';
            for (let i = 0; i < e.results.length; i++) {
              fullText += e.results[i][0].transcript + ' ';
            }
            if (fullText.trim()) {
              setTranscript(fullText.trim());
            }
          };
          rec.onerror = () => {};
          rec.start();
          recognitionRef.current = rec;
        } catch {}
      }
    } catch (err) {
      console.error('Microphone error:', err);
      setFeedback({
        type: 'error',
        message: 'Could not access microphone. Please allow microphone permissions or type your narrative below.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const resetRecording = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const handleSave = async () => {
    const targetUserId = activeUserId;
    if (!targetUserId) {
      setFeedback({ type: 'error', message: 'User session not ready. Please refresh or re-login.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        ...formData,
        semester: formData.semester ? Number(formData.semester) : undefined,
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
        preferences: {
          ...formData.preferences,
          stipendExpectation: formData.preferences.stipendExpectation
            ? Number(formData.preferences.stipendExpectation)
            : undefined,
        },
      };

      const updated = await studentApi.updateStudentProfile(targetUserId, payload);
      setProfile(updated);
      setFeedback({ type: 'success', message: 'Profile updated successfully! Completeness recalculated.' });
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceTranscribe = async (autoMerge = false) => {
    const targetUserId = activeUserId;
    if (!targetUserId) {
      setFeedback({ type: 'error', message: 'User session not ready. Please refresh or re-login.' });
      return;
    }
    if (!audioBlob && !transcript.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please record voice audio using the microphone or type narrative text before transcribing.',
      });
      return;
    }

    setIsTranscribing(true);
    setFeedback(null);

    try {
      const res = await studentApi.transcribeVoice(targetUserId, {
        audioBlob,
        transcript: transcript.trim(),
        autoMerge,
      });

      if (res.transcript && (!transcript || !transcript.trim())) {
        setTranscript(res.transcript);
      }

      setVoiceResult(res.extracted);

      if (autoMerge && res.profile) {
        setProfile(res.profile);
        syncFormDataFromProfile(res.profile);
        setFeedback({
          type: 'success',
          message: `Voice transcribed via Groq Whisper and automatically merged! Extracted ${res.extracted?.skills?.length || 0} skills and ${res.extracted?.softSkills?.length || 0} soft skills.`,
        });
        if (onProfileUpdated) onProfileUpdated(res.profile);
      } else {
        setFeedback({
          type: 'success',
          message: `Voice transcribed successfully! Review extracted competencies below and click "Merge Extracted Skills" to commit.`,
        });
      }
    } catch (err) {
      // Fallback: If backend Groq Whisper key is absent but transcript exists, fallback to text extraction
      if (transcript.trim()) {
        try {
          const fallbackRes = await studentApi.extractVoiceProfile(targetUserId, transcript.trim(), autoMerge);
          setVoiceResult(fallbackRes.extracted);
          if (autoMerge && fallbackRes.profile) {
            setProfile(fallbackRes.profile);
            syncFormDataFromProfile(fallbackRes.profile);
            setFeedback({
              type: 'success',
              message: 'Extracted keywords and automatically merged into profile!',
            });
            if (onProfileUpdated) onProfileUpdated(fallbackRes.profile);
          } else {
            setFeedback({
              type: 'success',
              message: 'Narrative extracted! Review proposed skills below.',
            });
          }
          return;
        } catch (innerErr) {
          console.error(innerErr);
        }
      }
      setFeedback({ type: 'error', message: err.message || 'Voice transcription failed' });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoiceExtract = async (autoMerge = false) => {
    const targetUserId = activeUserId;
    if (!targetUserId) {
      setFeedback({ type: 'error', message: 'User session not ready. Please refresh or re-login.' });
      return;
    }
    if (!transcript.trim()) {
      setFeedback({ type: 'error', message: 'Please enter some narrative text first.' });
      return;
    }

    setIsExtracting(true);
    setFeedback(null);
    try {
      const res = await studentApi.extractVoiceProfile(targetUserId, transcript.trim(), autoMerge);
      setVoiceResult(res.extracted);
      if (autoMerge && res.profile) {
        setProfile(res.profile);
        syncFormDataFromProfile(res.profile);
        setFeedback({
          type: 'success',
          message: `AI narrative analyzed and automatically merged into profile! (${res.extracted?.skills?.length || 0} skills added/updated)`,
        });
        if (onProfileUpdated) onProfileUpdated(res.profile);
      } else {
        setFeedback({
          type: 'success',
          message: `AI analyzed your text! Found ${res.extracted?.skills?.length || 0} skills and ${res.extracted?.softSkills?.length || 0} soft skills. Review proposal below.`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Voice/Text profile extraction failed' });
    } finally {
      setIsExtracting(false);
    }
  };

  const applyVoiceProposal = async () => {
    if (!voiceResult) return;
    const targetUserId = activeUserId;

    // Deduplicate technical skills by name
    const existingSkills = [...formData.skills];
    (voiceResult.skills || []).forEach((newS) => {
      if (!newS?.name) return;
      const idx = existingSkills.findIndex((s) => s.name?.toLowerCase() === newS.name?.toLowerCase());
      if (idx >= 0) {
        existingSkills[idx] = { ...existingSkills[idx], ...newS };
      } else {
        existingSkills.push(newS);
      }
    });

    // Deduplicate soft skills by name
    const existingSoftSkills = [...formData.softSkills];
    (voiceResult.softSkills || []).forEach((newS) => {
      if (!newS?.name) return;
      const idx = existingSoftSkills.findIndex((s) => s.name?.toLowerCase() === newS.name?.toLowerCase());
      if (idx >= 0) {
        existingSoftSkills[idx] = { ...existingSoftSkills[idx], ...newS };
      } else {
        existingSoftSkills.push(newS);
      }
    });

    // Merge target roles
    const existingRoles = formData.careerGoals?.targetRoles || [];
    const newRoles = voiceResult.careerGoals?.targetRoles || [];
    const mergedTargetRoles = Array.from(new Set([...existingRoles, ...newRoles]));

    // Merge projects
    const existingProjects = [...formData.projects];
    (voiceResult.projects || []).forEach((np) => {
      if (np.title && !existingProjects.some((ep) => ep.title?.toLowerCase() === np.title?.toLowerCase())) {
        existingProjects.push(np);
      }
    });

    const updatedFormData = {
      ...formData,
      skills: existingSkills,
      softSkills: existingSoftSkills,
      projects: existingProjects,
      certifications: voiceResult.certifications?.length
        ? [...formData.certifications, ...voiceResult.certifications]
        : formData.certifications,
      careerGoals: {
        ...formData.careerGoals,
        targetRoles: mergedTargetRoles,
        summary: voiceResult.careerGoals?.summary || formData.careerGoals?.summary || '',
      },
    };

    setFormData(updatedFormData);
    setVoiceResult(null);

    // Save directly to backend database so changes persist immediately
    if (targetUserId) {
      setSaving(true);
      try {
        const payload = {
          ...updatedFormData,
          semester: updatedFormData.semester ? Number(updatedFormData.semester) : undefined,
          graduationYear: updatedFormData.graduationYear ? Number(updatedFormData.graduationYear) : undefined,
          preferences: {
            ...updatedFormData.preferences,
            stipendExpectation: updatedFormData.preferences.stipendExpectation
              ? Number(updatedFormData.preferences.stipendExpectation)
              : undefined,
          },
        };
        const updated = await studentApi.updateStudentProfile(targetUserId, payload);
        setProfile(updated);
        setFeedback({
          type: 'success',
          message: 'Extracted competencies accepted and saved directly to your profile!',
        });
        if (onProfileUpdated) onProfileUpdated(updated);
      } catch (err) {
        setFeedback({
          type: 'success',
          message: 'Applied recommendations to form! Click "Save Profile Changes" below to commit.',
        });
      } finally {
        setSaving(false);
      }
    } else {
      setFeedback({
        type: 'success',
        message: 'Applied recommendations to form! Click "Save Profile Changes" below to commit.',
      });
    }
  };

  const handlePreviewResume = async () => {
    setGeneratingResume(true);
    setCopiedResume(false);
    try {
      const res = await studentApi.generateResume();
      const resumePayload = res?.resume || res;
      setResumeData(resumePayload);
      setEditableResume(JSON.parse(JSON.stringify(resumePayload)));
      setIsEditMode(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to load resume. Ensure basic profile details are saved.',
      });
    } finally {
      setGeneratingResume(false);
    }
  };

  const handleCopyResumeText = () => {
    const data = editableResume || resumeData;
    if (!data) return;

    const lines = [];
    lines.push(data.name || user?.name || 'Candidate');
    if (data.targetRole) lines.push(data.targetRole);
    const contacts = [data.email, data.phone, data.location].filter(Boolean);
    if (contacts.length) lines.push(contacts.join(' • '));
    lines.push('');

    if (data.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push(data.summary);
      lines.push('');
    }

    if (data.skills?.technical?.length) {
      lines.push('TECHNICAL COMPETENCIES');
      lines.push(data.skills.technical.map((s) => s.name).join(', '));
      lines.push('');
    }

    if (data.skills?.soft?.length) {
      lines.push('SOFT SKILLS');
      lines.push(data.skills.soft.map((s) => s.name).join(', '));
      lines.push('');
    }

    if (Array.isArray(data.projects) && data.projects.length) {
      lines.push('FEATURED PROJECTS');
      for (const p of data.projects) {
        lines.push(`• ${p.title}`);
        if (p.techStack?.length) lines.push(`  Technologies: ${p.techStack.join(', ')}`);
        if (p.description) lines.push(`  ${p.description}`);
      }
      lines.push('');
    }

    if (Array.isArray(data.education) && data.education.length) {
      lines.push('EDUCATION');
      for (const e of data.education) {
        lines.push(`• ${e.degree}${e.branch ? ` in ${e.branch}` : ''} - ${e.institution}${e.graduationYear ? ` (${e.graduationYear})` : ''}`);
        if (e.score) lines.push(`  Score: ${e.score}`);
      }
      lines.push('');
    }

    if (Array.isArray(data.certifications) && data.certifications.length) {
      lines.push('CERTIFICATIONS');
      for (const c of data.certifications) {
        lines.push(`• ${c.name}${c.issuer ? ` - ${c.issuer}` : ''}`);
      }
      lines.push('');
    }

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 3000);
  };

  const handleDownloadPdf = () => {
    const data = editableResume || resumeData;
    if (!data) return;

    setDownloadingPdf(true);

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;

    const techSkillsHtml = (data.skills?.technical || [])
      .map(
        (s) =>
          `<span class="skill-pill ${s.verified ? 'verified' : ''}">${s.name}${s.verified ? ' ✓' : ''}</span>`
      )
      .join('');

    const softSkillsHtml = (data.skills?.soft || [])
      .map((s) => `<span class="skill-pill">${s.name}</span>`)
      .join('');

    const projectsHtml = (data.projects || [])
      .map(
        (p) => `
        <div class="project-item">
          <div class="item-header">
            <span class="item-title">${p.title}</span>
            ${p.link ? `<span class="item-link">${p.link}</span>` : ''}
          </div>
          ${
            p.techStack && p.techStack.length
              ? `<div class="tech-tags">Technologies: ${p.techStack.join(', ')}</div>`
              : ''
          }
          <div class="project-desc">${p.description || ''}</div>
        </div>
      `
      )
      .join('');

    const educationHtml = (data.education || [])
      .map(
        (e) => `
        <div class="education-item">
          <div class="item-header">
            <span class="item-title">${e.degree}${e.branch ? ` in ${e.branch}` : ''}</span>
            <span class="item-meta">${e.graduationYear ? `Class of ${e.graduationYear}` : ''}</span>
          </div>
          <div class="edu-sub">${e.institution}${e.score ? ` • Score: ${e.score}` : ''}</div>
        </div>
      `
      )
      .join('');

    const certsHtml = (data.certifications || [])
      .map(
        (c) => `
        <div class="cert-item">
          <span class="item-title">${c.name}</span>
          ${c.issuer ? `<span class="item-meta"> — ${c.issuer}</span>` : ''}
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.name || 'Resume'} - SUTRA Verified Resume</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            line-height: 1.45;
            margin: 0;
            padding: 0;
            font-size: 9.5pt;
          }
          .resume-container { max-width: 100%; margin: 0 auto; }
          .header { border-bottom: 2pt solid #B58863; padding-bottom: 8px; margin-bottom: 12px; }
          .name { font-size: 18pt; font-weight: 700; color: #10232A; margin: 0 0 2px 0; letter-spacing: -0.02em; }
          .target-role { font-size: 10.5pt; font-weight: 700; color: #B58863; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .contact-row { display: flex; flex-wrap: wrap; gap: 10px; font-size: 8.5pt; color: #475569; }
          .section { margin-bottom: 11px; }
          .section-title { font-size: 9.5pt; font-weight: 700; color: #10232A; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 6px; }
          .summary-text { font-size: 8.8pt; color: #334155; line-height: 1.5; margin: 0; }
          .skills-grid { display: flex; flex-wrap: wrap; gap: 4px; }
          .skill-pill { display: inline-block; padding: 2px 6px; font-size: 8pt; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 3px; color: #1e293b; }
          .skill-pill.verified { background: #FAF7F4; border-color: #B58863; color: #10232A; font-weight: 600; }
          .project-item, .education-item { margin-bottom: 8px; }
          .item-header { display: flex; justify-content: space-between; align-items: baseline; }
          .item-title { font-weight: 700; font-size: 9pt; color: #0f172a; }
          .item-link, .item-meta { font-size: 8pt; color: #64748b; }
          .tech-tags { font-size: 8pt; font-weight: 600; color: #B58863; margin: 1px 0 2px 0; }
          .project-desc { font-size: 8.5pt; color: #334155; line-height: 1.4; }
          .edu-sub { font-size: 8.5pt; color: #475569; }
          .cert-item { font-size: 8.5pt; margin-bottom: 3px; }
          .footer-watermark { margin-top: 14px; font-size: 7.5pt; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="resume-container">
          <div class="header">
            <h1 class="name">${data.name || 'Candidate'}</h1>
            ${data.targetRole ? `<div class="target-role">${data.targetRole}</div>` : ''}
            <div class="contact-row">
              ${data.email ? `<span>Email: ${data.email}</span>` : ''}
              ${data.phone ? `<span>Phone: ${data.phone}</span>` : ''}
              ${data.location ? `<span>Location: ${data.location}</span>` : ''}
              ${data.links?.github ? `<span>GitHub: ${data.links.github}</span>` : ''}
              ${data.links?.linkedin ? `<span>LinkedIn: ${data.links.linkedin}</span>` : ''}
            </div>
          </div>

          ${data.summary ? `
            <div class="section">
              <div class="section-title">Professional Summary</div>
              <p class="summary-text">${data.summary}</p>
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Technical & Professional Competencies</div>
            <div class="skills-grid">
              ${techSkillsHtml}
              ${softSkillsHtml}
            </div>
          </div>

          ${data.projects && data.projects.length ? `
            <div class="section">
              <div class="section-title">Featured Projects & Applied Engineering</div>
              ${projectsHtml}
            </div>
          ` : ''}

          ${data.education && data.education.length ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${educationHtml}
            </div>
          ` : ''}

          ${data.certifications && data.certifications.length ? `
            <div class="section">
              <div class="section-title">Certifications & Credentials</div>
              ${certsHtml}
            </div>
          ` : ''}

          <div class="footer-watermark">
            Verified Competencies & Credentials via SUTRA • Generated on ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </div>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setDownloadingPdf(false);
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    }, 400);
  };

  // Helper additions
  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: newSkill.name.trim(), level: newSkill.level }],
    }));
    setNewSkill({ name: '', level: 'intermediate' });
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const addSoftSkill = () => {
    if (!newSoftSkill.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      softSkills: [...prev.softSkills, { name: newSoftSkill.name.trim(), level: newSoftSkill.level }],
    }));
    setNewSoftSkill({ name: '', level: 'intermediate' });
  };

  const removeSoftSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      softSkills: prev.softSkills.filter((_, i) => i !== index),
    }));
  };

  const addTargetRole = () => {
    if (!newTargetRole.trim()) return;
    setFormData((prev) => ({
      ...prev,
      careerGoals: {
        ...prev.careerGoals,
        targetRoles: [...prev.careerGoals.targetRoles, newTargetRole.trim()],
      },
    }));
    setNewTargetRole('');
  };

  const removeTargetRole = (index) => {
    setFormData((prev) => ({
      ...prev,
      careerGoals: {
        ...prev.careerGoals,
        targetRoles: prev.careerGoals.targetRoles.filter((_, i) => i !== index),
      },
    }));
  };

  const addLocation = () => {
    if (!newLocation.trim()) return;
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        locations: [...prev.preferences.locations, newLocation.trim()],
      },
    }));
    setNewLocation('');
  };

  const removeLocation = (index) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        locations: prev.preferences.locations.filter((_, i) => i !== index),
      },
    }));
  };

  const addProject = () => {
    if (!newProject.title.trim()) return;
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          title: newProject.title.trim(),
          description: newProject.description.trim(),
          techStack: newProject.techStack ? newProject.techStack.split(',').map((s) => s.trim()).filter(Boolean) : [],
          link: newProject.link.trim(),
          role: newProject.role.trim(),
        },
      ],
    }));
    setNewProject({ title: '', description: '', techStack: '', link: '', role: '' });
  };

  const removeProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const addCertification = () => {
    if (!newCert.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { ...newCert }],
    }));
    setNewCert({ name: '', issuer: '', credentialId: '', url: '' });
  };

  const removeCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div style={styles.stateBox}>
        <div style={styles.spinner}></div>
        <p>Loading student profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.stateBox}>
        <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
        <button onClick={loadProfile} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  const renderAiVoiceAssistant = (isCompact = true) => (
    <div
      className="card"
      style={{
        marginBottom: 'var(--space-5)',
        backgroundColor: 'var(--color-mist-light)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
              AI Voice & Narrative Skill Onboarding
            </h4>
            <span className="badge badge-sky" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
              Groq Whisper AI
            </span>
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            Click the microphone to speak your skills, projects, and career story, or type a narrative below. SUTRA
            transcribes your speech via Groq Whisper and extracts keywords automatically.
          </p>
        </div>

        {/* Audio Recording Mic Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
                padding: '8px 16px',
              }}
            >
              Start Voice Recording
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="status-pill status-rejected"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  padding: '6px 14px',
                }}
              >
                <span className="status-pill-dot" style={{ animation: 'pulse 1.2s infinite' }} />
                Recording live audio... {formatTimer(recordingTime)}
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="btn btn-ghost"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-danger)',
                }}
              >
                Stop Recording
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recorded Audio Preview & Transcribe Actions */}
      {audioUrl && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              Audio Recording Preview ({formatTimer(recordingTime)}):
            </span>
            <button
              type="button"
              onClick={resetRecording}
              className="btn btn-ghost"
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              Re-record
            </button>
          </div>
          <audio src={audioUrl} controls style={{ width: '100%', height: '36px' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleVoiceTranscribe(false)}
              disabled={isTranscribing}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              {isTranscribing ? 'Transcribing with Groq Whisper...' : 'Transcribe with Groq Whisper'}
            </button>
            <button
              type="button"
              onClick={() => handleVoiceTranscribe(true)}
              disabled={isTranscribing}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              {isTranscribing ? 'Processing...' : 'Transcribe & Auto-Merge to Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Narrative & Transcript Area */}
      <div style={{ marginTop: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ ...styles.label, marginBottom: 0 }}>
            {isRecording ? 'Live Speech Transcript (Listening...)' : 'Spoken Transcript / Text Bio'}
          </label>
          {transcript && (
            <button
              type="button"
              onClick={() => setTranscript('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Clear text
            </button>
          )}
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speak into the microphone or type/paste your narrative here (e.g. 'I am an engineering student skilled in React, Node.js, Python, MongoDB, and Docker with strong problem-solving skills, aiming for a Full Stack Developer role')..."
          style={{
            ...styles.input,
            minHeight: isCompact ? '85px' : '120px',
            backgroundColor: 'var(--color-bg-surface)',
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleVoiceExtract(false)}
            disabled={isExtracting || !transcript.trim()}
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            {isExtracting ? 'Analyzing Narrative...' : 'Extract & Propose Skills'}
          </button>
          <button
            type="button"
            onClick={() => handleVoiceExtract(true)}
            disabled={isExtracting || !transcript.trim()}
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            {isExtracting ? 'Merging...' : 'Extract & Auto-Merge to Profile'}
          </button>
        </div>
      </div>

      {/* Extracted Words Proposal Card */}
      {voiceResult && (
        <div
          className="card"
          style={{
            marginTop: 'var(--space-4)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h5 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Extracted Competencies & Keywords</h5>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Source: {voiceResult._meta?.source || 'AI Whisper & NLP'}
            </span>
          </div>

          {/* Technical Skills */}
          <div style={{ margin: 'var(--space-2) 0' }}>
            <strong style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Technical Skills ({voiceResult.skills?.length || 0}):
            </strong>
            <div style={styles.chipGrid}>
              {voiceResult.skills?.map((s, i) => (
                <span
                  key={i}
                  className="badge badge-sky"
                  style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <strong>{s.name}</strong> <span style={{ opacity: 0.75 }}>({s.level})</span>
                </span>
              ))}
              {(!voiceResult.skills || voiceResult.skills.length === 0) && (
                <span style={styles.emptyPrompt}>None detected in this passage</span>
              )}
            </div>
          </div>

          {/* Soft Skills */}
          <div style={{ margin: 'var(--space-2) 0' }}>
            <strong style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Soft Skills ({voiceResult.softSkills?.length || 0}):
            </strong>
            <div style={styles.chipGrid}>
              {voiceResult.softSkills?.map((s, i) => (
                <span
                  key={i}
                  className="badge badge-mist"
                  style={{ fontSize: '11px' }}
                >
                  {s.name}
                </span>
              ))}
              {(!voiceResult.softSkills || voiceResult.softSkills.length === 0) && (
                <span style={styles.emptyPrompt}>None detected</span>
              )}
            </div>
          </div>

          {/* Target Roles */}
          {voiceResult.careerGoals?.targetRoles?.length > 0 && (
            <div style={{ margin: 'var(--space-2) 0' }}>
              <strong style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Target Career Roles:
              </strong>
              <div style={styles.chipGrid}>
                {voiceResult.careerGoals.targetRoles.map((r, i) => (
                  <span
                    key={i}
                    className="status-pill status-verified"
                    style={{ fontSize: '11px' }}
                  >
                    <span className="status-pill-dot" />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {voiceResult.careerGoals?.summary && (
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                fontStyle: 'italic',
                color: 'var(--color-text-muted)',
                margin: 'var(--space-2) 0',
              }}
            >
              "{voiceResult.careerGoals.summary}"
            </p>
          )}

          {/* Extracted Projects */}
          {voiceResult.projects?.length > 0 && (
            <div style={{ margin: 'var(--space-2) 0' }}>
              <strong style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Extracted Projects ({voiceResult.projects.length}):
              </strong>
              <div style={styles.chipGrid}>
                {voiceResult.projects.map((p, i) => (
                  <span key={i} className="badge badge-sky" style={{ fontSize: '11px' }}>
                    <strong>{p.title}</strong>
                    {p.techStack?.length ? ` (${p.techStack.join(', ')})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Certifications */}
          {voiceResult.certifications?.length > 0 && (
            <div style={{ margin: 'var(--space-2) 0' }}>
              <strong style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Extracted Certifications ({voiceResult.certifications.length}):
              </strong>
              <div style={styles.chipGrid}>
                {voiceResult.certifications.map((c, i) => (
                  <span key={i} className="badge badge-mist" style={{ fontSize: '11px' }}>
                    {c.name} {c.issuer ? `(${c.issuer})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={applyVoiceProposal}
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Merge Extracted Skills & Projects into Profile & Resume
            </button>
            <button
              type="button"
              onClick={() => setVoiceResult(null)}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const completeness = profile?.completeness || 0;

  return (
    <div style={styles.container}>
      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            ...styles.feedbackBox,
            backgroundColor: feedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            color: feedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Profile Overview & Completeness Header */}
      <div className="card" style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>{user?.name || 'Student Profile'}</h3>
              <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                {user?.role || 'Student'}
              </span>
              <span className={`status-pill ${completeness >= 80 ? 'status-verified' : 'status-pending'}`}>
                <span className="status-pill-dot" />
                {completeness >= 80 ? 'Profile Complete' : `${completeness}% Profile Readiness`}
              </span>
            </div>
            <p style={{ ...styles.subText, marginTop: '4px', marginBottom: 0 }}>
              {formData.branch ? `${formData.branch}` : 'Branch not configured'}
              {formData.semester ? ` • Semester ${formData.semester}` : ''}
              {formData.graduationYear ? ` • Class of ${formData.graduationYear}` : ''}
            </p>
          </div>

          <div style={styles.meterContainer}>
            <div style={styles.meterHeader}>
              <span style={styles.meterTitle}>Readiness Index</span>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--color-primary)' }}>
                {completeness}%
              </span>
            </div>
            <div style={styles.meterTrack}>
              <div
                style={{
                  ...styles.meterFill,
                  width: `${Math.min(100, Math.max(0, completeness))}%`,
                  backgroundColor: completeness >= 80 ? 'var(--color-success)' : 'var(--color-primary)',
                }}
              />
            </div>
            <span style={styles.meterHint}>Higher completeness unlocks targeted recruiter invitations</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePreviewResume}
              disabled={generatingResume}
              className="btn btn-primary"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
                padding: '8px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📄</span>
              {generatingResume ? 'Syncing...' : 'Preview Synced Resume'}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Tab Navigation */}
        <div className="b2b-mobile-tab-nav" style={{ marginTop: 'var(--space-3)' }}>
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', fontSize: 'var(--font-size-sm)' }}
          >
            <option value="academic">Academic & Education</option>
            <option value="skills">Skills & Competencies</option>
            <option value="projects">Projects & Certifications</option>
            <option value="goals">Career Goals & Preferences</option>
            <option value="links">Portfolio & Links</option>
          </select>
        </div>

        {/* Desktop / Tablet Sub-Tab Navigation */}
        <div className="b2b-tab-bar" style={{ marginTop: 'var(--space-3)' }}>
          {[
            { id: 'academic', label: 'Academic & Education' },
            { id: 'skills', label: 'Skills & Competencies' },
            { id: 'projects', label: 'Projects & Certifications' },
            { id: 'goals', label: 'Career Goals & Preferences' },
            { id: 'links', label: 'Portfolio & Links' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`b2b-tab ${activeSection === sec.id ? 'active' : ''}`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Edit Body */}
      <div className="card" style={styles.bodyCard}>
        {/* Section 1: Academic */}
        {activeSection === 'academic' && (
          <div style={styles.formSection}>
            <h4 style={styles.sectionHeading}>Academic Information</h4>
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>Branch / Major</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Science and Engineering"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Current Semester</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="e.g. 6"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Expected Graduation Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  placeholder="e.g. 2026"
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Skills */}
        {activeSection === 'skills' && (
          <div style={styles.formSection}>
            {renderAiVoiceAssistant(true)}

            <h4 style={styles.sectionHeading}>Technical Skills</h4>
            <div style={styles.addInlineRow}>
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="Skill name (e.g. React, Python, Docker)"
                style={{ ...styles.input, flex: 2 }}
              />
              <select
                value={newSkill.level}
                onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                style={{ ...styles.select, flex: 1 }}
              >
                {PROFICIENCY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              <button onClick={addSkill} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
                + Add Skill
              </button>
            </div>

            <div style={styles.chipGrid}>
              {formData.skills.map((s, idx) => (
                <div key={idx} style={styles.skillChip}>
                  <span><strong>{s.name}</strong> ({s.level})</span>
                  <button onClick={() => removeSkill(idx)} style={styles.chipRemove}>×</button>
                </div>
              ))}
              {formData.skills.length === 0 && (
                <p style={styles.emptyPrompt}>No technical skills added yet.</p>
              )}
            </div>

            <h4 style={{ ...styles.sectionHeading, marginTop: 'var(--space-6)' }}>Soft Skills</h4>
            <div style={styles.addInlineRow}>
              <input
                type="text"
                value={newSoftSkill.name}
                onChange={(e) => setNewSoftSkill({ ...newSoftSkill, name: e.target.value })}
                placeholder="Soft skill (e.g. Leadership, Problem Solving)"
                style={{ ...styles.input, flex: 2 }}
              />
              <select
                value={newSoftSkill.level}
                onChange={(e) => setNewSoftSkill({ ...newSoftSkill, level: e.target.value })}
                style={{ ...styles.select, flex: 1 }}
              >
                {PROFICIENCY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              <button onClick={addSoftSkill} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
                + Add Soft Skill
              </button>
            </div>

            <div style={styles.chipGrid}>
              {formData.softSkills.map((s, idx) => (
                <div key={idx} style={{ ...styles.skillChip, backgroundColor: 'var(--color-mist-light)' }}>
                  <span><strong>{s.name}</strong> ({s.level})</span>
                  <button onClick={() => removeSoftSkill(idx)} style={styles.chipRemove}>×</button>
                </div>
              ))}
              {formData.softSkills.length === 0 && (
                <p style={styles.emptyPrompt}>No soft skills added yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Projects & Certifications */}
        {activeSection === 'projects' && (
          <div style={styles.formSection}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-mist-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>✨ Universal Resume Synchronization</span>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  All projects and certifications added here (or via AI Voice Onboarding / Digital Portfolio) are automatically formatted and included in your live AI Resume.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePreviewResume}
                disabled={generatingResume}
                className="btn btn-ghost"
                style={{ fontSize: 'var(--font-size-xs)', padding: '5px 12px', whiteSpace: 'nowrap' }}
              >
                {generatingResume ? 'Syncing...' : '📄 Preview Synced Resume'}
              </button>
            </div>

            <h4 style={styles.sectionHeading}>Projects</h4>
            <div style={styles.subCard}>
              <div style={styles.grid2}>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Project Title"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={newProject.role}
                  onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                  placeholder="Your Role (e.g. Lead Developer)"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={newProject.techStack}
                  onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
                  placeholder="Tech Stack (comma-separated: Node, React, Mongo)"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={newProject.link}
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                  placeholder="Project / Demo Link URL"
                  style={styles.input}
                />
              </div>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief project description & impact..."
                style={{ ...styles.input, marginTop: 'var(--space-2)', minHeight: '60px' }}
              />
              <button onClick={addProject} className="btn btn-ghost" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
                + Add Project to Profile
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              {formData.projects.map((p, idx) => (
                <div key={idx} style={styles.itemRow}>
                  <div>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>{p.title}</strong> {p.role && <span style={styles.subText}>• {p.role}</span>}
                    <p style={{ fontSize: 'var(--font-size-xs)', marginTop: '2px', color: 'var(--color-text-secondary)' }}>{p.description}</p>
                    {p.techStack?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {p.techStack.map((t, i) => (
                          <span key={i} className="badge badge-mist" style={{ fontSize: '10px' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeProject(idx)} className="btn btn-ghost" style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--color-danger)' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <h4 style={{ ...styles.sectionHeading, marginTop: 'var(--space-6)' }}>Certifications</h4>
            <div style={styles.subCard}>
              <div style={styles.grid2}>
                <input
                  type="text"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  placeholder="Certification Name"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  placeholder="Issuing Authority (e.g. AWS, Coursera)"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={newCert.credentialId}
                  onChange={(e) => setNewCert({ ...newCert, credentialId: e.target.value })}
                  placeholder="Credential ID"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={newCert.url}
                  onChange={(e) => setNewCert({ ...newCert, url: e.target.value })}
                  placeholder="Verification URL"
                  style={styles.input}
                />
              </div>
              <button onClick={addCertification} className="btn btn-ghost" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
                + Add Certification
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              {formData.certifications.map((c, idx) => (
                <div key={idx} style={styles.itemRow}>
                  <div>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>{c.name}</strong> {c.issuer && <span style={styles.subText}>— {c.issuer}</span>}
                    {c.credentialId && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ID: {c.credentialId}</div>}
                  </div>
                  <button onClick={() => removeCertification(idx)} className="btn btn-ghost" style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--color-danger)' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Goals & Preferences */}
        {activeSection === 'goals' && (
          <div style={styles.formSection}>
            <h4 style={styles.sectionHeading}>Target Career Roles</h4>
            <div style={styles.addInlineRow}>
              <input
                type="text"
                value={newTargetRole}
                onChange={(e) => setNewTargetRole(e.target.value)}
                placeholder="Add Target Role (e.g. Full Stack Developer, Data Scientist)"
                style={{ ...styles.input, flex: 3 }}
              />
              <button onClick={addTargetRole} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
                + Add Role
              </button>
            </div>

            <div style={styles.chipGrid}>
              {formData.careerGoals.targetRoles.map((r, idx) => (
                <div key={idx} style={styles.skillChip}>
                  <span>{r}</span>
                  <button onClick={() => removeTargetRole(idx)} style={styles.chipRemove}>×</button>
                </div>
              ))}
              {formData.careerGoals.targetRoles.length === 0 && (
                <p style={styles.emptyPrompt}>No target career roles defined yet.</p>
              )}
            </div>

            <h4 style={{ ...styles.sectionHeading, marginTop: 'var(--space-6)' }}>Career Aspiration Summary</h4>
            <textarea
              value={formData.careerGoals.summary}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  careerGoals: { ...formData.careerGoals, summary: e.target.value },
                })
              }
              placeholder="Tell recruiters about your passions, learning goals, and ideal career pathway..."
              style={{ ...styles.input, minHeight: '90px' }}
            />

            <h4 style={{ ...styles.sectionHeading, marginTop: 'var(--space-6)' }}>Work Mode & Location Preferences</h4>
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>Preferred Work Mode</label>
                <select
                  value={formData.preferences.workMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, workMode: e.target.value },
                    })
                  }
                  style={styles.select}
                >
                  <option value="">Any Work Mode</option>
                  {WORK_MODES.map((m) => (
                    <option key={m} value={m}>{m.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Expected Monthly Stipend (₹)</label>
                <input
                  type="number"
                  value={formData.preferences.stipendExpectation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, stipendExpectation: e.target.value },
                    })
                  }
                  placeholder="e.g. 25000"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <label style={styles.label}>Preferred Job Locations</label>
              <div style={styles.addInlineRow}>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Bangalore, Mumbai, Remote"
                  style={{ ...styles.input, flex: 3 }}
                />
                <button onClick={addLocation} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
                  + Add Location
                </button>
              </div>
              <div style={styles.chipGrid}>
                {formData.preferences.locations.map((loc, idx) => (
                  <div key={idx} style={{ ...styles.skillChip, backgroundColor: 'var(--color-sky-light)' }}>
                    <span>{loc}</span>
                    <button onClick={() => removeLocation(idx)} style={styles.chipRemove}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Portfolio Links */}
        {activeSection === 'links' && (
          <div style={styles.formSection}>
            <h4 style={styles.sectionHeading}>Online Presence & Portfolio Links</h4>
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>Resume / CV URL</label>
                <input
                  type="text"
                  value={formData.portfolio.resumeUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      portfolio: { ...formData.portfolio, resumeUrl: e.target.value },
                    })
                  }
                  placeholder="https://drive.google.com/... or Cloudinary URL"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>GitHub Profile</label>
                <input
                  type="text"
                  value={formData.portfolio.github}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      portfolio: { ...formData.portfolio, github: e.target.value },
                    })
                  }
                  placeholder="https://github.com/username"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>LinkedIn Profile</label>
                <input
                  type="text"
                  value={formData.portfolio.linkedin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      portfolio: { ...formData.portfolio, linkedin: e.target.value },
                    })
                  }
                  placeholder="https://linkedin.com/in/username"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Personal Website / Portfolio</label>
                <input
                  type="text"
                  value={formData.portfolio.website}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      portfolio: { ...formData.portfolio, website: e.target.value },
                    })
                  }
                  placeholder="https://myportfolio.dev"
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Action Footer */}
        <div style={{ ...styles.footerRow, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={handlePreviewResume}
            disabled={generatingResume}
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>📄</span>
            {generatingResume ? 'Syncing...' : 'Preview Synced Resume'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ minWidth: '160px' }}
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>

      {/* Structured AI Resume Modal */}
      {resumeData && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.largeModalCard}>
            {/* Modal Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Live Synced AI Resume</h4>
                <span className="badge badge-sky" style={{ fontSize: '10px' }}>
                  {resumeData._meta?.source || 'SUTRA Verified'}
                </span>
                <span className="status-pill status-verified" style={{ fontSize: '11px' }}>
                  <span className="status-pill-dot" />
                  Auto-Synced with Profile & Portfolio
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="btn btn-ghost"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
                >
                  {isEditMode ? 'View Formatted' : 'Edit Text'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyResumeText}
                  className="btn btn-ghost"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
                >
                  {copiedResume ? '✓ Copied' : 'Copy Text'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '4px 12px' }}
                >
                  {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </button>

                <button type="button" onClick={() => setResumeData(null)} style={styles.closeIcon}>×</button>
              </div>
            </div>

            {/* Scrollable Formatted Resume Sheet Area */}
            <div style={styles.resumeScrollArea}>
              <div style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: 'clamp(16px, 4vw, 40px)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                border: '1px solid var(--color-border)',
                margin: '0 auto',
                maxWidth: '740px',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}>
                {/* Header: Name, Target Role, Contact Row */}
                <div style={{ borderBottom: '2px solid #B58863', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 700, color: '#10232A', letterSpacing: '-0.02em' }}>
                    {editableResume?.name || user?.name || 'Student Candidate'}
                  </h2>
                  {editableResume?.targetRole && (
                    <div style={{ fontSize: '0.85rem', color: '#B58863', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      {editableResume.targetRole}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#475569' }}>
                    {editableResume?.email && <span>Email: {editableResume.email}</span>}
                    {editableResume?.phone && <span>Phone: {editableResume.phone}</span>}
                    {editableResume?.location && <span>Location: {editableResume.location}</span>}
                    {editableResume?.links?.github && <span>GitHub: {editableResume.links.github}</span>}
                    {editableResume?.links?.linkedin && <span>LinkedIn: {editableResume.links.linkedin}</span>}
                  </div>
                </div>

                {/* Section 1: Professional Summary */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10232A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                    Professional Summary
                  </div>
                  {isEditMode ? (
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Inline Edit Summary:
                      </span>
                      <textarea
                        rows={3}
                        value={editableResume?.summary || ''}
                        onChange={(e) => setEditableResume({ ...editableResume, summary: e.target.value })}
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                      />
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.55 }}>
                      {editableResume?.summary || 'Candidate is building verified technical competencies.'}
                    </p>
                  )}
                </div>

                {/* Section 2: Technical & Soft Competencies */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10232A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                    Technical & Professional Competencies
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(editableResume?.skills?.technical || []).map((s, i) => (
                      <span
                        key={i}
                        className={`status-pill ${s.verified ? 'status-verified' : ''}`}
                        style={{
                          fontSize: '0.78rem',
                          backgroundColor: s.verified ? '#FAF7F4' : '#f1f5f9',
                          border: '1px solid var(--color-border)',
                          color: '#0f172a',
                        }}
                      >
                        {s.verified && <span className="status-pill-dot" />}
                        {s.name}
                      </span>
                    ))}
                    {(editableResume?.skills?.soft || []).map((s, i) => (
                      <span
                        key={'soft-' + i}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#475569',
                        }}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Section 3: Featured Projects */}
                {editableResume?.projects && editableResume.projects.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10232A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                      Featured Projects & Applied Engineering
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {editableResume.projects.map((p, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{p.title}</strong>
                            {p.link && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)' }}>{p.link}</span>
                            )}
                          </div>
                          {p.techStack && p.techStack.length > 0 && (
                            <div style={{ fontSize: '0.78rem', color: '#B58863', fontWeight: 600, margin: '2px 0 4px 0' }}>
                              Technologies: {p.techStack.join(', ')}
                            </div>
                          )}
                          {isEditMode ? (
                            <textarea
                              rows={2}
                              value={p.description || ''}
                              onChange={(e) => {
                                const updated = [...editableResume.projects];
                                updated[idx] = { ...updated[idx], description: e.target.value };
                                setEditableResume({ ...editableResume, projects: updated });
                              }}
                              style={{ width: '100%', padding: '6px', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                              {p.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Education */}
                {editableResume?.education && editableResume.education.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10232A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                      Education
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {editableResume.education.map((e, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                              {e.degree}{e.branch ? ` in ${e.branch}` : ''}
                            </strong>
                            <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                              {e.institution} {e.score ? `• Score: ${e.score}` : ''}
                            </div>
                          </div>
                          {e.graduationYear && (
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Graduation: {e.graduationYear}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: Certifications & Credentials */}
                {editableResume?.certifications && editableResume.certifications.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10232A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                      Certifications & Credentials
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {editableResume.certifications.map((c, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', color: '#334155' }}>
                          <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                          {c.issuer ? <span style={{ color: '#64748b' }}> — {c.issuer}</span> : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '14px', fontSize: '7.5pt', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  Verified Competencies & Credentials via SUTRA • Synchronized live on {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerCard: { backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' },
  badgeRow: { display: 'flex', gap: 'var(--space-2)' },
  subText: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' },
  meterContainer: { minWidth: '160px', flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  meterHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  meterTitle: { fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' },
  meterTrack: { height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-border)', overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: '4px', transition: 'width var(--transition-base)' },
  meterHint: { fontSize: '10px', color: 'var(--color-text-muted)' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-3)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
  subNavBar: { display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-3)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' },
  subTabButton: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--color-text-secondary)', backgroundColor: 'transparent', border: '1px solid transparent', cursor: 'pointer', transition: 'all var(--transition-fast)', whiteSpace: 'nowrap' },
  activeSubTab: { backgroundColor: 'var(--color-mist-light)', color: 'var(--color-burgundy-red)', borderColor: 'var(--color-border)', fontWeight: '600' },
  bodyCard: { backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  formSection: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
  sectionHeading: { fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-1)' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-3)' },
  label: { display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' },
  input: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-app)' },
  select: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-app)' },
  addInlineRow: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center' },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'var(--space-2)' },
  skillChip: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-sky-light)', fontSize: 'var(--font-size-xs)', border: '1px solid rgba(141, 161, 185, 0.3)' },
  chipRemove: { background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'inherit', padding: 0, fontSize: '13px' },
  emptyPrompt: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' },
  subCard: { padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-mist-light)' },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)' },
  footerRow: { marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: 'var(--space-4)',
  },
  largeModalCard: {
    width: '100%',
    maxWidth: '860px',
    maxHeight: '92vh',
    overflowY: 'auto',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  resumeScrollArea: {
    maxHeight: 'calc(80vh - 80px)',
    overflowY: 'auto',
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
  },
  closeIcon: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    lineHeight: '1',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    padding: '0 4px',
  },
};

export default StudentProfileView;
