import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewRoom from '../../components/interview/InterviewRoom';
import { startInterview } from '../../services/interviewApi';
import Skeleton from '../../components/ui/Skeleton';
import FinalReport from '../../components/interview/FinalReport';
import axios from '../../utils/axios';
import Header from '../../components/ui/Header';

const ROLE_LIST = {
    "Software / Tech": [
        "Java Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "React Developer", "Node.js Developer", "Python Developer", "Software Engineer (Fresher)",
        "Web Developer", "Mobile App Developer", "Android Developer", "QA Tester",
        "Software Tester", "DevOps Intern", "Cloud Intern"
    ],
    "Data / AI": [
        "Data Analyst", "Data Science Intern", "Machine Learning Intern", "AI Intern",
        "Business Analyst", "Data Entry Analyst"
    ],
    "Design": [
        "UI UX Designer", "Graphic Designer", "Product Designer", "Motion Designer", "Video Editor"
    ],
    "Marketing": [
        "Digital Marketing Executive", "Social Media Manager", "SEO Executive", "Content Writer",
        "Copywriter", "Performance Marketing Intern"
    ],
    "Business / Non-Tech": [
        "HR Executive", "HR Intern", "Sales Executive", "Business Development Executive",
        "Operations Executive", "Customer Support Executive"
    ],
    "Trending": [
        "AI Prompt Engineer", "No-Code Developer", "Automation Specialist", "Chatbot Developer",
        "AI Content Creator"
    ]
};

const ALL_ROLES = Object.values(ROLE_LIST).flat();

/* ── Score colour helper ── */
const scoreColor = (s) =>
    s >= 85 ? 'text-emerald-600' : s >= 70 ? 'text-blue-600' : s >= 55 ? 'text-amber-600' : 'text-red-500';
const scoreBg = (s) =>
    s >= 85 ? 'bg-emerald-50 border-emerald-200' : s >= 70 ? 'bg-blue-50 border-blue-200' : s >= 55 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
const gradeLabel = (s) =>
    s >= 85 ? 'Excellent 🌟' : s >= 70 ? 'Good 👍' : s >= 55 ? 'Fair 📈' : 'Needs Work 💪';

/* ── Suggestion Modal ── */
const SuggestionModal = ({ isOpen, onClose, roleSuggestions, onSelect }) => {
    if (!isOpen) return null;
    const recommendations = (roleSuggestions && roleSuggestions.length > 0)
        ? roleSuggestions.map(r => ({ role: r, icon: '🎯', color: 'from-blue-500 to-indigo-600' }))
        : [
            { role: 'Full Stack Engineer', icon: '⚡', color: 'from-blue-500 to-indigo-600' },
            { role: 'Backend Developer', icon: '⚙️', color: 'from-slate-700 to-slate-900' },
            { role: 'Frontend React Developer', icon: '⚛️', color: 'from-cyan-400 to-blue-500' },
            { role: 'Data Scientist', icon: '📊', color: 'from-purple-500 to-pink-500' },
        ];
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                <div className="shrink-0 p-6 sm:p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-indigo-100 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-indigo-400 hover:bg-white hover:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-3xl">🤖</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Role check!</h2>
                    <p className="text-gray-500 font-medium text-sm">The AI needs a clear job role to generate relevant questions. Try one of these:</p>
                </div>
                <div className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
                    {recommendations.map((rec) => (
                        <button key={rec.role} onClick={() => onSelect(rec.role)}
                            className="group flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all text-left">
                            <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${rec.color} flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 transition-transform`}>
                                {rec.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-black text-gray-800">{rec.role}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">AI Optimized Path</div>
                            </div>
                            <svg className="shrink-0 w-5 h-5 text-indigo-200 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    ))}
                </div>
                <div className="shrink-0 px-6 py-5 bg-slate-50 border-t border-slate-100">
                    <button onClick={onClose} className="w-full py-3.5 text-sm font-black text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-200">
                        I'll type mine correctly
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Recent Reports Panel ── */
const RecentReports = ({ reports, loading, onViewReport }) => {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-3 bg-slate-200 rounded w-1/2" />
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!reports || reports.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <div className="text-4xl mb-3">🎤</div>
                <p className="text-sm font-bold text-slate-700">No interviews yet</p>
                <p className="text-xs text-slate-400 mt-1">Complete your first mock interview to see reports here</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {reports.map((r, i) => {
                const score = r.report?.overallScore ?? 0;
                const date = new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const typeIcon = r.interviewType === 'technical' ? '💻' : r.interviewType === 'hr' ? '🤝' : '🧠';
                return (
                    <div key={r._id || i}
                        className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all p-4 flex items-center gap-3 group cursor-pointer"
                        onClick={() => onViewReport(r)}>
                        {/* Type icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-2xl shrink-0">
                            {typeIcon}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{r.jobRole}</p>
                            <p className="text-xs text-slate-400 mt-0.5 capitalize">
                                {r.interviewType} · {r.difficulty} · {date}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {r.answeredQuestions ?? 0}/{r.totalQuestions ?? 0} questions answered
                            </p>
                        </div>
                        {/* Score ring */}
                        <div className={`shrink-0 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center ${scoreBg(score)}`}>
                            <span className={`text-lg font-black leading-none ${scoreColor(score)}`}>{score}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">score</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ══════════════════════════════════════════════════════ */
const InterviewPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [jobRole, setJobRole] = useState('');
    const [interviewType, setInterviewType] = useState('behavioral');
    const [resume, setResume] = useState(null);
    const [isStarting, setIsStarting] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [finalReport, setFinalReport] = useState(null);
    const [suggestionData, setSuggestionData] = useState({ open: false, roles: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [difficulty, setDifficulty] = useState('medium');

    /* Past reports */
    const [pastReports, setPastReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [viewingReport, setViewingReport] = useState(null); // view a past report inline

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await axios.get('/interview/reports');
                setPastReports(res.data?.data?.reports || []);
            } catch (e) {
                console.error('Failed to load past reports', e);
            } finally {
                setReportsLoading(false);
            }
        };
        fetchReports();
    }, []);

    const handleStart = async (e) => {
        if (e) e.preventDefault();
        const isValid = ALL_ROLES.includes(searchQuery);
        if (!isValid) return;

        setIsStarting(true);
        try {
            const formData = new FormData();
            formData.append('job_role', searchQuery.trim());
            formData.append('interview_type', interviewType);
            formData.append('difficulty', difficulty);
            if (resume) formData.append('resume', resume);
            const response = await startInterview(formData);
            const { role_clear, questions, suggestions } = response.data || {};
            if (role_clear === false) {
                setSuggestionData({ open: true, roles: suggestions || [] });
                return;
            }
            setQuestions(questions || []);
        } catch (error) {
            console.error('Interview start error:', error);
            alert(`Interview service error: ${error.response?.data?.message || error.message || 'Failed to start interview.'}`);
        } finally {
            setIsStarting(false);
        }
    };

    const handleSelectSuggestion = (role) => {
        setJobRole(role);
        setSearchQuery(role);
        setSuggestionData({ open: false, roles: [] });
    };

    /* ── Loading skeleton ── */
    if (loading || (isStarting && questions.length === 0)) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-xl max-w-lg w-full space-y-8 border border-white/60">
                    <div className="flex flex-col items-center space-y-4">
                        <Skeleton className="w-20 h-20 rounded-2xl" />
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <div className="grid grid-cols-3 gap-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                        <Skeleton className="h-14 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    /* ── Final Report (just finished interview) ── */
    if (finalReport) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <FinalReport
                        report={finalReport}
                        jobRole={jobRole}
                        onRestart={() => {
                            setFinalReport(null);
                            setQuestions([]);
                            setJobRole('');
                            // refresh past reports list
                            axios.get('/interview/reports').then(res => {
                                setPastReports(res.data?.data?.reports || []);
                            }).catch(() => {});
                        }}
                    />
                </div>
            </div>
        );
    }

    /* ── Viewing a past report ── */
    if (viewingReport) {
        // Start with the rawReport from the AI (has overall scores, suggestions, etc.)
        const rawReport = { ...(viewingReport.report?.rawReport || viewingReport.report || {}) };

        // Ensure top-level score fields are present (DB stores as overallScore, FinalReport expects overall_score)
        if (!rawReport.overall_score && viewingReport.report?.overallScore)
            rawReport.overall_score = viewingReport.report.overallScore;

        // Build the answers array from questionResults (per-question transcripts + evaluations)
        // FinalReport renders this as the "Interview Transcript" section
        if (!rawReport.answers || rawReport.answers.length === 0) {
            const qr = viewingReport.questionResults || [];
            if (qr.length > 0) {
                rawReport.answers = qr.map(q => ({
                    question: q.questionText || '',
                    transcript: q.userAnswer || '',
                    skipped: !q.userAnswer,
                    evaluation: q.evaluation ? {
                        answer_score: q.evaluation.score || 0,
                        communication_score: q.evaluation.score || 0,
                        feedback: q.evaluation.feedback || '',
                        strengths: Array.isArray(q.evaluation.strengths) ? q.evaluation.strengths : [],
                        weaknesses: Array.isArray(q.evaluation.improvements) ? q.evaluation.improvements :
                                    Array.isArray(q.evaluation.weaknesses) ? q.evaluation.weaknesses : [],
                        suggestions: [],
                        technical_pointers: [],
                    } : null,
                    ideal_answer: q.evaluation?.model_answer || q.evaluation?.ideal_answer || '',
                }));
            }
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <button
                        onClick={() => setViewingReport(null)}
                        className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all text-sm font-semibold"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        Back to AI Interview
                    </button>
                    <FinalReport
                        report={rawReport}
                        jobRole={viewingReport.jobRole}
                        readonly={true}
                    />
                </div>
            </div>
        );
    }

    /* ── Active Interview Room ── */
    if (questions.length > 0) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
                <div className="px-4 pt-4">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to exit the interview? Your progress will be lost.')) {
                                setQuestions([]);
                                setJobRole('');
                                navigate('/main-dashboard');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur border border-white/60 shadow-sm text-slate-600 hover:text-blue-700 hover:bg-white transition-all text-sm font-semibold"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                        Exit Interview
                    </button>
                </div>
                <InterviewRoom
                    questions={questions}
                    jobRole={jobRole}
                    onComplete={(report) => setFinalReport(report)}
                />
            </div>
        );
    }

    /* ── Setup Screen (two-panel layout) ── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Header />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Back button */}
                <button
                    onClick={() => navigate('/main-dashboard')}
                    className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/70 backdrop-blur border border-white/60 shadow-sm text-slate-600 hover:text-blue-700 hover:bg-white transition-all text-sm font-semibold"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>

                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* ── LEFT: Setup Form ── */}
                    <div className="w-full lg:w-[480px] shrink-0">
                        <div className="bg-white/80 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/60">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
                                    AI Mock Interview
                                </h1>
                                <p className="text-gray-500 text-xs sm:text-sm">Practice with an intelligent AI recruiter and get real-time feedback.</p>
                            </div>

                            <form onSubmit={handleStart} className="space-y-5">
                                {/* Role Search */}
                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Target Job Role <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Search from 40+ roles..."
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !ALL_ROLES.includes(searchQuery)) e.preventDefault(); }}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none font-medium text-gray-800 placeholder:text-gray-400 ${ALL_ROLES.includes(searchQuery)
                                                ? 'border-emerald-200 bg-emerald-50/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                                                : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`}
                                        />
                                        {ALL_ROLES.includes(searchQuery) && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </div>

                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                            <div className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[280px] overflow-y-auto">
                                                {Object.entries(ROLE_LIST).map(([category, roles]) => {
                                                    const filtered = roles.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
                                                    if (filtered.length === 0) return null;
                                                    return (
                                                        <div key={category} className="p-2">
                                                            <div className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">{category}</div>
                                                            {filtered.map(role => (
                                                                <button key={role} type="button"
                                                                    onClick={() => { setSearchQuery(role); setJobRole(role); setIsDropdownOpen(false); }}
                                                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${searchQuery === role ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
                                                                    {role}
                                                                    {searchQuery === role && <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                                {ALL_ROLES.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                    <div className="p-8 text-center">
                                                        <span className="text-4xl block mb-2">🔍</span>
                                                        <p className="text-sm font-bold text-gray-900">No matching roles</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    {!ALL_ROLES.includes(searchQuery) && searchQuery.length > 0 && !isDropdownOpen && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-1.5 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            Please select a valid role from suggestions
                                        </p>
                                    )}
                                </div>

                                {/* Interview Type */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Interview Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'behavioral', label: 'Behavioral', desc: 'Soft skills', icon: '🧠' },
                                            { value: 'technical', label: 'Technical', desc: 'Coding & concepts', icon: '💻' },
                                            { value: 'hr', label: 'HR / Culture', desc: 'Team fit', icon: '🤝' },
                                        ].map(({ value, label, desc, icon }) => (
                                            <button key={value} type="button" onClick={() => setInterviewType(value)}
                                                className={`flex flex-col items-center text-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${interviewType === value ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                                                <span className="text-xl mb-0.5">{icon}</span>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{label}</span>
                                                    <span className={`text-[9px] leading-tight font-medium ${interviewType === value ? 'text-blue-500' : 'text-gray-400'}`}>{desc}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Interview Difficulty</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'easy', label: 'Easy', desc: 'Entry level', icon: '✅' },
                                            { value: 'medium', label: 'Medium', desc: 'Intermediate', icon: '📈' },
                                            { value: 'difficult', label: 'Difficult', desc: 'Expert level', icon: '🔥' },
                                        ].map(({ value, label, desc, icon }) => (
                                            <button key={value} type="button" onClick={() => setDifficulty(value)}
                                                className={`flex flex-col items-center text-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${difficulty === value ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                                                <span className="text-xl mb-0.5">{icon}</span>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{label}</span>
                                                    <span className={`text-[9px] leading-tight font-medium ${difficulty === value ? 'text-blue-500' : 'text-gray-400'}`}>{desc}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Resume */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Resume (Optional PDF)</label>
                                    <input type="file" accept=".pdf"
                                        onChange={(e) => setResume(e.target.files[0] || null)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all text-sm text-gray-500 cursor-pointer focus:outline-none" />
                                    <p className="text-xs text-gray-400 mt-1">AI will personalize questions based on your resume.</p>
                                </div>

                                {/* Start Button */}
                                <button type="submit" disabled={isStarting || !ALL_ROLES.includes(searchQuery)}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-base shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex justify-center items-center gap-3">
                                    {isStarting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Preparing Interview...
                                        </>
                                    ) : searchQuery === '' ? '🔍 Search for a role'
                                        : !ALL_ROLES.includes(searchQuery) ? 'Select role to continue'
                                            : '🚀 Start Interview'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── RIGHT: Recent Reports ── */}
                    <div className="flex-1 w-full">
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-lg p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900">Recent Interviews</h2>
                                    <p className="text-xs text-slate-400">Your saved reports from previous sessions</p>
                                </div>
                                {!reportsLoading && pastReports.length > 0 && (
                                    <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        {pastReports.length} saved
                                    </span>
                                )}
                            </div>
                            <RecentReports
                                reports={pastReports}
                                loading={reportsLoading}
                                onViewReport={setViewingReport}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <SuggestionModal
                isOpen={suggestionData.open}
                onClose={() => setSuggestionData({ ...suggestionData, open: false })}
                roleSuggestions={suggestionData.roles}
                onSelect={handleSelectSuggestion}
            />
        </div>
    );
};

export default InterviewPage;
