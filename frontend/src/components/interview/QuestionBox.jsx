import React, { useEffect, useState, useCallback, useRef } from 'react';
import { speakText } from '../../services/interviewApi';
import PrepRing from './PrepRing';
const PREP_SECONDS = 5;
const PulseRings = () => (
    <>
        {[0.4, 0.7, 1.0, 1.3].map((delay, i) => (
            <div key={i} className="absolute inset-0 rounded-full border border-blue-400 opacity-0"
                style={{ animation: `ringP 3s ease-out ${delay}s infinite` }} />
        ))}
        <style>{`
            @keyframes ringP{
                0%{transform:scale(1);opacity:.4}
                100%{transform:scale(2.2);opacity:0}
            }
            @keyframes rotateRing{
                0%{transform:rotate(0deg)}
                100%{transform:rotate(360deg)}
            }
        `}</style>
    </>
);
const Waveform = ({ active }) => {
    const bars = [25, 45, 65, 35, 75, 40, 60, 45, 80, 50, 70, 40, 65, 30, 50];
    return (
        <div className="flex items-center justify-center gap-[3px] h-8 mt-4">
            {bars.map((v, i) => (
                <div key={i} className={`w-1 rounded-full ${active ? 'bg-blue-400' : 'bg-slate-200'}`}
                    style={{
                        height: `${active ? v : 15}%`,
                        opacity: active ? 1 : 0.6,
                        animation: active ? `pulseWave ${0.6 + (i % 4) * 0.2}s ease-in-out ${i * 0.08}s infinite alternate` : 'none',
                        boxShadow: active ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none'
                    }} />
            ))}
            <style>{`@keyframes pulseWave{from{transform:scaleY(.4); opacity:.5}to{transform:scaleY(1.2); opacity:1}}`}</style>
        </div>
    );
};
const QuestionBox = React.forwardRef(({ questionText, onTimerStart, onStateChange }, ref) => {
    const [uiPhase, setUiPhase] = useState('speaking');
    const [repeatCount, setRepeatCount] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [prepSeconds, setPrepSeconds] = useState(PREP_SECONDS);
    const [isBlurring, setIsBlurring] = useState(true);
    const [ttsReady, setTtsReady] = useState(false);
    const audioRef = useRef(null);
    const prepIntervalRef = useRef(null);
    const hasStartedRef = useRef(false);
    const speakControllerRef = useRef(null);

    useEffect(() => {
        if (onStateChange) {
            onStateChange({ uiPhase, prepSeconds, isSpeaking });
        }
    }, [uiPhase, prepSeconds, isSpeaking, onStateChange]);

    const stopAudio = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
        setIsSpeaking(false);
    }, []);
    const triggerStart = useCallback(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;
        speakControllerRef.current?.abort();
        if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
        setUiPhase('done');
        onTimerStart();
    }, [onTimerStart]);
    const startPrepTimer = useCallback(() => {
        setPrepSeconds(PREP_SECONDS);
        setUiPhase('prep');
        if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
        prepIntervalRef.current = setInterval(() => {
            setPrepSeconds(p => {
                if (p <= 1) { clearInterval(prepIntervalRef.current); triggerStart(); return 0; }
                return p - 1;
            });
        }, 1000);
    }, [triggerStart]);

    React.useImperativeHandle(ref, () => ({
        triggerStart
    }));

    const speak = useCallback(async (text, signal) => {
        stopAudio(); setIsSpeaking(true);
        const tryPlay = async (v) => {
            const url = await speakText(text, v);
            if (signal?.aborted) { URL.revokeObjectURL(url); return; }
            const a = new Audio(url); audioRef.current = a;
            return new Promise((res, rej) => {
                const done = () => { URL.revokeObjectURL(url); res(); };
                a.onended = done; a.onerror = () => { URL.revokeObjectURL(url); rej(new Error('play error')); };
                a.onplay = () => {
                    // Audio actually started — reveal the question NOW
                    setTtsReady(true);
                    setIsBlurring(false);
                };
                const p = a.play(); if (p) p.catch(() => { URL.revokeObjectURL(url); rej(new Error('play blocked')); });
                signal?.addEventListener('abort', () => { a.pause(); done(); });
            });
        };
        try { await tryPlay('en-US-ChristopherNeural'); }
        catch {
            try { if (!signal?.aborted) await tryPlay('en-GB-LibbyNeural'); }
            catch {
                if (!signal?.aborted) {
                    // Fallback: reveal question immediately for browser synth
                    setTtsReady(true);
                    setIsBlurring(false);
                    await new Promise(res => {
                        if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB';
                            u.onend = res; u.onerror = res; window.speechSynthesis.speak(u);
                            signal?.addEventListener('abort', () => { window.speechSynthesis.cancel(); res(); });
                        } else setTimeout(res, Math.max(3000, text.length * 55));
                    });
                }
            }
        }
        if (!signal?.aborted) { setIsSpeaking(false); startPrepTimer(); }
    }, [stopAudio, startPrepTimer]);
    useEffect(() => {
        if (!questionText) return;

        let isMounted = true;
        const ctrl = new AbortController();
        speakControllerRef.current = ctrl;
        hasStartedRef.current = false;

        setUiPhase('speaking');
        setRepeatCount(0);
        setPrepSeconds(PREP_SECONDS);
        setIsBlurring(true);
        setTtsReady(false);

        // Start TTS immediately — question stays hidden until audio.onplay fires
        if (isMounted && !ctrl.signal.aborted) {
            speak(questionText, ctrl.signal);
        }

        // Safety fallback: if TTS takes too long (>15s), reveal anyway
        const safetyTimer = setTimeout(() => {
            if (isMounted && !ctrl.signal.aborted) {
                setTtsReady(true);
                setIsBlurring(false);
            }
        }, 15000);

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            ctrl.abort();
            speakControllerRef.current = null;
            stopAudio();
            if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
        };
    }, [questionText, speak, stopAudio]);
    const handleRepeat = async () => {
        if (repeatCount >= 1 || hasStartedRef.current || isSpeaking) return;
        if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
        setRepeatCount(p => p + 1);
        setPrepSeconds(PREP_SECONDS);
        setUiPhase('speaking');
        const ctrl = new AbortController(); speakControllerRef.current = ctrl;
        await speak(questionText, ctrl.signal);
    };
    const statusLabel = isSpeaking ? 'AI Speaking' : uiPhase === 'prep' ? 'Pause' : uiPhase === 'done' ? 'Listening' : '';
    const statusColor = isSpeaking ? 'text-blue-500' : uiPhase === 'done' ? 'text-emerald-500' : 'text-slate-400';
    return (
        <div className="relative w-full flex flex-col items-center">
            { }
            {isBlurring && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-500">
                    <div className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] animate-pulse">System Scanning</span>
                    </div>
                </div>
            )}
            <div className={`flex flex-col items-center justify-center text-center w-full max-w-lg lg:max-w-4xl px-4 transition-all duration-700 ${isBlurring ? 'blur-3xl grayscale opacity-0 scale-110' : 'blur-0 grayscale-0 opacity-100 scale-100'}`}>
                { }
                <div className="relative flex items-center justify-center w-[60px] h-[60px] sm:w-32 sm:h-32 lg:w-40 lg:h-40 mb-1 lg:mb-6 shrink-0">
                    {isSpeaking && <PulseRings />}
                    <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-[80px] transition-all duration-1000 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`} />
                    { }
                    <div className={`absolute -inset-1 sm:-inset-2 lg:-inset-3 rounded-full border-2 border-dashed border-blue-400/20 transition-all duration-1000 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: 'rotateRing 20s linear infinite' }} />
                    <div className={`relative w-[60px] h-[60px] sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full bg-white/90 backdrop-blur-2xl border border-white shadow-[0_25px_60px_-15px_rgba(79,70,229,0.2)] transition-all duration-700 transform ${isSpeaking ? 'scale-105 ring-[4px] sm:ring-[8px] ring-indigo-500/5' : 'scale-100 rotate-0'}`}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/50 via-white to-transparent rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_70%)]" />
                        </div>
                        <div className="flex items-center justify-center h-full relative z-10">
                            <span className="text-blue-600 text-2xl sm:text-6xl lg:text-7xl font-black tracking-tighter italic select-none drop-shadow-sm">AI</span>
                        </div>
                        { }
                        <div className={`absolute top-0.5 right-0.5 sm:top-2 sm:right-2 lg:top-3 lg:right-3 w-4 h-4 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full border-[2px] sm:border-[4px] border-white shadow-lg ${uiPhase === 'done' ? 'bg-emerald-500' : isSpeaking ? 'bg-blue-600 animate-pulse ring-2 sm:ring-4 ring-blue-100' : 'bg-slate-300'}`} />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1.5 mb-1 lg:mb-3">
                    <span className={`text-[8px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] ${statusColor} bg-slate-50 px-3 py-1 rounded-full border border-slate-100 shadow-sm`}>
                        {statusLabel}
                    </span>
                    {uiPhase === 'done' && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <Waveform active={isSpeaking} />
                { }
                <div className="mt-2 sm:mt-4 lg:mt-8 w-full transition-all duration-700 transform">
                    <div className="relative p-[1px] rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[4rem] bg-gradient-to-br from-indigo-500/20 via-blue-400/20 to-transparent shadow-[0_20px_50px_rgba(79,70,229,0.08)] w-full lg:max-w-3xl lg:mx-auto">
                        <div className="bg-white/70 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[4rem] px-5 sm:px-8 lg:px-12 py-5 sm:py-7 lg:py-12 border border-white relative overflow-hidden">
                            { }
                            {/* Premium Quotes */}
                            <div className="absolute top-4 left-4 sm:top-6 sm:left-8 opacity-20 pointer-events-none">
                                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-500" fill="currentColor" viewBox="0 0 32 32">
                                    <path d="M10 8c-3.3 0-6 2.7-6 6v10c0 1.1 0.9 2 2 2h8c1.1 0 2-0.9 2-2v-10c0-1.1-0.9-2-2-2h-4c0-2.2 1.8-4 4-4 0.6 0 1-0.4 1-1v-2c0-0.6-0.4-1-1-1h-1zM26 8c-3.3 0-6 2.7-6 6v10c0 1.1 0.9 2 2 2h8c1.1 0 2-0.9 2-2v-10c0-1.1-0.9-2-2-2h-4c0-2.2 1.8-4 4-4 0.6 0 1-0.4 1-1v-2c0-0.6-0.4-1-1-1h-1z" />
                                </svg>
                            </div>
                            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 opacity-20 rotate-180 pointer-events-none">
                                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-500" fill="currentColor" viewBox="0 0 32 32">
                                    <path d="M10 8c-3.3 0-6 2.7-6 6v10c0 1.1 0.9 2 2 2h8c1.1 0 2-0.9 2-2v-10c0-1.1-0.9-2-2-2h-4c0-2.2 1.8-4 4-4 0.6 0 1-0.4 1-1v-2c0-0.6-0.4-1-1-1h-1zM26 8c-3.3 0-6 2.7-6 6v10c0 1.1 0.9 2 2 2h8c1.1 0 2-0.9 2-2v-10c0-1.1-0.9-2-2-2h-4c0-2.2 1.8-4 4-4 0.6 0 1-0.4 1-1v-2c0-0.6-0.4-1-1-1h-1z" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-[8px] sm:text-[9px] lg:text-sm font-black text-indigo-500/60 uppercase tracking-[0.4em] mb-2 sm:mb-4 drop-shadow-sm">System Analysis</span>
                                <p className="text-slate-900 text-sm sm:text-base lg:text-2xl font-black leading-tight sm:leading-snug lg:leading-relaxed tracking-tight max-w-sm lg:max-w-2xl px-2">
                                    {questionText}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                { }
                {(uiPhase === 'speaking' || uiPhase === 'prep') ? (
                    <div className="mt-1 sm:mt-4 lg:mt-8 shrink-0 lg:hidden">
                        <PrepRing seconds={prepSeconds} total={PREP_SECONDS} frozen={uiPhase === 'speaking'} onStartNow={triggerStart} />
                    </div>
                ) : uiPhase === 'done' && (
                    <div className="mt-3 lg:mt-6 flex flex-col items-center gap-1.5 lg:gap-2 animate-in slide-in-from-bottom duration-500 shrink-0">
                        <div className="px-4 py-1.5 bg-emerald-500/5 backdrop-blur-md rounded-full border border-emerald-500/10 shadow-sm flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <p className="text-emerald-700 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
                                Awaiting Response
                            </p>
                        </div>
                        <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold leading-relaxed uppercase tracking-widest opacity-60">
                            Speak clearly for accurate analysis
                        </p>
                    </div>
                )}
                {uiPhase === 'prep' && repeatCount < 1 && !isSpeaking && (
                    <button onClick={handleRepeat}
                        className="mt-3 sm:mt-6 lg:mt-8 flex items-center gap-2 text-[9px] sm:text-[10px] lg:text-xs text-slate-400 hover:text-blue-600 font-bold uppercase tracking-[0.2em] transition-all bg-white/50 backdrop-blur-sm px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 rounded-full border border-slate-100 hover:bg-white shrink-0 shadow-sm">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Repeat Question
                    </button>
                )}
            </div>
        </div>
    );
});
export default QuestionBox;
