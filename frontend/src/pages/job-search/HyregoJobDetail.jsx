import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI, currentUserAPI } from '../services/api';
import {
    MapPin, Briefcase, IndianRupee, Clock, Calendar, Globe, Monitor,
    ArrowLeft, Share2, ExternalLink, CheckCircle, ChevronRight,
    Building2, BookOpen, Users, AlertCircle, Lock, Sparkles, Timer, Play,
    Linkedin, Twitter, MessageCircle, Copy, UploadCloud, Loader2, FileText, Bookmark
} from 'lucide-react';

const HyregoJobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [applyError, setApplyError] = useState(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [showResumeUpload, setShowResumeUpload] = useState(false);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [showCvModal, setShowCvModal] = useState(false);
    const [currentResumeUrl, setCurrentResumeUrl] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/jobs/public/${id}`);
                if (res.data.status === 'success') {
                    setJob(res.data.data.job);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Job not found');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    useEffect(() => {
        if (job && user && user.role === 'STUDENT' && job.isSpecial) {
            const checkAppStatus = async () => {
                try {
                    const response = await applicationsAPI.list();
                    // Backend returns { applications: [...] } or array
                    const apps = Array.isArray(response) ? response : (response?.applications || []);
                    const alreadyApplied = apps.some(
                        app => app.internship?._id === job._id || app.internship === job._id
                    );
                    setApplied(alreadyApplied);
                } catch (err) { /* ignore */ }
            };
            checkAppStatus();
        }
    }, [job, user]);

    useEffect(() => {
        if (job && user) {
            const checkSaved = async () => {
                try {
                    const res = await axios.get('/jobs/saved');
                    const saved = (res.data.jobs || []).some(j => j._id === job._id);
                    setIsSaved(saved);
                } catch { /* not logged in */ }
            };
            checkSaved();
        }
    }, [job, user]);

    const handleCopyLink = () => {
        const url = window.location.href;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const toggleSave = async () => {
        if (!user) { navigate(`/login?redirect=/hyrego/${id}`); return; }
        if (isSaving) return;
        setIsSaving(true);
        const wasSaved = isSaved;
        setIsSaved(!wasSaved);
        try {
            if (wasSaved) {
                await axios.delete('/jobs/unsave', { data: { jobId: job._id } });
            } else {
                await axios.post('/jobs/save', {
                    job: {
                        _id: job._id,
                        title: job.title,
                        company: companyName,
                        location: job.location,
                        jobType: job.jobType,
                        salaryRange: job.salaryRange,
                        companyLogo: companyLogo,
                    }
                });
            }
        } catch {
            setIsSaved(wasSaved); // revert on failure
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyInternal = async () => {
        if (!user) {
            navigate(`/login?redirect=/hyrego/${id}`);
            return;
        }
        setIsApplying(true);
        setApplyError(null);
        setShowResumeUpload(false);
        try {
            const profile = await currentUserAPI.me();
            const resumeUrl = profile?.profile?.resume?.fileName;
            if (!resumeUrl) {
                // No CV on file — prompt upload directly
                setApplyError('Please upload a resume to apply.');
                setShowResumeUpload(true);
                setIsApplying(false);
                return;
            }
            // Has a CV — show confirmation modal instead of auto-applying
            setCurrentResumeUrl(resumeUrl);
            setShowCvModal(true);
            setIsApplying(false);
        } catch (err) {
            setApplyError(err.message || 'Failed to fetch profile. Please try again.');
            setIsApplying(false);
        }
    };

    const submitApplication = async (resumeUrl) => {
        setIsApplying(true);
        setShowCvModal(false);
        setShowResumeUpload(false);
        setApplyError(null);
        try {
            const res = await applicationsAPI.upsert({ 
                internshipId: job._id, 
                status: 'Applied'
            });
            if (res) {
                setApplied(true);
            }
        } catch (err) {
            setApplyError(err.message || 'Failed to apply. Please try again.');
        } finally {
            setIsApplying(false);
        }
    };

    const handleQuickResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
             setApplyError('File size should not exceed 5MB');
             return;
        }
        setIsUploadingResume(true);
        setApplyError(null);
        try {
            const fm = new FormData();
            fm.append('resume', file);
            const { data } = await axios.patch('/student/profile/resume', fm);
            if (data.status === 'success' || data.success) {
                 const newResumeUrl = data.data.resumeUrl;
                 setApplyError(null);
                 setShowResumeUpload(false);
                 setCurrentResumeUrl(newResumeUrl);
                 // After uploading a new CV, submit immediately
                 await submitApplication(newResumeUrl);
            }
        } catch(error) {
             setApplyError('Failed to upload resume. Please try again.');
        } finally {
             setIsUploadingResume(false);
             e.target.value = '';
        }
    };

    const timeSince = (date) => {
        if (!date) return 'Recently';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        if (seconds < 2592000) return Math.floor(seconds / 86400) + ' days ago';
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const daysUntilDeadline = (deadline) => {
        if (!deadline) return null;
        const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Expired';
        if (diff === 0) return 'Today';
        return `${diff} days left`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold text-sm">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-10 text-center max-w-md shadow-xl border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Job Not Found</h2>
                    <p className="text-slate-500 text-sm mb-6">{error || 'This job listing may have been removed or is no longer available.'}</p>
                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const companyName = job.companyName || job.recruiterId?.companyName || 'Organization';
    const companyLogo = job.companyLogo || job.recruiterId?.logo;
    const companyBanner = job.companyBanner;
    const deadlineText = daysUntilDeadline(job.applicationDeadline);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* CV Confirmation Modal */}
            {showCvModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-[17px] leading-tight">Apply with CV</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Review your CV before submitting</p>
                                </div>
                            </div>
                        </div>

                        {/* Current CV */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current CV</p>
                                    <p className="text-sm font-bold text-slate-800 truncate" title={currentResumeUrl?.split('/').pop()?.split('?')[0]}>
                                        {currentResumeUrl?.split('/').pop()?.split('?')[0] || 'resume.pdf'}
                                    </p>
                                </div>
                                <a
                                    href={currentResumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0"
                                    title="Preview CV"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>

                            {/* Upload new CV option */}
                            {!showResumeUpload ? (
                                <button
                                    onClick={() => setShowResumeUpload(true)}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-2xl text-slate-500 hover:text-blue-600 font-semibold text-sm transition-all"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    Upload a different CV instead
                                </button>
                            ) : (
                                <div className="relative border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        disabled={isUploadingResume}
                                        onChange={handleQuickResumeUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    {isUploadingResume ? (
                                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin mb-1.5" />
                                    ) : (
                                        <UploadCloud className="w-7 h-7 text-blue-500 mb-1.5" />
                                    )}
                                    <p className="text-sm font-bold text-slate-700">
                                        {isUploadingResume ? 'Uploading & Applying...' : 'Click to Upload New CV'}
                                    </p>
                                    {!isUploadingResume && <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX · Max 5MB</p>}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 space-y-2">
                            <button
                                onClick={() => submitApplication(currentResumeUrl)}
                                disabled={isApplying || isUploadingResume}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isApplying ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</> : <><CheckCircle className="w-4 h-4" /> Apply with Current CV</>}
                            </button>
                            <button
                                onClick={() => { setShowCvModal(false); setShowResumeUpload(false); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-2xl font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Banner Section */}
            <div className="relative">
                {companyBanner ? (
                    <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden">
                        <img src={companyBanner} alt="Company Banner" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
                    </div>
                ) : (
                    <div className="h-48 md:h-64 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5" />
                            <div className="absolute -bottom-16 -left-10 w-80 h-80 rounded-full bg-white/5" />
                            <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-white/5" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
                    </div>
                )}

                {/* Floating action buttons on banner */}
                <div className="absolute top-4 left-4 right-4 md:top-6 md:left-8 md:right-8 flex items-center justify-end z-30">
                    <div className="flex items-center gap-2 relative">
                        {/* Bookmark button */}
                        <button
                            onClick={toggleSave}
                            disabled={isSaving}
                            title={isSaved ? 'Remove from saved' : 'Save job'}
                            className={`w-10 h-10 md:w-11 md:h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all border shadow-lg ${
                                isSaved
                                    ? 'bg-blue-600 border-blue-400 text-white scale-110'
                                    : 'bg-white/20 hover:bg-white/40 border-white/10 text-white'
                            }`}
                        >
                            <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2} />
                        </button>

                        <button
                            onClick={() => setShareOpen(!shareOpen)}
                            className={`w-10 h-10 md:w-11 md:h-11 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/10 shadow-lg ${shareOpen ? 'bg-blue-600 scale-110' : 'bg-white/20 hover:bg-white/40'}`}
                            title="Share Job"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>

                        {shareOpen && (
                            <div className="absolute top-full mt-3 right-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Share via</p>
                                <div className="space-y-1">
                                    <button 
                                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check out this job: ' + window.location.href)}`, '_blank')}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-green-50 hover:text-green-600 transition-all font-bold text-xs"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white">
                                            <MessageCircle className="w-4 h-4" />
                                        </div>
                                        WhatsApp
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-xs"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                            <Linkedin className="w-4 h-4" />
                                        </div>
                                        LinkedIn
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-xs"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
                                            <Twitter className="w-4 h-4" />
                                        </div>
                                        X / Twitter
                                    </button>
                                    <div className="pt-1 mt-1 border-t border-slate-100">
                                        <button 
                                            onClick={() => { handleCopyLink(); setShareOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-xs"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
                                                <Copy className="w-4 h-4" />
                                            </div>
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <Link
                                to={`/login?redirect=/hyrego/${id}`}
                                className="px-4 py-2.5 md:px-5 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white text-sm font-bold transition-all border border-white/10 shadow-lg"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-20 md:-mt-24 relative z-10 pb-16 md:pb-24">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header Card */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 mb-6">
                            <div className="flex items-start gap-4 md:gap-5 mb-6">
                                {/* Company Logo */}
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-lg shrink-0 p-2">
                                    {companyLogo ? (
                                        <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                            <span className="text-white font-black text-2xl">{companyName.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">
                                        {job.title}
                                    </h1>
                                    <p className="text-blue-600 font-bold text-sm md:text-base">{companyName}</p>
                                </div>
                            </div>

                            {/* Quick Info Chips */}
                            <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
                                {job.opportunityType && (
                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs md:text-[13px] font-bold ${job.opportunityType === 'Internship' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                                        {job.opportunityType === 'Internship' ? '🎓' : '💼'} {job.opportunityType}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-[13px] font-semibold text-slate-600">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    {job.location}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-[13px] font-semibold text-slate-600">
                                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                                    {job.jobType || 'Full-time'}
                                </span>
                                {job.workSchedule && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-xs md:text-[13px] font-semibold text-sky-700">
                                        <Clock className="w-3.5 h-3.5" />
                                        {job.workSchedule}
                                    </span>
                                )}
                                {(job.salaryRange) && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs md:text-[13px] font-bold text-emerald-700">
                                        <IndianRupee className="w-3.5 h-3.5" />
                                        {job.salaryRange}
                                    </span>
                                )}
                                {job.experienceRange && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-[13px] font-semibold text-slate-600">
                                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                                        {job.experienceRange} Exp
                                    </span>
                                )}
                            </div>

                            {/* Detail Pills Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {job.applicationDeadline && (
                                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 md:p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                            <p className="text-[10px] md:text-[11px] font-bold text-blue-500 uppercase tracking-wider">Deadline</p>
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">
                                            {new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                )}
                                {job.startDate && (
                                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 md:p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                            <Play className="w-3.5 h-3.5 text-emerald-500" />
                                            <p className="text-[10px] md:text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Start Date</p>
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">{job.startDate}</p>
                                    </div>
                                )}
                                {job.workMode && (
                                    <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-3 md:p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                            <Monitor className="w-3.5 h-3.5 text-violet-500" />
                                            <p className="text-[10px] md:text-[11px] font-bold text-violet-500 uppercase tracking-wider">Work Mode</p>
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">{job.workMode}</p>
                                    </div>
                                )}
                                {job.duration && (
                                    <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3 md:p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                            <Timer className="w-3.5 h-3.5 text-amber-500" />
                                            <p className="text-[10px] md:text-[11px] font-bold text-amber-500 uppercase tracking-wider">Duration</p>
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-slate-800">{job.duration}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Job Overview */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
                            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                Job Overview
                            </h2>
                            <div className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line">
                                {job.description || 'No description provided.'}
                            </div>
                        </div>

                        {/* Key Responsibilities */}
                        {job.responsibilities && job.responsibilities.length > 0 && (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    Key Responsibilities
                                </h2>
                                <ul className="space-y-3">
                                    {job.responsibilities.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm md:text-base text-slate-600">
                                            <span className="mt-1.5 w-2 h-2 bg-blue-400 rounded-full shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Eligibility Criteria */}
                        {job.eligibilityCriteria && job.eligibilityCriteria.length > 0 && (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    Eligibility Criteria
                                </h2>
                                <ul className="space-y-3">
                                    {job.eligibilityCriteria.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm md:text-base text-slate-600">
                                            <span className="mt-1.5 w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Skills Required */}
                        {job.skillsRequired && job.skillsRequired.length > 0 && (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                                    Skills Required
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.skillsRequired.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm font-semibold text-blue-700"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Benefits / Perks */}
                        {((job.benefits && job.benefits.length > 0) || (job.perks && job.perks.length > 0)) && (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                    {job.opportunityType === 'Internship' ? 'Perks' : 'Benefits'}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {(job.benefits || []).concat(job.perks || []).map((item, i) => (
                                        <span key={i} className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-sm font-semibold text-amber-700">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* About the Company */}
                        {(job.aboutCompany || job.companyWebsite) && (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-slate-700 rounded-full" />
                                    About the Company
                                </h2>
                                {job.aboutCompany && (
                                    <p className="text-slate-600 leading-relaxed text-sm md:text-base mb-4 whitespace-pre-line">
                                        {job.aboutCompany}
                                    </p>
                                )}
                                {job.companyWebsite && (
                                    <a
                                        href={job.companyWebsite.startsWith('http') ? job.companyWebsite : `https://${job.companyWebsite}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                                    >
                                        <Globe className="w-4 h-4" /> Visit Website
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:w-[340px] xl:w-[380px] shrink-0">
                        <div className="lg:sticky lg:top-6 space-y-5">
                            {/* Apply Now Card */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[60px] -z-0" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-slate-900">Apply Now</h3>
                                        <button
                                            onClick={toggleSave}
                                            disabled={isSaving}
                                            title={isSaved ? 'Remove from saved' : 'Save job'}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                                                isSaved
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'
                                            }`}
                                        >
                                            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} strokeWidth={2} />
                                        </button>
                                    </div>
                                    
                                    {deadlineText && (
                                        <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <Timer className="w-4 h-4 text-slate-400" />
                                            <span className={`text-sm font-bold ${deadlineText === 'Expired' ? 'text-red-500' : 'text-slate-700'}`}>
                                                Deadline: {deadlineText}
                                            </span>
                                        </div>
                                    )}

                                    {applyError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
                                            {applyError}
                                        </div>
                                    )}

                                    {showResumeUpload && (
                                        <div className="mb-4">
                                            <div className="relative border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-blue-50">
                                                <input type="file" accept=".pdf,.doc,.docx" disabled={isUploadingResume} onChange={handleQuickResumeUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                {isUploadingResume ? (
                                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                                                ) : (
                                                    <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                                                )}
                                                <p className="text-sm font-bold text-slate-700">{isUploadingResume ? 'Uploading...' : 'Quick Upload Resume'}</p>
                                                {!isUploadingResume && <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX up to 5MB</p>}
                                            </div>
                                        </div>
                                    )}

                                    {applied ? (
                                        <div className="space-y-3 mb-1">
                                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-emerald-800">Application Submitted! 🎉</p>
                                                    <p className="text-[11px] font-medium text-emerald-600">Your application is under review.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/app/dashboard')}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-blue-200"
                                            >
                                                <Building2 className="w-4 h-4" /> Go to Dashboard
                                            </button>
                                            <button
                                                onClick={() => navigate('/app/applications')}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 text-emerald-700 rounded-2xl font-bold text-sm transition-all"
                                            >
                                                <CheckCircle className="w-4 h-4" /> View Applications
                                            </button>
                                            <button
                                                onClick={() => navigate(-1)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4" /> Continue Browsing Jobs
                                            </button>
                                        </div>
                                    ) : job.applyHidden ? (
                                        /* Apply link requires login */
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-4 bg-amber-50/80 border border-amber-100 rounded-2xl">
                                                <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                                                <p className="text-xs font-semibold text-amber-700">Login or register to see the apply link and submit your application.</p>
                                            </div>
                                            <Link
                                                to={`/login?redirect=/hyrego/${id}`}
                                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                            >
                                                Login to Apply <ChevronRight className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                to="/register"
                                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-blue-200 text-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all"
                                            >
                                                Create Account
                                            </Link>
                                        </div>
                                    ) : job.applyLink ? (
                                        /* External apply link */
                                        <a
                                            href={job.applyLink.startsWith('http') ? job.applyLink : `https://${job.applyLink}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                        >
                                            Apply Now <ExternalLink className="w-4 h-4" />
                                        </a>
                                    ) : user ? (
                                        /* Internal apply for logged-in students */
                                        <button
                                            onClick={handleApplyInternal}
                                            disabled={isApplying || deadlineText === 'Expired'}
                                            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                                                deadlineText === 'Expired'
                                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                            }`}
                                        >
                                            {isApplying ? 'Applying...' : deadlineText === 'Expired' ? 'Deadline Passed' : 'Apply Now'}
                                        </button>
                                    ) : (
                                        <Link
                                            to={`/login?redirect=/hyrego/${id}`}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                        >
                                            Login to Apply <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Job Info Card */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Job Summary</h3>
                                <div className="space-y-3">
                                    <InfoRow icon={Building2} label="Company" value={companyName} />
                                    <InfoRow icon={MapPin} label="Location" value={job.location} />
                                    <InfoRow icon={Briefcase} label="Type" value={job.opportunityType === 'Internship' ? 'Internship' : (job.jobType || 'Full-time')} />
                                    {job.workSchedule && <InfoRow icon={Clock} label="Schedule" value={job.workSchedule} />}
                                    {job.salaryRange && <InfoRow icon={IndianRupee} label="Salary" value={job.salaryRange} />}
                                    {job.opportunityType === 'Internship' && job.stipendType === 'Paid' && (job.stipendMin || job.stipendMax) && (
                                        <InfoRow icon={IndianRupee} label="Stipend" value={`₹${job.stipendMin || 0} - ₹${job.stipendMax || 0}/mo`} />
                                    )}
                                    {job.opportunityType === 'Internship' && job.stipendType === 'Unpaid' && (
                                        <InfoRow icon={IndianRupee} label="Stipend" value="Unpaid" />
                                    )}
                                    {job.experienceRange && <InfoRow icon={Clock} label="Experience" value={job.experienceRange} />}
                                    {job.workMode && <InfoRow icon={Monitor} label="Work Mode" value={job.workMode} />}
                                    {job.numberOfOpenings > 1 && <InfoRow icon={Users} label="Openings" value={`${job.numberOfOpenings} positions`} />}
                                    {job.internshipDuration && job.opportunityType === 'Internship' && <InfoRow icon={Timer} label="Duration" value={`${job.internshipDuration} Month${job.internshipDuration > 1 ? 's' : ''}`} />}
                                    {job.duration && <InfoRow icon={Timer} label="Duration" value={job.duration} />}
                                    {job.ppoOffered && <InfoRow icon={Sparkles} label="PPO" value="Pre-Placement Offer Available" />}
                                    <InfoRow icon={Calendar} label="Posted" value={timeSince(job.createdAt)} />
                                </div>
                            </div>

                            {/* Share Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-6">
                                <p className="text-sm font-black text-slate-800 mb-4 text-center">Know someone perfect for this role?</p>
                                <div className="grid grid-cols-4 gap-2">
                                    <button 
                                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check out this job: ' + window.location.href)}`, '_blank')}
                                        className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                                        title="Share on WhatsApp"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-100">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">WhatsApp</span>
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                                        className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                                        title="Share on LinkedIn"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                            <Linkedin className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">LinkedIn</span>
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                                        className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                                        title="Share on X"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-slate-200">
                                            <Twitter className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">X / Twitter</span>
                                    </button>
                                    <button 
                                        onClick={handleCopyLink}
                                        className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                                        title="Copy Link"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${copied ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-white text-slate-600 shadow-slate-100 border border-slate-100'}`}>
                                            <Copy className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{copied ? 'Copied!' : 'Copy Link'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Bottom Apply Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 shadow-2xl shadow-slate-900/10">
                {applied ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-bold text-sm">
                            <CheckCircle className="w-4 h-4" /> Application Submitted! 🎉
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => navigate('/app/dashboard')}
                                className="flex flex-col items-center justify-center gap-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-bold text-[11px] transition-all shadow-md shadow-blue-200"
                            >
                                <Building2 className="w-4 h-4" />
                                Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/app/applications')}
                                className="flex flex-col items-center justify-center gap-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 text-emerald-700 rounded-2xl font-bold text-[11px] transition-all"
                            >
                                <CheckCircle className="w-4 h-4" />
                                My Apps
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 text-slate-600 rounded-2xl font-bold text-[11px] transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Browse Jobs
                            </button>
                        </div>
                    </div>
                ) : showResumeUpload ? (
                     <div className="relative border-2 border-dashed border-blue-200 bg-blue-50/90 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all">
                        <input type="file" accept=".pdf,.doc,.docx" disabled={isUploadingResume} onChange={handleQuickResumeUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="flex items-center gap-2">
                           {isUploadingResume ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <UploadCloud className="w-5 h-5 text-blue-500" />}
                           <p className="text-sm font-bold text-slate-700">{isUploadingResume ? 'Uploading...' : 'Tap to Upload Quick Resume'}</p>
                        </div>
                     </div>
                ) : job.applyHidden ? (
                    <Link
                        to={`/login?redirect=/hyrego/${id}`}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200"
                    >
                        <Lock className="w-4 h-4" /> Login to Apply
                    </Link>
                ) : job.applyLink ? (
                    <a
                        href={job.applyLink.startsWith('http') ? job.applyLink : `https://${job.applyLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200"
                    >
                        Apply Now <ExternalLink className="w-4 h-4" />
                    </a>
                ) : user ? (
                    <button
                        onClick={handleApplyInternal}
                        disabled={isApplying || deadlineText === 'Expired'}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${
                            deadlineText === 'Expired'
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-blue-600 text-white shadow-blue-200'
                        }`}
                    >
                        {isApplying ? 'Applying...' : deadlineText === 'Expired' ? 'Deadline Passed' : 'Apply Now'}
                    </button>
                ) : (
                    <Link
                        to={`/login?redirect=/hyrego/${id}`}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200"
                    >
                        Login to Apply <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
        </div>
    </div>
);

export default HyregoJobDetail;
