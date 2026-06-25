import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { resumeAPI, userAPI } from '../../services/api';

/* ─── Utility ─────────────────────────────────────────────────────────── */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const scoreColor = (pct) => {
  if (pct >= 80) return { text: '#22c55e', bg: '#dcfce7', bar: '#22c55e' };
  if (pct >= 60) return { text: '#f59e0b', bg: '#fef3c7', bar: '#f59e0b' };
  return { text: '#ef4444', bg: '#fee2e2', bar: '#ef4444' };
};

const scoreLabel = (pct) => {
  if (pct >= 85) return 'Excellent';
  if (pct >= 70) return 'Good';
  if (pct >= 50) return 'Fair';
  return 'Needs Work';
};

/* ─── Circular Score Gauge ─────────────────────────────────────────────── */
const ScoreGauge = ({ score }) => {
  const r = 72;
  const circ = 2 * Math.PI * r;
  const pct = clamp(score, 0, 100);
  const offset = circ - (pct / 100) * circ;
  const { text, bar } = scoreColor(pct);

  return (
    <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
      <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="90" cy="90" r={r} fill="none"
          stroke={bar} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: text, lineHeight: 1 }}>{pct}</span>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>/ 100</span>
        <span style={{
          marginTop: 4, fontSize: 12, fontWeight: 700, color: text,
          background: scoreColor(pct).bg, padding: '2px 8px', borderRadius: 20,
        }}>{scoreLabel(pct)}</span>
      </div>
    </div>
  );
};

/* ─── Mini Score Bar ───────────────────────────────────────────────────── */
const ScoreBar = ({ label, score, maxScore, icon }) => {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const { bar, text } = scoreColor(pct);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
          <span style={{ fontSize: 15 }}>{icon}</span>{label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{score}/{maxScore}</span>
      </div>
      <div style={{ height: 7, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: bar, borderRadius: 8,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
};

/* ─── Chip ─────────────────────────────────────────────────────────────── */
const Chip = ({ label, variant = 'green' }) => {
  const styles = {
    green:  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    red:    { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    blue:   { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    purple: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
    amber:  { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  };
  const s = styles[variant] || styles.blue;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 11px', borderRadius: 20, fontSize: 12,
      fontWeight: 600, background: s.bg, color: s.text,
      border: `1px solid ${s.border}`, margin: '3px 4px 3px 0',
    }}>{label}</span>
  );
};

/* ─── Section Card ─────────────────────────────────────────────────────── */
const Card = ({ title, icon, children, accent = '#6366f1' }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
    padding: '22px 24px', marginBottom: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
      }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
    </div>
    {children}
  </div>
);

/* ─── Section Checkbox ─────────────────────────────────────────────────── */
const SectionCheck = ({ label, checked }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <div style={{
      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
      background: checked ? '#22c55e' : '#f3f4f6',
      border: `2px solid ${checked ? '#16a34a' : '#d1d5db'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, color: '#fff',
    }}>{checked ? '✓' : '✗'}</div>
    <span style={{ fontSize: 13, color: checked ? '#15803d' : '#9ca3af', fontWeight: checked ? 600 : 400 }}>{label}</span>
  </div>
);

/* ─── List Item ────────────────────────────────────────────────────────── */
const ListItem = ({ text, variant = 'neutral' }) => {
  const colors = { green: '#16a34a', red: '#dc2626', neutral: '#4b5563', blue: '#2563eb' };
  const bullets = { green: '✓', red: '✗', neutral: '→', blue: '•' };
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ color: colors[variant], fontWeight: 700, flexShrink: 0, fontSize: 14, marginTop: 1 }}>
        {bullets[variant]}
      </span>
      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0 }}>{text}</p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const AtsAnalyzer = ({ inTab = false }) => {
  const navigate = useNavigate();

  /* ─── Input state ─────── */
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'text'
  const [useStoredResume, setUseStoredResume] = useState(true);
  const [hasStoredResume, setHasStoredResume] = useState(false);
  const fileRef = useRef(null);

  /* ─── UI state ─────────── */
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(''); // '', 'extracting', 'analyzing'
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const profileRes = await userAPI.getProfile().catch(() => null);
        const savedResumeText = profileRes?.user?.resume?.text || '';
        const savedExists = savedResumeText.trim().length > 30;
        if (isActive) {
          setHasStoredResume(savedExists);
          if (!savedExists) setUseStoredResume(false);
        }
      } catch {
        if (isActive) {
          setHasStoredResume(false);
          setUseStoredResume(false);
        }
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, []);

  /* ─── Handlers ─────────── */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF or DOCX files are allowed.');
      return;
    }
    setResumeFile(file);
    setError('');
  }, []);

  const handleAnalyze = async () => {
    setError('');
    setResult(null);

    // Validate inputs
    const hasFile = inputMode === 'file' && resumeFile;
    const hasJD = jobDescription.trim().length > 30;

    if (useStoredResume) {
      if (!hasStoredResume) {
        setError('No saved resume found in your profile. Please upload a resume file instead.');
        return;
      }
    } else if (!hasFile) {
      setError('Please upload a resume file when using your current resume is turned off.');
      return;
    }

    if (!hasJD) {
      setError('Please paste the job description before analyzing.');
      return;
    }

    setLoading(true);
    try {
      setStep('extracting');
      // Give a brief visual moment for Step 1 indicator
      await new Promise(r => setTimeout(r, 600));
      setStep('analyzing');

      const data = await resumeAPI.atsAnalyze({
        file: hasFile ? resumeFile : null,
        jobDescription,
        useStoredResume,
      });

      setResult(data);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('ats-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  /* ─── Derived ─────────── */
  const jdLen = jobDescription.length;
  const hasJD = jdLen > 30;
  const hasResumeSource = useStoredResume ? hasStoredResume : (inputMode === 'file' && !!resumeFile);
  const canAnalyze = hasResumeSource && hasJD && !loading;

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: inTab ? 'auto' : '100vh', background: 'var(--color-background, #f8fafc)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!inTab && <Header />}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: inTab ? '24px 20px 60px' : '32px 20px 60px' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}>🎯</div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
                  ATS Resume Analyzer
                </h1>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, marginTop: 2 }}>
                  Two-step AI pipeline — extract JD requirements, then score your resume against them
                </p>
              </div>
            </div>
          </div>
          {!inTab && (
            <button
              onClick={() => navigate('/resume-tools')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}
            >
              ← Resume Builder
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>

          {/* ══ LEFT: Input Panel ══ */}
          <div>

            {/* Pipeline Steps Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: 16, padding: '18px 22px', marginBottom: 20, color: '#fff',
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
                Two-Step AI Pipeline
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                  { n: '1', label: 'Extract JD Requirements', icon: '📋' },
                  { n: '→', label: '', icon: '' },
                  { n: '2', label: 'Score Resume vs JD', icon: '🎯' },
                ].map((s, i) => s.n === '→' ? (
                  <span key={i} style={{ fontSize: 18, opacity: 0.6 }}>→</span>
                ) : (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 12px',
                  }}>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7 }}>STEP {s.n}</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Resume Input ── */}
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
              padding: '22px 24px', marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: '#dbeafe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>📄</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Your Resume</h3>
              </div>

              {/* Use stored resume toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: useStoredResume ? '#ede9fe' : '#f9fafb',
                border: `1.5px solid ${useStoredResume ? '#c4b5fd' : '#e5e7eb'}`,
              }}>
                <input
                  type="checkbox"
                  checked={useStoredResume}
                  onChange={e => setUseStoredResume(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#7c3aed', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: useStoredResume ? '#7c3aed' : '#374151' }}>
                    Use current resume from database
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    Uses the resume already stored in your profile
                  </div>
                </div>
              </label>

              {useStoredResume ? (
                <div style={{
                  border: '1.5px solid #ddd6fe',
                  background: '#f5f3ff',
                  color: '#5b21b6',
                  borderRadius: 12,
                  padding: '16px 14px',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}>
                  {hasStoredResume
                    ? 'Your current resume from the database will be used for ATS analysis. Turn this off to upload a new resume file.'
                    : 'No saved resume was found in your profile. Turn this off and upload a resume file to analyze.'}
                </div>
              ) : (
                <div>
                  <label
                    onClick={() => fileRef.current?.click()}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      border: `2px dashed ${resumeFile ? '#6366f1' : '#d1d5db'}`,
                      borderRadius: 12, padding: '24px 16px', cursor: 'pointer',
                      background: resumeFile ? '#ede9fe' : '#f9fafb',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 32, marginBottom: 8 }}>{resumeFile ? '✅' : '📁'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: resumeFile ? '#7c3aed' : '#374151' }}>
                      {resumeFile ? resumeFile.name : 'Click to upload PDF or DOCX'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Max 5 MB · Upload a new resume file for analysis</span>
                  </label>
                  <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* ── Job Description ── */}
            <div style={{
              background: '#fff', borderRadius: 16, border: '1.5px solid #e5e7eb',
              padding: '22px 24px', marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, background: '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                  }}>📋</div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Job Description</h3>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Required for ATS analysis</p>
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                  background: hasJD ? '#dcfce7' : '#fee2e2',
                  color: hasJD ? '#15803d' : '#b91c1c',
                }}>{hasJD ? '✓ Ready' : 'Required'}</span>
              </div>

              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder={`Paste the full job description here...\n\nExample:\nWe are looking for a Software Engineer with experience in React, Node.js, and AWS. The candidate should have strong communication skills and be comfortable working in an Agile environment...`}
                rows={10}
                style={{
                  width: '100%', borderRadius: 10,
                  border: `1.5px solid ${hasJD ? '#86efac' : '#e5e7eb'}`,
                  padding: '12px 14px', fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', color: '#374151',
                  background: hasJD ? '#f0fdf4' : '#f9fafb',
                  boxSizing: 'border-box', transition: 'border-color 0.2s, background 0.2s',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {hasJD ? '✓ JD will trigger 2-step pipeline for higher accuracy' : 'Add JD to enable job-specific scoring'}
                </span>
                <span style={{ fontSize: 11, color: jdLen > 4500 ? '#ef4444' : '#9ca3af' }}>{jdLen} / 5000</span>
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div style={{
                background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 12,
                padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13, fontWeight: 600,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* ── Analyze Button ── */}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              style={{
                width: '100%', padding: '15px 24px', borderRadius: 14, border: 'none', cursor: canAnalyze ? 'pointer' : 'not-allowed',
                background: canAnalyze ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#c7d2fe',
                color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
                boxShadow: canAnalyze ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 18 }}>⟳</span>
                  <span>
                    {step === 'extracting' ? 'Step 1: Extracting JD Requirements...' : 'Step 2: Analyzing Resume...'}
                  </span>
                </>
              ) : (
                <>🎯 Analyze Resume{hasJD ? ' Against JD' : ''}</>
              )}
            </button>

            {/* Step indicator during loading */}
            {loading && (
              <div style={{
                marginTop: 14, padding: '12px 16px', borderRadius: 12,
                background: '#ede9fe', border: '1.5px solid #c4b5fd',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {[
                    { label: 'Extract JD', active: step === 'extracting', done: step === 'analyzing' },
                    { label: 'ATS Score', active: step === 'analyzing', done: false },
                  ].map((s, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span style={{ color: '#a78bfa', fontSize: 16 }}>→</span>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          background: s.done ? '#22c55e' : s.active ? '#7c3aed' : '#e5e7eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, color: '#fff', fontWeight: 700,
                        }}>{s.done ? '✓' : s.active ? '…' : '○'}</div>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: s.done ? '#15803d' : s.active ? '#7c3aed' : '#9ca3af',
                        }}>{s.label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT: Results Panel ══ */}
          {result && (
            <div id="ats-results">

              {/* JD Extraction Badge */}
              {result.jdExtracted && (
                <div style={{
                  background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                  border: '1.5px solid #86efac', borderRadius: 12,
                  padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Two-step pipeline completed</div>
                    <div style={{ fontSize: 11, color: '#166534' }}>
                      JD requirements extracted → Resume scored against them
                    </div>
                  </div>
                </div>
              )}

              {/* ── Score Gauge ── */}
              <div style={{
                background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
                padding: '28px 24px', marginBottom: 20, textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
                  Overall ATS Score
                </p>
                <ScoreGauge score={result.atsScore} />
                {result.summary && (
                  <p style={{
                    marginTop: 16, fontSize: 13, color: '#4b5563', lineHeight: 1.6,
                    background: '#f9fafb', borderRadius: 10, padding: '10px 14px', textAlign: 'left',
                  }}>{result.summary}</p>
                )}
              </div>

              {/* ── Score Breakdown ── */}
              <Card title="Score Breakdown" icon="📊" accent="#6366f1">
                <ScoreBar label="Skill Match"           score={result.skillMatchScore}      maxScore={30} icon="💻" />
                <ScoreBar label="Experience Relevance"  score={result.experienceScore}       maxScore={20} icon="💼" />
                <ScoreBar label="Project Relevance"     score={result.projectScore}          maxScore={15} icon="🚀" />
                <ScoreBar label="Keyword Coverage"      score={result.keywordCoverageScore}  maxScore={20} icon="🔑" />
                <ScoreBar label="Education"             score={result.educationScore}        maxScore={5}  icon="🎓" />
                <ScoreBar label="Resume Structure"      score={result.structureScore}        maxScore={5}  icon="📐" />
                <ScoreBar label="Quality & Clarity"     score={result.qualityScore}          maxScore={5}  icon="✨" />
              </Card>

              {/* ── Skills ── */}
              <Card title="Skills Analysis" icon="💡" accent="#10b981">
                {result.matchedSkills?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>
                      ✓ Matched Skills ({result.matchedSkills.length})
                    </p>
                    <div>{result.matchedSkills.map((s, i) => <Chip key={i} label={s} variant="green" />)}</div>
                  </div>
                )}
                {result.missingSkills?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>
                      ✗ Missing Skills ({result.missingSkills.length})
                    </p>
                    <div>{result.missingSkills.map((s, i) => <Chip key={i} label={s} variant="red" />)}</div>
                  </div>
                )}
              </Card>

              {/* ── Keywords ── */}
              {(result.matchedKeywords?.length > 0 || result.missingKeywords?.length > 0) && (
                <Card title="Keyword Coverage" icon="🔑" accent="#f59e0b">
                  {result.matchedKeywords?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: '0 0 8px' }}>Found in Resume</p>
                      <div>{result.matchedKeywords.map((k, i) => <Chip key={i} label={k} variant="green" />)}</div>
                    </div>
                  )}
                  {result.missingKeywords?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', margin: '0 0 8px' }}>Not Found in Resume</p>
                      <div>{result.missingKeywords.map((k, i) => <Chip key={i} label={k} variant="red" />)}</div>
                    </div>
                  )}
                </Card>
              )}

              {/* ── Strengths & Weaknesses ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {result.strengths?.length > 0 && (
                  <div style={{
                    background: '#f0fdf4', borderRadius: 14, border: '1px solid #86efac', padding: '18px 16px',
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      💪 Strengths
                    </p>
                    {result.strengths.map((s, i) => <ListItem key={i} text={s} variant="green" />)}
                  </div>
                )}
                {result.weaknesses?.length > 0 && (
                  <div style={{
                    background: '#fff7ed', borderRadius: 14, border: '1px solid #fcd34d', padding: '18px 16px',
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#b45309', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⚠️ Weaknesses
                    </p>
                    {result.weaknesses.map((w, i) => <ListItem key={i} text={w} variant="red" />)}
                  </div>
                )}
              </div>

              {/* ── Recommendations ── */}
              {result.recommendations?.length > 0 && (
                <Card title="Actionable Recommendations" icon="🎯" accent="#6366f1">
                  {result.recommendations.map((r, i) => <ListItem key={i} text={r} variant="blue" />)}
                </Card>
              )}

              {/* ── Resume Sections ── */}
              {result.resumeSections && Object.keys(result.resumeSections).length > 0 && (
                <Card title="Resume Sections Detected" icon="📐" accent="#8b5cf6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {Object.entries(result.resumeSections).map(([key, val]) => (
                      <SectionCheck
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        checked={Boolean(val)}
                      />
                    ))}
                  </div>
                </Card>
              )}

              {/* ── Learning & Career Path (the complete flow) ── */}
              {(result.missingSkills?.length > 0 || result.recommendedLearningTopics?.length > 0 || result.recommendedInternshipDomains?.length > 0) && (
                <div style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
                  borderRadius: 16, padding: '24px', marginBottom: 20,
                  boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: 24 }}>🚀</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Your Career Growth Path</h3>
                      <p style={{ fontSize: 12, color: '#a5b4fc', margin: 0, marginTop: 2 }}>
                        Bridge skill gaps → learn the right topics → target the right internships
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Missing Skills */}
                    {result.missingSkills?.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>
                          🔴 Skills to Acquire
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {result.missingSkills.map((s, i) => (
                            <span key={i} style={{
                              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                              background: 'rgba(252,165,165,0.2)', color: '#fca5a5',
                              border: '1px solid rgba(252,165,165,0.3)',
                            }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Arrow connector */}
                    {result.recommendedLearningTopics?.length > 0 && (
                      <div style={{ textAlign: 'center', color: '#a5b4fc', fontSize: 20 }}>↓</div>
                    )}

                    {/* Learning Topics */}
                    {result.recommendedLearningTopics?.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>
                          📚 Recommended Learning Topics
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {result.recommendedLearningTopics.map((topic, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                background: 'rgba(147,197,253,0.3)', color: '#93c5fd',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700,
                              }}>{i + 1}</span>
                              <span style={{ fontSize: 13, color: '#e0e7ff', fontWeight: 500 }}>{topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Arrow connector */}
                    {result.recommendedInternshipDomains?.length > 0 && (
                      <div style={{ textAlign: 'center', color: '#a5b4fc', fontSize: 20 }}>↓</div>
                    )}

                    {/* Internship Domains */}
                    {result.recommendedInternshipDomains?.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>
                          🎯 Target Internship Domains
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {result.recommendedInternshipDomains.map((domain, i) => (
                            <button
                              key={i}
                              onClick={() => navigate('/internship-recommendations')}
                              style={{
                                padding: '7px 16px', borderRadius: 22, fontSize: 13, fontWeight: 700,
                                background: 'linear-gradient(135deg, rgba(134,239,172,0.25), rgba(52,211,153,0.2))',
                                color: '#86efac', border: '1.5px solid rgba(134,239,172,0.4)',
                                cursor: 'pointer', transition: 'all 0.2s',
                              }}
                            >
                              {domain} →
                            </button>
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: '#a5b4fc', marginTop: 10, margin: '10px 0 0' }}>
                          Click any domain to explore matching internships →
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── JD Requirements (collapsible) ── */}
              {result.jdExtracted && result.jdRequirements && (
                <details style={{ marginBottom: 20 }}>
                  <summary style={{
                    cursor: 'pointer', padding: '12px 16px', borderRadius: 12,
                    background: '#f9fafb', border: '1px solid #e5e7eb',
                    fontSize: 13, fontWeight: 700, color: '#374151',
                    display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none',
                  }}>
                    📋 View Extracted JD Requirements (Step 1 output)
                  </summary>
                  <div style={{
                    padding: '16px', background: '#f9fafb', borderRadius: '0 0 12px 12px',
                    border: '1px solid #e5e7eb', borderTop: 'none',
                  }}>
                    {Object.entries(result.jdRequirements).map(([key, val]) =>
                      Array.isArray(val) && val.length > 0 ? (
                        <div key={key} style={{ marginBottom: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px' }}>
                            {key.replace(/([A-Z])/g, ' $1')}
                          </p>
                          <div>{val.map((v, i) => <Chip key={i} label={v} variant="blue" />)}</div>
                        </div>
                      ) : null
                    )}
                  </div>
                </details>
              )}

              {/* ── Re-analyze button ── */}
              <button
                onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer',
                }}
              >
                ↩ Analyze Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AtsAnalyzer;
