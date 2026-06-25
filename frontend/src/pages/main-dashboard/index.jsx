import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import HelpDeskWidget from '../../components/ui/HelpDeskWidget';
import RecommendationPreview from './components/RecommendationPreview';
import QuickActions from './components/QuickActions';
import InternshipDetailModal from '../internship-recommendations/InternshipDetailModal';
import { userAPI, internshipAPI, resumeAPI } from '../../services/api';
import { calcProfileCompletion } from '../../utils/profileCompletion';
import {
  Terminal, User, Upload, FileText, Award, Briefcase,
  MapPin, Code, Building2, CheckCircle2, AlertCircle,
  Loader2, X, Plus, Zap,
} from 'lucide-react';

/* ─── Circular Progress ──────────────────────────────────────────────────── */
const CircularProgress = ({ pct }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-muted" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="url(#cpg)" strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <defs>
          <linearGradient id="cpg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-extrabold text-foreground">{pct}%</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-primary">COMPLETE</span>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════ */
const MainDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData]         = useState({ name: '', profileCompletion: 0 });
  const [userSkills, setUserSkills]     = useState([]);
  const [internships, setInternships]   = useState([]);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [selectedInternship, setSelectedInternship] = useState(null);

  /* resume upload state */
  const [resumeFile, setResumeFile]       = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  /* ATS score state (loaded from DB on mount) */
  const [atsScore, setAtsScore]           = useState(null);
  const [atsSkills, setAtsSkills]         = useState([]);

  const resumeInputRef = useRef(null);
  const loadedRef      = useRef(false);

  const handleNavigate = (r) => navigate(r);

  /* ── load profile ──────────────────────────────────────────────────────── */
  const loadUserProfile = async () => {
    try {
      const profileRes = await userAPI.getProfile();
      if (profileRes?.user) {
        const user    = profileRes.user;
        const profile = user?.profile || {};
        const resumeSkills  = Array.isArray(user?.resume?.skills) ? user.resume.skills : [];
        const profileSkills = Array.isArray(profile?.skills)       ? profile.skills    : [];
        const combinedSkills = resumeSkills.length > 0 ? resumeSkills : profileSkills;
        const completion = calcProfileCompletion(profile, user);
        setUserData({ name: user?.name, email: user?.email, profile, profileCompletion: completion });
        setUserSkills(combinedSkills);
        const resume    = user?.resume;
        const hasResume = Boolean(resume?.text || resume?.fileName) ||
          (Array.isArray(resume?.skills) && resume.skills.length > 0);
        setResumeUploaded(hasResume);
        setResumeFileName(resume?.fileName || '');
        // Restore saved ATS score so user sees it without re-uploading
        if (typeof resume?.atsScore === 'number' && resume.atsScore > 0) {
          setAtsScore(resume.atsScore);
          setAtsSkills(resume.skills || []);
        }
        return user;
      }
    } catch (e) { console.error('Profile load error', e); }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/user-login'); return; }
    const load = async () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      try {
        const user    = await loadUserProfile();
        const profile = user?.profile || {};
        const resumeSkills  = Array.isArray(user?.resume?.skills) ? user.resume.skills : [];
        const profileSkills = Array.isArray(profile?.skills)       ? profile.skills    : [];
        const skills  = resumeSkills.length > 0 ? resumeSkills : profileSkills;
        const latestRes = await internshipAPI.getLatestInternships({
          skills, location: profile?.location || '', domain: profile?.sector || '',
        }).catch(() => null);
        setInternships(Array.isArray(latestRes?.internships) ? latestRes.internships : []);
      } catch (e) { console.error('Dashboard load error', e); }
    };
    load();
  }, [navigate]);

  /* ── resume file select ──────────────────────────────────────────────── */
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!valid.includes(f.type)) { setUploadError('Only PDF or DOCX allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { setUploadError('File must be under 5 MB'); return; }
    setResumeFile(f);
    setUploadError('');
    setUploadSuccess('');
  };

  /* ── Upload resume to DB (uses /analyze which saves text+skills+atsScore) */
  const handleUploadResume = async () => {
    if (!resumeFile) { setUploadError('Choose a file first'); return; }
    setUploading(true); setUploadError(''); setUploadSuccess('');
    try {
      const data = await resumeAPI.analyze(resumeFile);
      const score = data.atsScore ?? data.profileStrength ?? 0;
      setResumeUploaded(true);
      setResumeFileName(resumeFile.name);
      setAtsScore(Math.round(score));
      setAtsSkills(data?.resume?.skills || []);
      setUploadSuccess(`✅ Resume uploaded & saved! ATS Score: ${Math.round(score)}%`);
      setResumeFile(null);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      await loadUserProfile();
    } catch (err) {
      setUploadError(err.message || 'Upload failed — please try again.');
    } finally { setUploading(false); }
  };

  const pct   = Math.max(0, Math.min(100, userData.profileCompletion || 0));
  const stats = [
    { icon: Briefcase, label: 'Internships', value: internships.length || 0 },
    { icon: Code,      label: 'Skills',      value: userSkills.length       },
    { icon: Building2, label: 'Sector',      value: userData?.profile?.sector   || '—' },
    { icon: MapPin,    label: 'Location',    value: userData?.profile?.location || '—' },
  ];

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {selectedInternship && (
        <InternshipDetailModal
          internship={selectedInternship}
          onClose={() => setSelectedInternship(null)}
        />
      )}

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* ═══ TWO-COLUMN LAYOUT ═══════════════════════════════════════ */}
        <div className="flex flex-col xl:flex-row gap-4 md:gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4 md:space-y-5">

            {/* ── OVERVIEW TERMINAL ── */}
            <div className="bg-card border border-border rounded-2xl shadow-elevation-1 overflow-hidden">
              {/* Gradient header accent */}
              <div className="h-1 w-full gradient-primary" />
              <div className="p-4 sm:p-5 md:p-7">
                {/* Label */}
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                    Overview Terminal
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-2">
                      Welcome Back,{' '}
                      <span className="text-gradient">{userData.name || 'Intern'}!</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mb-4 md:mb-5 leading-relaxed">
                      Your internship matchmaking parameters are operational. Complete your
                      profile checklist to unlock higher-tier recommendations.
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <button
                        onClick={() => navigate('/user-profile-management')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 gradient-primary text-white shadow-elevation-1"
                      >
                        <Zap className="w-4 h-4" /> Update Profile
                      </button>
                    </div>
                  </div>

                  {/* Circular progress — hidden on very small screens, visible sm+ */}
                  <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                    <CircularProgress pct={pct} />
                    <span className="text-xs font-medium text-muted-foreground">Profile Completion</span>
                  </div>
                </div>

                {/* Mobile progress bar (shown only on xs) */}
                <div className="sm:hidden mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Profile Completion</span>
                    <span className="text-xs font-bold text-primary">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-primary transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stat chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 ${
                        i % 2 === 0 && i !== stats.length - 1 ? 'border-r border-border' : ''
                      } ${i < 2 ? 'border-b sm:border-b-0 border-border' : ''} ${
                        i !== 0 && i !== 2 ? 'sm:border-l sm:border-border' : ''
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                        <div className="text-xs sm:text-sm font-bold text-foreground truncate">{s.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── DOCUMENT VAULT + ATS SCORECARD ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">

              {/* ── Document Vault ── */}
              <div className="bg-card border border-border rounded-2xl shadow-elevation-1 p-4 sm:p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Document Vault</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Resume Status</h2>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* Status badge */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm font-semibold ${
                  resumeUploaded
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-warning/10 text-warning border border-warning/20'
                }`}>
                  {resumeUploaded ? (
                    <><CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{resumeFileName || 'Resume uploaded'}</span>
                    </>
                  ) : (
                    <><AlertCircle className="w-4 h-4 shrink-0" /> No resume uploaded yet</>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  id="dash-resume-upload"
                  onChange={handleFileSelect}
                />

                {/* Selected file preview */}
                {resumeFile ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg mb-3 bg-primary/5 border border-primary/20">
                    <FileText className="w-4 h-4 shrink-0 text-primary" />
                    <span className="flex-1 text-xs font-medium truncate text-foreground">{resumeFile.name}</span>
                    <button
                      onClick={() => { setResumeFile(null); if (resumeInputRef.current) resumeInputRef.current.value = ''; }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Upload button — always visible */
                  <label
                    htmlFor="dash-resume-upload"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl cursor-pointer text-sm font-bold mb-3 transition-all duration-200 active:scale-95 bg-muted hover:bg-muted/70 text-foreground border border-dashed border-primary/40 hover:border-primary"
                  >
                    <Upload className="w-4 h-4 text-primary" />
                    {resumeUploaded ? 'Replace Resume (PDF/DOCX)' : 'Upload Resume (PDF/DOCX)'}
                  </label>
                )}

                {/* Upload + Save to DB button */}
                {resumeFile && (
                  <button
                    onClick={handleUploadResume}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-60 gradient-primary text-white shadow-elevation-1 mb-2"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading &amp; Saving…</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload &amp; Save to Profile</>
                    )}
                  </button>
                )}

                {/* Feedback messages */}
                {uploadError && (
                  <p className="text-xs mt-1 text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {uploadError}
                  </p>
                )}
                {uploadSuccess && (
                  <p className="text-xs mt-1 text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> {uploadSuccess}
                  </p>
                )}

                {/* Supported formats note */}
                <p className="text-[10px] text-muted-foreground mt-auto pt-3">PDF or DOCX · Max 5 MB · Saved to your profile</p>
              </div>

              {/* ── ATS Scorecard ── */}
              <div className="bg-card border border-border rounded-2xl shadow-elevation-1 p-4 sm:p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Award className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">ATS Scorecard</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Resume Score</h2>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {atsScore !== null ? (
                  /* ── Score Display ── */
                  <div className="flex flex-col gap-2 flex-1">
                    <div
                      className="text-4xl sm:text-5xl font-black mb-1 leading-none"
                      style={{
                        background: atsScore >= 70
                          ? 'linear-gradient(135deg,#34d399,#10b981)'
                          : atsScore >= 40
                          ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                          : 'linear-gradient(135deg,#f87171,#ef4444)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {atsScore}%
                    </div>

                    {/* Score bar */}
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${atsScore}%`,
                          background: atsScore >= 70
                            ? 'linear-gradient(90deg,#34d399,#10b981)'
                            : atsScore >= 40
                            ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                            : 'linear-gradient(90deg,#f87171,#ef4444)',
                        }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {atsScore >= 70 ? '✅ Strong ATS compatibility'
                        : atsScore >= 40 ? '⚠️ Needs improvement — optimize keywords'
                        : '❌ Low score — major improvements needed'}
                    </p>

                    {/* Detected skills */}
                    {atsSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {atsSkills.slice(0, 5).map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold badge-primary">{sk}</span>
                        ))}
                        {atsSkills.length > 5 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-muted-foreground bg-muted">
                            +{atsSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Improve score CTA */}
                    <button
                      onClick={() => navigate('/ats-analyzer')}
                      className="mt-auto w-full py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" /> Run Full ATS Analysis →
                    </button>
                  </div>
                ) : (
                  /* ── No Score Yet ── */
                  <div className="flex flex-col items-center justify-center py-2 text-center gap-3 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                      <Award className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">No ATS score yet</p>
                      <p className="text-xs text-muted-foreground">
                        {resumeUploaded
                          ? 'Your resume is saved — run ATS analysis to get your score'
                          : 'Upload your resume first, then calculate your ATS score'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/ats-analyzer')}
                      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 gradient-primary text-white shadow-elevation-1 flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      {resumeUploaded ? 'Calculate ATS Score →' : 'Go to ATS Analyzer →'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── AI RECOMMENDED INTERNSHIPS ── */}
            <RecommendationPreview
              internships={internships}
              userSkills={userSkills}
              onSelectInternship={(it) => setSelectedInternship(it)}
            />
          </div>

          {/* ── RIGHT COLUMN — Quick Actions (sticky on xl) ─────────── */}
          <div className="w-full xl:w-[300px] 2xl:w-[320px] shrink-0 space-y-4 md:space-y-5">
            {/* On mobile show below; on xl sticky */}
            <div className="xl:sticky xl:top-6 space-y-4 md:space-y-5">
              <QuickActions onNavigate={handleNavigate} />

              {/* Mini profile card */}
              <div className="bg-card border border-border rounded-2xl shadow-elevation-1 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{userData.name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{userData.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Profile Completion</span>
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full gradient-primary transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <button
                  onClick={() => navigate('/user-profile-management')}
                  className="w-full py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all duration-200 active:scale-95"
                >
                  Complete Profile →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <HelpDeskWidget />
    </div>
  );
};

export default MainDashboard;