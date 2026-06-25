import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionBox from './QuestionBox';
import LiveAnswerBox from './LiveAnswerBox';
import PrepRing from './PrepRing';
import AudioCheck from './AudioCheck';
import { evaluateAnswer, generateReport, prefetchTts } from '../../services/interviewApi';
const TIMER_BY_DIFFICULTY = { Easy: 45, easy: 45, Medium: 60, medium: 60, Hard: 90, hard: 90 };

const InterviewRoom = ({ questions, jobRole, onComplete }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timer, setTimer] = useState(TIMER_BY_DIFFICULTY[questions[0]?.difficulty] || 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [phase, setPhase] = useState('ready');
    const [lastAnalysis, setLastAnalysis] = useState(null);
    const [lastEvaluation, setLastEvaluation] = useState(null);
    const [systemError, setSystemError] = useState(null);
    const [micBlocked, setMicBlocked] = useState(false);
    const [prepState, setPrepState] = useState({ uiPhase: 'speaking', prepSeconds: 5, isSpeaking: false });
    const [micEnabled, setMicEnabled] = useState(false);
    const isSubmittingRef = useRef(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Pre-fetch TTS for the first question during the audio-check phase
    useEffect(() => {
        if (phase === 'audio-check' && questions[0]?.question) {
            prefetchTts(questions[0].question, 'en-US-ChristopherNeural');
        }
    }, [phase]);

    const questionBoxRef = useRef(null);
    const currentQuestion = questions[currentIdx];
    const isLastQuestion = currentIdx === questions.length - 1;
    useEffect(() => {
        if (!isTimerRunning || timer <= 0 || micBlocked) return;
        const id = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    setIsTimerRunning(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [isTimerRunning, timer]);
    const handleTimerStart = useCallback(() => {
        setMicEnabled(true);
        setIsTimerRunning(true);
    }, []);
    const handleAnswerSubmit = useCallback(async (transcript, blob) => {
        isSubmittingRef.current = true;
        setIsTimerRunning(false);
        setMicEnabled(false);
        setPhase('processing');
        setLastAnalysis(null);
        setLastEvaluation(null);

        let evaluation = null;
        let analysis = { transcript: transcript || '' };

        if (blob && blob.size > 0) {
            try {
                const fd = new FormData();
                fd.append('audio', blob, 'answer.webm');
                fd.append('question', currentQuestion.question);
                fd.append('job_role', jobRole || '');

                const result = await evaluateAnswer(fd);

                if (result.status === 'success') {
                    analysis = result.data.analysis;
                    evaluation = result.data.evaluation;
                    setLastAnalysis(analysis);
                    setLastEvaluation(evaluation);

                    const wWords = (analysis?.transcript || '').split(' ').filter(Boolean).length;
                    const bWords = (transcript || '').split(' ').filter(Boolean).length;
                    if (wWords < bWords) analysis.transcript = transcript;
                }
            } catch (err) {
                console.error('Answer evaluation failed:', err);
                analysis.failed = true;
            }
        } else {
            // No audio blob provided or empty blob
        }

        const newAnswer = {
            question: currentQuestion.question,
            answer: analysis?.transcript || transcript || '',
            transcript: analysis?.transcript || transcript || '',
            evaluation: evaluation || null,
            analysis: analysis || null,
            ideal_answer: currentQuestion.ideal_answer,
        };

        const updatedAnswers = [...answers, newAnswer];
        setAnswers(updatedAnswers);

        await new Promise(res => setTimeout(res, 800));
        if (!isLastQuestion) {
            const nextIdx = currentIdx + 1;
            setCurrentIdx(nextIdx);
            setTimer(TIMER_BY_DIFFICULTY[questions[nextIdx]?.difficulty] || 60);
            await new Promise(res => setTimeout(res, 100));
            setPhase('answering');
            isSubmittingRef.current = false;
        } else {
            setPhase('finishing');
            try {
                const result = await generateReport(updatedAnswers, jobRole);
                onComplete({ ...result.data, answers: updatedAnswers });
            } catch (err) {
                console.error('Final report generation failed:', err);
                setSystemError('We encountered a critical failure generating your final report.');
                isSubmittingRef.current = false;
            }
        }
    }, [currentIdx, phase, currentQuestion, jobRole, answers, questions, onComplete]);

    const handleEndInterview = useCallback(async () => {
        setIsTimerRunning(false);
        setPhase('finishing');
        const currentSkipped = { question: currentQuestion.question, answer: '', transcript: '', evaluation: null, skipped: true, ideal_answer: currentQuestion.ideal_answer };
        const remaining = questions.slice(currentIdx + 1).map(q => ({ question: q.question, answer: '', transcript: '', evaluation: null, skipped: true, ideal_answer: q.ideal_answer }));
        const allAnswers = [...answers, currentSkipped, ...remaining];
        try {
            const result = await generateReport(allAnswers, jobRole);
            onComplete({ ...result.data, answers: allAnswers });
        } catch (err) {
            console.error('Final report generation failed (end early):', err);
            setSystemError('We could not synthesize your report after ending the session. Technical logs have recorded the incident.');
        }
    }, [currentQuestion.question, questions, currentIdx, answers, jobRole, onComplete]);

    if (systemError) return (
        <div className="flex-grow flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-rose-100 text-center max-w-md w-full animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-rose-500 border border-rose-100 shadow-lg shadow-rose-100">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">System Interruption</h2>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed px-4">{systemError}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">
                        Retry Connection
                    </button>
                    <button onClick={() => window.location.href = '/app/dashboard'}
                        className="w-full py-4 bg-white text-slate-400 font-black text-sm rounded-2xl border border-slate-100 hover:bg-slate-50 uppercase tracking-widest">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );

    if (phase === 'audio-check') return <AudioCheck onConfirm={() => setPhase('answering')} setMicBlocked={setMicBlocked} type="interview" />;
    if (phase === 'ready') return (
        <div className="flex-grow flex items-center justify-center p-4">
            <div className="bg-white/60 backdrop-blur-3xl p-10 sm:p-14 rounded-[3rem] border border-white shadow-[0_30px_100px_-10px_rgba(0,0,0,0.06)] text-center max-w-lg w-full relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <div className="relative mb-10">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-100/50 border border-blue-50 relative z-10 transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-110">
                        <div className="absolute inset-2 rounded-[2rem] border-2 border-dashed border-blue-200 animate-[spin_20s_linear_infinite]" />
                        <span className="text-blue-600 text-4xl font-black italic">AI</span>
                    </div>
                    { }
                    <div className="absolute inset-0 bg-blue-400/10 rounded-full blur-3xl scale-150 group-hover:bg-blue-400/20 transition-all duration-1000" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-blue-600 mb-6 border border-blue-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI-Powered session</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tighter leading-none">Ready for your interview?</h2>
                <div className="space-y-1 mb-10 text-center">
                    <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest leading-loose">{questions.length} Strategic Questions Configured for</p>
                    <p className="text-blue-600 text-lg font-black tracking-tighter italic">{jobRole || 'General Assessment'}</p>
                </div>
                <button
                    onClick={() => setPhase('audio-check')}
                    className="group relative inline-flex justify-center items-center px-10 py-3.5 bg-slate-900 text-white font-black text-xs rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em]"
                >
                    <span className="relative z-10">Start Session</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                </button>
            </div>
        </div>
    );
    if (phase === 'processing' || phase === 'finishing') return (
        <div className="flex-grow flex flex-col w-full min-h-full bg-[#fafbff] items-center justify-center relative overflow-hidden p-4">
            { }
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[100px]" />
            </div>
            <div className="bg-white/70 backdrop-blur-3xl p-10 sm:p-14 rounded-[3rem] border border-white shadow-[0_30px_100px_-10px_rgba(0,0,0,0.06)] text-center max-w-md w-full relative z-10 group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-[pulse_2s_ease-in-out_infinite]" />
                <div className="relative mb-10 w-24 h-24 sm:w-28 sm:h-28 mx-auto">
                    { }
                    <div className="absolute inset-0 rounded-full border-t-4 border-l-4 border-blue-500/20 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-3 rounded-full border-r-4 border-b-4 border-indigo-500/30 animate-[spin_2s_linear_infinite_reverse]" />
                    <div className={`absolute inset-6 rounded-full border-t-4 animate-[spin_1.5s_linear_infinite] ${phase === 'finishing' ? 'border-indigo-600' : 'border-blue-600'}`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shadow-lg border border-blue-50 transition-transform duration-700 group-hover:scale-110">
                            <span className="text-blue-600 text-xl sm:text-2xl font-black italic">AI</span>
                        </div>
                    </div>
                </div>
                <div className="animate-in fade-in slide-in-from-bottom duration-700">
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full mb-4 border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0 mt-[1px]" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 leading-none">
                            System Processing
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
                        {phase === 'finishing' ? 'Generating Report' : isLastQuestion ? 'Final Analysis' : 'Interviewer Thinking'}
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed px-2 sm:px-4">
                        {phase === 'finishing'
                            ? 'Synthesizing performance metrics, identifying areas of improvement, and formulating personalized suggestions.'
                            : 'Processing technical accuracy, vocal clarity, and confidence levels. Please stand by.'}
                    </p>
                </div>
            </div>
        </div>
    );
    return (
        <div className="flex flex-col w-full min-h-full bg-[#fafbff] text-slate-800 font-sans relative overflow-hidden select-none touch-none">
            { }
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] bg-blue-50/60 rounded-full blur-[120px]" />
            </div>
            { }
            <header className="shrink-0 bg-white/60 backdrop-blur-2xl border-b border-indigo-50/50 px-4 sm:px-12 py-3 sm:py-5 flex items-center justify-between z-50 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl items-center justify-center shadow-lg shadow-indigo-100 ring-2 ring-white/50">
                        <span className="text-white font-black text-[10px] sm:text-xs">AI</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">AI-Powered Session</span>
                        </div>
                        <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-none">{jobRole || 'Analysis Session'}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-1 sm:mr-2">
                        <span className="text-[7px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Progress</span>
                        <div className="text-[10px] sm:text-xs font-black text-indigo-600 tabular-nums">
                            {currentIdx + 1}<span className="text-slate-300 font-bold mx-0.5">/</span>{questions.length}
                        </div>
                    </div>
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center relative shadow-sm border border-slate-50">
                        <svg className="w-9 h-9 sm:w-12 sm:h-12 absolute -rotate-90" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="18" fill="none" stroke="#f8fafc" strokeWidth="2.5" />
                            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" className="text-indigo-500" strokeWidth="2.5"
                                strokeDasharray={113.1} strokeDashoffset={113.1 - (113.1 * (currentIdx + 1)) / questions.length} strokeLinecap="round" />
                        </svg>
                        <span className="relative text-[8px] sm:text-[9px] font-black text-slate-600">{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
                    </div>
                </div>
            </header>
            { }
            <main className="flex-grow flex flex-col items-center relative overflow-y-auto overflow-x-hidden z-10 px-3 sm:px-6 lg:px-12 py-4 lg:py-12 no-scrollbar">
                <div className={`w-full max-w-[1600px] flex flex-col lg:grid lg:grid-cols-[280px_1fr_320px] gap-4 sm:gap-8 items-start transition-all duration-1000 ${(timer === 0 && phase === 'answering') ? 'blur-2xl pointer-events-none' : 'blur-0'}`}>
                    
                    {/* Left Sidebar (Desktop) */}
                    <div className="hidden lg:flex flex-col gap-6 sticky top-0">
                        <div className="group bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-blue-500/10 transition-all hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="pr-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">Assessment Level</span>
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Difficulty Matrix</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {[1, 2, 3].map(i => {
                                    const active = (currentQuestion.difficulty === 'Easy' && i === 1) ||
                                        (currentQuestion.difficulty === 'Medium' && i <= 2) ||
                                        (currentQuestion.difficulty === 'Hard');
                                    let colorCls = 'bg-slate-200/50';
                                    if (active) {
                                        if (currentQuestion.difficulty === 'Easy') colorCls = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                                        else if (currentQuestion.difficulty === 'Medium') colorCls = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
                                        else colorCls = 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
                                    }
                                    return <div key={i} className={`h-2 w-10 rounded-full transition-all duration-700 ${colorCls}`} />;
                                })}
                                <span className={`ml-3 text-xs font-black uppercase italic tracking-widest ${currentQuestion.difficulty === 'Easy' ? 'text-emerald-600' : currentQuestion.difficulty === 'Medium' ? 'text-amber-600' : 'text-rose-600'}`}>
                                    {currentQuestion.difficulty}
                                </span>
                            </div>
                        </div>
                        <LiveAnswerBox
                            key={currentIdx + "-desktop"}
                            isTimerRunning={isTimerRunning}
                            micEnabled={micEnabled}
                            timer={timer}
                            maxTimer={TIMER_BY_DIFFICULTY[currentQuestion.difficulty] || 60}
                            onSubmitAnswer={handleAnswerSubmit}
                            onEndInterview={handleEndInterview}
                            layout="sidebar"
                            onPermissionChange={setMicBlocked}
                        />
                    </div>

                    {/* Center Content */}
                    <div className="flex-grow flex flex-col items-center gap-8 w-full max-w-3xl mx-auto">
                        <div className="w-full animate-in fade-in zoom-in duration-1000">
                            <QuestionBox
                                ref={questionBoxRef}
                                questionText={currentQuestion.question}
                                onTimerStart={handleTimerStart}
                                onStateChange={setPrepState}
                            />
                        </div>
                        <div className="lg:hidden h-32 sm:h-40 w-full" /> {/* Spacer for fixed mobile footer */}
                    </div>

                    {/* Right Sidebar (Desktop) */}
                    <div className="hidden lg:flex flex-col gap-6 sticky top-0">
                        {lastAnalysis ? (
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] w-full animate-in slide-in-from-right duration-700">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">AI Intelligence</span>
                                        <h3 className="text-base font-black text-slate-900 tracking-tight">Vocal Performance</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">Pace Stability</span>
                                        <span className={`text-[10px] font-black ${(lastAnalysis.pace_stability || 0) < 0.6 ? 'text-emerald-500' : 'text-amber-500'} uppercase`}>
                                            {(lastAnalysis.pace_stability || 0) < 0.6 ? 'Steady' : 'Variable'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max(20, 100 - (lastAnalysis.pace_stability || 0) * 100)}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs font-bold text-slate-400">Voice Modulation</span>
                                        <span className="text-xs font-black text-slate-800">{Math.round((lastAnalysis.energy_variance || 0) * 1000)} <span className="text-[9px] text-slate-300 font-bold uppercase">MDL</span></span>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (lastAnalysis.energy_variance || 0) * 4000)}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase">Fillers</span>
                                            <span className={`text-xs font-black ${lastAnalysis.filler_count > 2 ? 'text-rose-500' : 'text-slate-700'}`}>{lastAnalysis.filler_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase">Silence</span>
                                            <span className="text-xs font-black text-slate-700">{Math.round((lastAnalysis.pause_ratio || 0) * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-slate-100/50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 border border-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Waiting for first response to begin analysis</span>
                            </div>
                        )}
                        {(prepState.uiPhase === 'speaking' || prepState.uiPhase === 'prep') && (
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-blue-500/10 transition-all hover:-translate-y-1">
                                <PrepRing
                                    seconds={prepState.prepSeconds}
                                    total={5}
                                    frozen={prepState.uiPhase === 'speaking'}
                                    onStartNow={() => questionBoxRef.current?.triggerStart()}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <footer className="fixed bottom-0 sm:bottom-6 inset-x-0 px-2 sm:px-4 pb-4 sm:pb-0 z-50 lg:hidden flex justify-center pointer-events-none no-scrollbar overflow-hidden">
                    <div className="w-full max-w-[420px] mx-auto animate-in slide-in-from-bottom duration-1000 pointer-events-auto">
                        <LiveAnswerBox
                            key={currentIdx + "-mobile"}
                            isTimerRunning={isTimerRunning}
                            micEnabled={micEnabled}
                            timer={timer}
                            maxTimer={TIMER_BY_DIFFICULTY[currentQuestion.difficulty] || 60}
                            onSubmitAnswer={handleAnswerSubmit}
                            onEndInterview={handleEndInterview}
                            layout="footer"
                            onPermissionChange={setMicBlocked}
                        />
                    </div>
                </footer>
            </main>
            { }
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            {timer === 0 && phase === 'answering' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="bg-white/90 backdrop-blur-2xl p-8 sm:p-12 rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.2)] border border-white text-center flex flex-col items-center max-w-sm w-full animate-in zoom-in slide-in-from-bottom-8 duration-700">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                                <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">TIME'S UP!</h3>
                        <div className="mt-8 flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default InterviewRoom;
