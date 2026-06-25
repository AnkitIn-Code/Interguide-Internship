import React from 'react';
import { useNavigate } from 'react-router-dom';

const ScoreRing = ({ score, label, color }) => {
    const r = 36;
    const circ = 2 * Math.PI * r;
    const fill = circ - (circ * Math.min(100, Math.max(0, score))) / 100;
    return (
        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24">
                <svg className="w-16 h-16 sm:w-24 sm:h-24 -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                        cx="44" cy="44" r={r} fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={circ}
                        strokeDashoffset={fill}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black" style={{ color }}>{score}</span>
                </div>
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 text-center">{label}</span>
        </div>
    );
};

const FinalReport = ({ report, jobRole, onRestart, readonly = false }) => {
    const navigate = useNavigate();
    const { overall_score = 0, confidence_score = 0, fluency_score = 0, technical_accuracy = 0, suggestions = [] } = report;
    const grade = overall_score >= 85 ? { label: 'Excellent', emoji: '🌟', color: 'text-green-600', bg: 'from-green-50 to-emerald-50', border: 'border-green-200' }
        : overall_score >= 70 ? { label: 'Good', emoji: '👍', color: 'text-blue-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200' }
            : overall_score >= 55 ? { label: 'Fair', emoji: '📈', color: 'text-yellow-600', bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200' }
                : { label: 'Needs Work', emoji: '💪', color: 'text-red-600', bg: 'from-red-50 to-rose-50', border: 'border-red-200' };

    return (
        <div className="w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-start p-2 sm:p-8">
            <div className="w-full max-w-3xl space-y-3 sm:space-y-6 pb-20 sm:pb-0">

                <div className={`bg-gradient-to-br ${grade.bg} border ${grade.border} rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center shadow-lg relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <span className="text-8xl">{grade.emoji}</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{grade.emoji}</div>
                        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-1 leading-tight">Interview Complete!</h1>
                        <p className="text-gray-500 text-xs sm:text-sm mb-4">
                            {jobRole ? `Performance report for ${jobRole}` : 'Overall performance report'}
                        </p>
                        <div className={`inline-block px-4 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold text-sm sm:text-lg ${grade.color} border ${grade.border} bg-white/80 backdrop-blur-sm shadow-sm`}>
                            {grade.label} <span className="opacity-50 mx-1">•</span> {overall_score}/100
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
                    <h2 className="text-[10px] sm:text-xs sm:text-sm font-bold text-gray-400 sm:text-gray-500 uppercase tracking-widest mb-3 sm:mb-5 text-center">Score Breakdown</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
                        <ScoreRing score={overall_score} label="Overall" color="#4f46e5" />
                        <ScoreRing score={confidence_score} label="Confidence" color="#059669" />
                        <ScoreRing score={fluency_score} label="Fluency" color="#7c3aed" />
                        <ScoreRing score={technical_accuracy} label="Technical" color="#d97706" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1">
                        <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Detailed Metrics</h2>
                        {[
                            { label: 'Overall Score', value: overall_score, color: 'bg-indigo-500' },
                            { label: 'Confidence', value: confidence_score, color: 'bg-emerald-500' },
                            { label: 'Fluency', value: fluency_score, color: 'bg-purple-500' },
                            { label: 'Technical Accuracy', value: technical_accuracy, color: 'bg-amber-500' },
                        ].map(({ label, value, color }) => (
                            <div key={label}>
                                <div className="flex justify-between text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                                    <span>{label}</span>
                                    <span>{value}/100</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${color}`}
                                        style={{ width: `${value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex-1">
                        <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 sm:mb-4">🎤 Vocal Performance Analysis</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-8">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-500">Filler Words</span>
                                <span className={`text-xs sm:text-sm font-black tabular-nums ${(report.audio_metrics?.total_filler_words || 0) > 5 ? 'text-rose-500' : 'text-blue-500'}`}>
                                    {report.audio_metrics?.total_filler_words || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-500">Modulation</span>
                                <span className="text-xs sm:text-sm font-black text-slate-800 tabular-nums">
                                    {Math.round((report.audio_metrics?.avg_modulation || 0) * 1000)} MDL
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-500">Silence Presence</span>
                                <span className="text-xs sm:text-sm font-black text-amber-600 tabular-nums">
                                    {Math.round((report.audio_metrics?.avg_pause_ratio || 0) * 100)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-500">Long Silences</span>
                                <span className="text-xs sm:text-sm font-black text-rose-400 tabular-nums">
                                    {report.audio_metrics?.total_long_pauses || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-500">Avg. Pace</span>
                                <span className="text-xs sm:text-sm font-black text-blue-500 tabular-nums">
                                    {report.audio_metrics?.avg_speech_rate || 0} WPM
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-50 text-center">
                            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Comprehensive Local Audio Audit</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {report.spoken_english && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">🗣️ Spoken English Evaluation</h2>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">{report.spoken_english.score}/100</span>
                            </div>
                            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{report.spoken_english.feedback}</p>
                            <div className="space-y-3">
                                {report.spoken_english.strengths?.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase text-emerald-600 mb-1">Strengths</h3>
                                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                            {report.spoken_english.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {report.spoken_english.weaknesses?.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase text-rose-600 mb-1">Areas to Improve</h3>
                                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                            {report.spoken_english.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {report.answer_evaluation && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">🧠 Answer Content Evaluation</h2>
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold">{report.answer_evaluation.score}/100</span>
                            </div>
                            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{report.answer_evaluation.feedback}</p>
                            <div className="space-y-3">
                                {report.answer_evaluation.strengths?.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase text-emerald-600 mb-1">Strengths</h3>
                                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                            {report.answer_evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {report.answer_evaluation.weaknesses?.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase text-rose-600 mb-1">Areas to Improve</h3>
                                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                            {report.answer_evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {suggestions.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 sm:mb-4">💡 Overall Suggestions</h2>
                        <ul className="space-y-2.5 sm:space-y-3">
                            {suggestions.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2.5 sm:gap-3 text-gray-700 text-xs sm:text-sm leading-relaxed">
                                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {report.answers && report.answers.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-5 sm:mb-6">📝 Interview Transcript</h2>
                        <div className="space-y-6 sm:space-y-8">
                            {report.answers.map((ans, idx) => (
                                <div key={idx} className="group transition-all">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-900 text-white flex items-center justify-center text-[9px] sm:text-xs font-black shadow-lg shadow-slate-200 shrink-0">
                                            Q{idx + 1}
                                        </span>
                                        <h3 className="text-[11px] sm:text-sm font-bold text-slate-800 leading-tight">
                                            {ans.question}
                                        </h3>
                                    </div>
                                    <div className="relative pl-7 sm:pl-11">
                                        <div className="absolute left-[11px] sm:left-[15px] top-0 bottom-0 w-[1.5px] bg-slate-50 group-last:bg-transparent" />
                                        <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border ${ans.skipped ? 'bg-amber-50 border-amber-100 italic text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-700'} text-[11px] sm:text-sm leading-relaxed shadow-sm`}>
                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                {ans.skipped ? 'Skipped Question' : 'Your Response'}
                                            </div>
                                            {ans.skipped ? 'You didn\'t provide an answer for this question.' : ans.transcript || 'No transcript available.'}
                                        </div>

                                        {(ans.ideal_answer || (ans.evaluation && ans.evaluation.model_answer)) && (
                                            <div className="mt-3 p-3 sm:p-4 bg-emerald-50/20 rounded-xl border border-emerald-100/30">
                                                <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    AI Approved Answer (Study Guide)
                                                </div>
                                                <p className="text-[11px] sm:text-xs text-emerald-900 leading-relaxed font-bold">
                                                    {ans.ideal_answer || (ans.evaluation && ans.evaluation.model_answer)}
                                                </p>
                                            </div>
                                         )}

                                         {!ans.skipped && ans.evaluation && (
                                             <div className="mt-2.5 sm:mt-3 space-y-2">
                                                 <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                                                     <div className="flex items-center justify-center xs:justify-start gap-2 text-indigo-600 bg-indigo-50/50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-indigo-100/50">
                                                         <span>Content: <span className="text-indigo-700">{ans.evaluation.answer_score !== undefined ? ans.evaluation.answer_score : (ans.evaluation.answerScore !== undefined ? ans.evaluation.answerScore : (ans.evaluation.content_score !== undefined ? ans.evaluation.content_score : 0))}</span>/100</span>
                                                     </div>
                                                     <div className="flex items-center justify-center xs:justify-start gap-2 text-emerald-600 bg-emerald-50/50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-100/50">
                                                         <span>Delivery: <span className="text-emerald-700">{ans.evaluation.communication_score !== undefined ? ans.evaluation.communication_score : (ans.evaluation.communicationScore !== undefined ? ans.evaluation.communicationScore : (ans.evaluation.delivery_score !== undefined ? ans.evaluation.delivery_score : 0))}</span>/100</span>
                                                     </div>
                                                 </div>

                                                {ans.evaluation.technical_pointers && ans.evaluation.technical_pointers.length > 0 && (
                                                    <div className="p-3 sm:p-4 bg-sky-50/40 rounded-xl border border-sky-100/50">
                                                        <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-sky-600">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                            Technical Accuracy
                                                        </div>
                                                        <ul className="text-[11px] sm:text-xs text-sky-800 leading-relaxed space-y-1">
                                                            {(Array.isArray(ans.evaluation.technical_pointers) ? ans.evaluation.technical_pointers : [ans.evaluation.technical_pointers]).map((pointer, i) => (
                                                                <li key={i} className="flex items-start gap-1.5">
                                                                    <span className="mt-[3px] w-1 h-1 rounded-full bg-sky-400 shrink-0" />
                                                                    {pointer}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {ans.evaluation.strengths && ans.evaluation.strengths.length > 0 && (
                                                    <div className="p-3 sm:p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/50">
                                                        <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Feedback - Strengths
                                                        </div>
                                                        <ul className="text-[11px] sm:text-xs text-emerald-800 leading-relaxed list-disc list-inside">
                                                            {(Array.isArray(ans.evaluation.strengths) ? ans.evaluation.strengths : [ans.evaluation.strengths]).map((strength, i) => (
                                                                <li key={i}>{strength}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {ans.evaluation.weaknesses && ans.evaluation.weaknesses.length > 0 && (
                                                    <div className="p-3 sm:p-4 bg-rose-50/40 rounded-xl border border-rose-100/50">
                                                        <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-rose-600">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Feedback - Areas to Improve
                                                        </div>
                                                        <ul className="text-[11px] sm:text-xs text-rose-800 leading-relaxed list-disc list-inside">
                                                            {(Array.isArray(ans.evaluation.weaknesses) ? ans.evaluation.weaknesses : [ans.evaluation.weaknesses]).map((weakness, i) => (
                                                                <li key={i}>{weakness}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {ans.evaluation.suggestions && ans.evaluation.suggestions.length > 0 && (
                                                    <div className="p-3 sm:p-4 bg-amber-50/40 rounded-xl border border-amber-100/50">
                                                        <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Suggestion for Improvement
                                                        </div>
                                                        <ul className="text-[11px] sm:text-xs text-amber-800 leading-relaxed italic list-disc list-inside">
                                                            {(Array.isArray(ans.evaluation.suggestions) ? ans.evaluation.suggestions : [ans.evaluation.suggestions]).map((suggestion, i) => (
                                                                <li key={i}>{suggestion}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!readonly && (
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pb-8 print:hidden">
                        <button
                            onClick={() => navigate('/main-dashboard')}
                            className="flex-1 py-3 sm:py-4 bg-white border-2 border-gray-200 hover:border-slate-300 text-gray-700 font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all hover:-translate-y-0.5"
                        >
                            🏠 Back to Dashboard
                        </button>
                        {onRestart && (
                            <button
                                onClick={onRestart}
                                className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                            >
                                🔄 Start New Interview
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="flex-1 py-3 sm:py-4 bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all hover:-translate-y-0.5"
                        >
                            🖨️ Print Report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinalReport;
