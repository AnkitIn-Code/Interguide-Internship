import { X, MapPin, Briefcase, Building, IndianRupee, ExternalLink, Calendar, Users, Globe, Copy, Check, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { applicationsAPI, resumeAPI, currentUserAPI } from '../services/api';

// AuthContext not available in this app - provide a no-op stub
const useAuth = () => ({ user: null });
const JobDetailsModal = ({ job, onClose, initiallySaved, onToggleSave, hideActions = false }) => {
    const { user } = useAuth();
    const [didSave, setDidSave] = useState(initiallySaved || false);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [error, setError] = useState(null);
    const [profileCompleteness, setProfileCompleteness] = useState({ complete: true, missing: [] });
    const [showWarning, setShowWarning] = useState(false);
    
    // Explicitly hide actions for recruiters and admins
    const isRestrictedRole = user?.role === 'RECRUITER' || user?.role === 'SUPER_ADMIN';
    const effectiveHideActions = hideActions || isRestrictedRole;
    
    const timeSince = (date) => {
        if (!date) return 'Recently';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };
    const companyDisplayName = job?.company || job?.companyName || job?.recruiterId?.companyName || job?.recruiterId?.name || 'Organization';
    const companyLogo = job?.logo || job?.recruiterId?.logo || job?.recruiterId?.avatar;

    const handleCopyLink = () => {
        const shareUrl = job?.link || `${window.location.origin}/hyrego/${job?._id || ''}`;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(err => {
                    console.error('Clipboard copy failed', err);
                    fallbackCopy(shareUrl);
                });
        } else {
            fallbackCopy(shareUrl);
        }
    };

    const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    };
    useEffect(() => {
        if (job) {
            setDidSave(initiallySaved || false);
        }
    }, [job, initiallySaved]);
    useEffect(() => {
        if (job) {
            document.body.style.overflow = 'hidden';
            setApplied(false);
            setError(null);
            // Only check application status for students and recruiters
            if (job.isInternal && (user?.role === 'STUDENT' || user?.role === 'RECRUITER')) {
                checkApplicationStatus();
                checkProfileCompleteness();
            }
        } else {
            document.body.style.overflow = '';
            setShowWarning(false);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [job]);

    const [profileResumeUrl, setProfileResumeUrl] = useState(null);

    const checkProfileCompleteness = async () => {
        try {
            const profile = await currentUserAPI.me();
            if (profile && profile.profile) {
                const missing = [];
                if (!profile.profile.location) missing.push("Location");
                if (!profile.technicalSkills || profile.technicalSkills.length === 0) missing.push("Technical Skills");
                if (!profile.profile.education) missing.push("Education");
                
                setProfileCompleteness({
                    complete: missing.length === 0,
                    missing
                });
            }
        } catch (err) {
            console.error("Profile check failed", err);
        }
    };

    const checkApplicationStatus = async () => {
        try {
            const response = await applicationsAPI.list();
            if (Array.isArray(response)) {
                const alreadyApplied = response.some(app => 
                    app.internship?._id === job?._id || app.internship === job?._id
                );
                setApplied(alreadyApplied);
            }
        } catch (err) {
            console.error("Failed to check app status", err);
        }
    };

    const [isUploading, setIsUploading] = useState(false);
    const [uploadedResume, setUploadedResume] = useState(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError("Only PDF files are allowed.");
            return;
        }
        setIsUploading(true);
        setError(null);
        try {
            const res = await resumeAPI.upload(file);
            if (res.data || res.message) {
                setUploadedResume(file.name);
                alert("Resume uploaded successfully!");
            }
        } catch (err) {
            setError("Failed to upload resume. Please try again.");
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };
    const handleApply = async () => {
        if (!job?.isInternal) return;
        setIsApplying(true);
        setError(null);
        try {
            const res = await applicationsAPI.upsert({ 
                internshipId: job?._id,
                status: 'Applied'
            });
            if (res) {
                setApplied(true);
            }
        } catch (err) {
            setError(err.message || "Failed to apply. Please try again.");
        } finally {
            setIsApplying(false);
        }
    };

    if (!job) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-all z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="absolute -bottom-8 left-8 w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden p-2">
                        {companyLogo ? (
                            <img src={companyLogo} alt={companyDisplayName} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold rounded-lg uppercase">
                                {String(companyDisplayName || job.title || 'J').substring(0, 1)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="pt-14 px-8 pb-8 overflow-y-auto no-scrollbar flex-1">
                    <div className="mb-8">
                        <h2 className="text-[22px] md:text-[26px] font-black text-slate-900 leading-tight mb-3 tracking-tight">{job.title || 'Untitled Position'}</h2>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-500 font-semibold text-[13px] md:text-sm">
                            <div className="flex items-center gap-2">
                                <div className="p-1 px-1.5 bg-blue-50 rounded-md">
                                    <Building className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <span>{companyDisplayName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-1 px-1.5 bg-blue-50 rounded-md">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <span>{job.location || 'Remote Options'}</span>
                            </div>
                            {(job.salary || job.salaryRange) && (
                                <div className="flex items-center gap-2">
                                    <div className="p-1 px-1.5 bg-emerald-50 rounded-md">
                                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                    <span className="text-emerald-600">{job.salary || job.salaryRange}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                        {job.opportunityType && (
                            <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Type</p>
                                <p className="text-sm font-bold text-indigo-700">{job.opportunityType}</p>
                            </div>
                        )}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Job Type</p>
                            <p className="text-sm font-bold text-slate-800 capitalize">{job.type || job.jobType || 'Full Time'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Experience</p>
                            <p className="text-sm font-bold text-slate-800">{job.experienceRange || job.experienceRequired || 'Entry Level'}</p>
                        </div>
                        {job.workMode && (
                            <div className="bg-violet-50 p-3 rounded-2xl border border-violet-100">
                                <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">Work Mode</p>
                                <p className="text-sm font-bold text-violet-700">{job.workMode}</p>
                            </div>
                        )}
                        {job.workSchedule && (
                            <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100">
                                <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mb-1">Schedule</p>
                                <p className="text-sm font-bold text-sky-700">{job.workSchedule}</p>
                            </div>
                        )}
                        {job.numberOfOpenings > 1 && (
                            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
                                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">Openings</p>
                                <p className="text-sm font-bold text-purple-700">{job.numberOfOpenings} positions</p>
                            </div>
                        )}
                        {job.ppoOffered && (
                            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">PPO</p>
                                <p className="text-sm font-bold text-emerald-700">Available ✓</p>
                            </div>
                        )}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Posted</p>
                            <p className="text-sm font-bold text-slate-800">{timeSince(job.createdAt)}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">{job.opportunityType === 'Internship' ? 'Internship Details' : 'Job Description'}</h3>
                        <div className="text-slate-600 leading-relaxed space-y-4 text-sm md:text-base">
                            <div className="whitespace-pre-line">
                                {job.description || job.snippet || "No additional description provided for this position."}
                            </div>
                            
                            {job.responsibilities && job.responsibilities.length > 0 && (
                                <>
                                    <h4 className="font-bold text-slate-800 pt-2">Key Responsibilities:</h4>
                                    <ul className="list-disc pl-5 space-y-2">
                                        {job.responsibilities.map((res, i) => (
                                            <li key={i}>{res}</li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {/* Benefits / Perks */}
                            {((job.benefits && job.benefits.length > 0) || (job.perks && job.perks.length > 0)) && (
                                <>
                                    <h4 className="font-bold text-slate-800 pt-2">{job.opportunityType === 'Internship' ? 'Perks' : 'Benefits'}:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(job.benefits || []).concat(job.perks || []).map((item, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-xs font-semibold text-amber-700">{item}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {!effectiveHideActions && (
                    <div className="p-3 md:p-5 border-t border-slate-100 bg-white flex flex-col gap-2 md:gap-3 shrink-0 relative">
                        {showWarning && (
                            <div className="mb-1 p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div>
                                        <p className="text-[13px] font-bold text-amber-800 tracking-tight leading-tight mb-1">Your profile is incomplete</p>
                                        <p className="text-[11px] font-medium text-amber-700/80 leading-normal">
                                            Recruiters prefer complete profiles. Missing: <span className="font-extrabold">{profileCompleteness.missing.join(', ')}</span>.
                                        </p>
                                        <button 
                                            onClick={() => window.location.href = '/app/profile'}
                                            className="mt-2 text-[11px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                                        >
                                            Complete Profile <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {applied && (
                            <div className="mb-1 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-3 text-emerald-700">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-black tracking-tight">Applied Successfully!</p>
                                        <p className="text-[11px] font-semibold text-emerald-600/80">Recruiter will review your profile shortly.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {job.isInternal && !applied && (
                            <div className="mb-2 sm:mb-4 space-y-2 sm:space-y-3 p-3 sm:p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 transition-all">
                                <label className="block text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload/Select Resume (Mandatory)</label>
                                <div className="flex flex-row gap-2">
                                    {profileResumeUrl && !profileResumeUrl.includes('default.pdf') && !profileResumeUrl.includes('dummy.pdf') ? (
                                        <button 
                                            onClick={() => setUploadedResume(profileResumeUrl)}
                                            className={`flex-1 py-1.5 sm:py-3 px-2 sm:px-4 rounded-xl text-[11px] sm:text-[13px] font-bold border transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-center leading-tight ${uploadedResume === profileResumeUrl ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {uploadedResume === profileResumeUrl ? <><Check className="w-3.5 h-3.5 shrink-0" /> Profile Resume</> : 'Use Profile'}
                                        </button>
                                    ) : null}
                                    <div className="flex-1 relative">
                                        <input 
                                            type="file"
                                            id="resume-upload"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <label 
                                            htmlFor="resume-upload"
                                            className={`w-full py-1.5 sm:py-3 px-2 sm:px-4 rounded-xl text-[11px] sm:text-[13px] font-bold border transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center leading-tight ${isUploading ? 'opacity-50 pointer-events-none' : (uploadedResume && !uploadedResume.includes('default') && uploadedResume !== profileResumeUrl ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300')}`}
                                        >
                                            {isUploading ? 'Uploading...' : (uploadedResume && !uploadedResume.includes('default') && uploadedResume !== profileResumeUrl ? <><Check className="w-3.5 h-3.5 shrink-0" /> Custom PDF</> : 'Custom PDF')}
                                        </label>
                                    </div>
                                </div>
                                {uploadedResume && (
                                    <p className="text-[9px] sm:text-[10px] text-indigo-500 font-bold mt-1 sm:mt-2 text-center truncate px-2">Chosen: {uploadedResume.split('?')[0].split('/').pop() || 'document.pdf'}</p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-row gap-2 sm:gap-3 items-center w-full">
                            <button
                                onClick={handleCopyLink}
                                className="h-10 sm:h-12 w-10 sm:w-12 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center shrink-0 bg-white"
                                title="Copy Job Link"
                            >
                                {copied ? <Check className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-emerald-500" /> : <Copy className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />}
                            </button>
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        const title = job.title || 'Untitled Position';
                                        const company = job.company || job.companyName || (job.recruiterId?.companyName) || 'Organization';
                                        const jobId = job._id || job.id || job.link || `${title}-${company}`.replace(/\s+/g, '-').toLowerCase();
                                        if (didSave) {
                                            await axios.delete('/jobs/unsave', {
                                                data: { jobId }
                                            });
                                            setDidSave(false);
                                            if (onToggleSave) onToggleSave(jobId, false);
                                        } else {
                                            await axios.post('/jobs/save', { job });
                                            setDidSave(true);
                                            if (onToggleSave) onToggleSave(jobId, true);
                                        }
                                    } catch (err) {
                                        console.error('Failed to toggle save job', err);
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                disabled={isSaving}
                                className={`h-10 sm:h-12 w-16 sm:w-24 border outline-none font-bold px-2 sm:px-4 rounded-xl text-[12px] sm:text-sm whitespace-nowrap transition-all shrink-0 ${didSave ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
                            >
                                {isSaving ? '...' : didSave ? 'Saved' : 'Save'}
                            </button>

                            {job.isInternal ? (
                                <button
                                    onClick={() => {
                                        if (!uploadedResume) {
                                            setError("Please upload or select a resume before applying.");
                                            return;
                                        }
                                        if (!profileCompleteness.complete && !showWarning) {
                                            setShowWarning(true);
                                        } else {
                                            handleApply();
                                        }
                                    }}
                                    disabled={isApplying || applied}
                                    className={`w-full h-10 sm:h-12 font-bold px-3 sm:px-4 rounded-xl text-[12px] sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 shadow-lg outline-none ${applied ? 'bg-emerald-500 text-white cursor-default shadow-emerald-500/20' : 'bg-[#1a56f0] text-white hover:bg-[#1546c7] shadow-blue-500/20'}`}
                                >
                                    {isApplying ? 'Applying...' : applied ? (
                                        <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Applied</>
                                    ) : (
                                        <span className="truncate">Apply {showWarning ? 'Anyway' : ''}</span>
                                    )}
                                </button>
                            ) : (
                                <a
                                    href={job.link || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-10 sm:h-12 bg-[#1a56f0] text-white font-bold px-3 sm:px-4 rounded-xl text-[12px] sm:text-sm whitespace-nowrap hover:bg-[#1546c7] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 outline-none"
                                >
                                    Apply Now <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                </a>
                            )}
                        </div>
                    </div>
                )}
                {error && !effectiveHideActions && (
                    <div className="px-8 pb-4 text-center">
                        <p className="text-rose-500 text-xs font-semibold">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default JobDetailsModal;
