import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';


const LiveAnswerBox = ({ isTimerRunning, micEnabled = true, timer, maxTimer, onSubmitAnswer, onEndInterview, layout = 'footer', onPermissionChange }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [interimText, setInterimText] = useState('');
    const [audioLevels, setAudioLevels] = useState(Array(15).fill(2));
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const audioBlobRef = useRef(null);
    const typedTextRef = useRef('');
    const interimTextRef = useRef('');
    const recognitionRef = useRef(null);
    const animationFrameRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [permissionError, setPermissionError] = useState(false);
    const isRecordingRef = useRef(false);
    const stoppedRef = useRef(false); // guards against async race conditions
    const hasErrorRef = useRef(false);
    useEffect(() => { typedTextRef.current = typedText; }, [typedText]);
    useEffect(() => { interimTextRef.current = interimText; }, [interimText]);

    const stopAll = () => {
        // Mark as stopped FIRST — prevents any in-flight async startRecording from proceeding
        stoppedRef.current = true;
        isRecordingRef.current = false;

        // Stop MediaRecorder
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        } catch (_) { }

        // Stop all stream tracks (releases the mic hardware)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch (_) { } });
            streamRef.current = null;
        }

        // Cancel visualizer
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }

        // Abort speech recognition (abort is immediate, stop allows onend to fire)
        try { recognitionRef.current?.abort(); } catch (_) { }

        setAudioLevels(Array(15).fill(4));
        setIsRecording(false);
    };

    const startRecording = async () => {
        // Reset the stop guard — we're intentionally starting
        stoppedRef.current = false;
        hasErrorRef.current = false;
        setTypedText('');
        setInterimText('');
        setPermissionError(false);
        audioChunksRef.current = [];
        audioBlobRef.current = null;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // CRITICAL: Check if stopAll was called while we were awaiting getUserMedia
            if (stoppedRef.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            streamRef.current = stream;
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 64;
            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let lastUpdateTime = 0;
            const updateLevels = (timestamp) => {
                if (stoppedRef.current) return; // bail if stopped
                if (timestamp - lastUpdateTime < 60) {
                    animationFrameRef.current = requestAnimationFrame(updateLevels);
                    return;
                }
                lastUpdateTime = timestamp;

                analyser.getByteFrequencyData(dataArray);
                const levels = Array.from({ length: 15 }, (_, i) => {
                    const val = dataArray[i * 2] || 0;
                    return Math.max(4, (val / 255) * 48);
                });

                setAudioLevels(prev => {
                    const changed = levels.some((v, i) => Math.abs(v - prev[i]) > 2);
                    return changed ? levels : prev;
                });
                animationFrameRef.current = requestAnimationFrame(updateLevels);
            };
            animationFrameRef.current = requestAnimationFrame(updateLevels);
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mr.onstop = () => { audioBlobRef.current = new Blob(audioChunksRef.current, { type: 'audio/webm' }); };
            mr.start(250);
            mediaRecorderRef.current = mr;
            isRecordingRef.current = true;
            setIsRecording(true);
            try { recognitionRef.current?.start(); } catch { }
        } catch (err) {
            console.error('Mic Access Failed:', err);
            isRecordingRef.current = false;
            setIsRecording(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied')) {
                setPermissionError(true);
                if (onPermissionChange) onPermissionChange(true);
            }
        }
    };

    const handleRetryPermission = () => {
        setPermissionError(false);
        if (onPermissionChange) onPermissionChange(false);
        startRecording();
    };

    const handleDismissPermission = () => {
        setPermissionError(false);
        if (onPermissionChange) onPermissionChange(false);
    };
    const handleSubmit = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Kill everything immediately
        stopAll();

        // Give MediaRecorder a moment to finalize the onstop and blob creation
        const checkBlob = (attempts) => {
            const finalTranscript = (typedTextRef.current + interimTextRef.current).trim();

            if (audioBlobRef.current || attempts <= 0) {
                onSubmitAnswer(finalTranscript, audioBlobRef.current);
            } else {
                setTimeout(() => checkBlob(attempts - 1), 60);
            }
        };

        checkBlob(15);
    };

    // Derive whether we should be recording from props
    // Include !isSubmitting to prevent mic restart after handleSubmit→stopAll
    // but before the parent sets isEvaluating (which makes isTimerRunning false)
    const shouldRecord = isTimerRunning && micEnabled && !isSubmitting;

    useEffect(() => {
        if (shouldRecord && !isRecordingRef.current) {
            startRecording();
        } else if (!shouldRecord) {
            // Always enforce mic-off when shouldRecord is false,
            // even if isRecordingRef is already false (handles edge cases
            // where refs were cleared but streams/recognition survived)
            stopAll();
        }
    }, [shouldRecord]);

    // Cleanup on unmount — ensures mic is released no matter what
    useEffect(() => {
        return () => {
            stoppedRef.current = true;
            isRecordingRef.current = false;
            try {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
            } catch (_) { }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch (_) { } });
                streamRef.current = null;
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
                audioContextRef.current = null;
            }
            try { recognitionRef.current?.abort(); } catch (_) { }
        };
    }, []);

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const r = new SR();
        r.continuous = true; r.interimResults = true; r.lang = 'en-US';
        r.onresult = (e) => {
            let final = '';
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
                else interim += e.results[i][0].transcript;
            }
            if (final) setTypedText(prev => (prev + final).trimStart());
            setInterimText(interim);
        };
        r.onstart = () => {
            hasErrorRef.current = false;
        };
        r.onerror = (e) => {
            // console.error('STT Error:', e.error); // Removed console.error
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'network') {
                hasErrorRef.current = true;
            }
        };
        r.onend = () => {
            if (isRecordingRef.current && !stoppedRef.current && !hasErrorRef.current) {
                try {
                    // Small delay to avoid rapid-fire restarts
                    setTimeout(() => {
                        if (isRecordingRef.current && !stoppedRef.current) {
                            recognitionRef.current?.start();
                        }
                    }, 500);
                } catch { }
            }
        };
        recognitionRef.current = r;
        return () => { try { r.abort(); } catch { } };
    }, []);
    useEffect(() => {
        const checkBrave = async () => {
            if (navigator.brave && await navigator.brave.isBrave()) {
            }
        };
        checkBrave();
    }, []);
    // isRecordingRef is now managed directly in startRecording() and stopAll()
    const hasShownToastRef = useRef(false);

    useEffect(() => {
        if (timer === 0 && !isTimerRunning && !permissionError) {
            if (!hasShownToastRef.current) {
                hasShownToastRef.current = true;
            }
            const id = setTimeout(handleSubmit, 1000);
            return () => clearTimeout(id);
        } else if (timer > 0) {
            hasShownToastRef.current = false;
        }
    }, [timer, isTimerRunning, handleSubmit, permissionError]);

    const timerPct = maxTimer ? (timer / maxTimer) * 100 : 100;

    return (
        <div className="flex flex-col gap-2 md:gap-6 max-w-2xl mx-auto w-full px-1 sm:px-2">
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] p-2.5 sm:p-5 md:p-8 border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-x-hidden transition-all duration-500">

                <div className="flex flex-col items-center gap-2 sm:gap-4 md:gap-8 relative z-10">
                    <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2 md:gap-4">
                        <div className="h-8 sm:h-12 md:h-16 flex items-center justify-center gap-1 px-4">
                            {audioLevels.map((h, i) => (
                                <motion.div
                                    key={i}
                                    style={{ height: `${h}px` }}
                                    className="w-0.75 sm:w-1 md:w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-violet-600 opacity-80"
                                    animate={{ height: isRecording ? Math.max(3, h) : 3 }}
                                />
                            ))}
                        </div>

                        <AnimatePresence>
                            {(isRecording && (typedText || interimText)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-12 sm:top-16 md:top-24 left-0 right-0 px-4 md:px-8 text-center pointer-events-none"
                                >
                                    <p className="text-[9px] sm:text-xs md:text-base font-medium text-slate-500 leading-relaxed max-w-xs sm:max-w-md mx-auto line-clamp-1 italic">
                                        {typedText}
                                        <span className="text-indigo-400 opacity-60">{interimText}</span>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 bg-indigo-50/50 px-2 sm:px-2.5 py-1 md:px-4 md:py-2 rounded-full border border-indigo-100/50">
                                <div className="relative flex items-center justify-center w-1 sm:w-1.5 h-1 sm:h-1.5">
                                    <div className={`w-full h-full rounded-full transition-all duration-300 ${isRecording ? 'bg-rose-500' : !shouldRecord && isTimerRunning ? 'bg-amber-400' : 'bg-slate-300'}`} />
                                    {isRecording && (
                                        <div className="absolute inset-0 w-full h-full rounded-full bg-rose-500 animate-ping opacity-40" />
                                    )}
                                </div>
                                <span className={`text-[7px] sm:text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${isRecording ? 'text-indigo-900' : !shouldRecord && isTimerRunning ? 'text-amber-600' : 'text-slate-400'}`}>
                                    {isRecording ? 'Recording' : !shouldRecord && isTimerRunning ? 'Mic Paused' : 'Mic Off'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {isTimerRunning && (
                        <div className="w-full max-w-sm px-2">
                            <div className="flex items-center justify-between mb-1 px-0.5">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Efficiency Window</span>
                                <span className={`text-[10px] font-black tabular-nums ${timer <= 10 ? 'text-rose-500 animate-pulse' : 'text-indigo-500'}`}>
                                    {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                                </span>
                            </div>
                            <div className="h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 shadow-inner">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${timerPct}%` }}
                                    className={`h-full rounded-full transition-colors duration-1000 ${timer <= 10 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'}`}
                                />
                            </div>
                        </div>
                    )}

                    <div className={`flex items-center gap-2 md:gap-3 w-full ${layout === 'sidebar' ? 'flex-col' : 'flex-row'}`}>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!isRecording && !typedText.trim())}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 md:py-5 rounded-xl md:rounded-[2rem] font-bold text-[10px] md:text-sm uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${isSubmitting || (!isRecording && !typedText.trim())
                                ? 'bg-slate-50 text-slate-300 border border-slate-100'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-indigo-200/50 hover:shadow-indigo-300/50'
                                }`}
                        >
                            <span>{isSubmitting ? 'Processing' : 'Commit'}</span>
                        </button>

                        {onEndInterview && (
                            <button
                                onClick={() => { stopAll(); onEndInterview?.(); }}
                                className={`flex items-center justify-center gap-2 w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-5 bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl md:rounded-[2rem] transition-all shadow-sm shrink-0`}
                                title="Terminate Early"
                                type="button"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                <span className={`text-[10px] md:text-sm font-black uppercase tracking-widest hidden md:inline`}>End</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Permission Error Overlay */}
                <AnimatePresence>
                    {permissionError && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 border border-rose-100 shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Microphone Blocked</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mb-8">
                                Please click the 🔒 <b>lock icon</b> in your browser's address bar, enable the <b>Microphone</b>, and then try again.
                            </p>
                            <div className="flex flex-col gap-3 w-full max-w-[240px]">
                                <button
                                    onClick={handleRetryPermission}
                                    className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95"
                                >
                                    I've Enabled It - Retry
                                </button>
                                <button
                                    onClick={handleDismissPermission}
                                    className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LiveAnswerBox;
