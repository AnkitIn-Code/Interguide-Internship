import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AudioCheck = ({ onConfirm, setMicBlocked, type = 'interview' }) => {
    const [audioLevels, setAudioLevels] = useState(Array(15).fill(4));
    const [status, setStatus] = useState('ready'); // ready, listening, success, error
    const streamRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    const cleanupStream = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const startCheck = async () => {
        try {
            setStatus('listening');
            if (navigator.permissions && navigator.permissions.query) {
                const status = await navigator.permissions.query({ name: 'microphone' });
                if (status.state === 'denied') {
                    throw new Error('Permission denied');
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }
            const analyser = ctx.createAnalyser();
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 64;
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const update = () => {
                analyser.getByteFrequencyData(dataArray);
                const levels = Array.from({ length: 15 }, (_, i) => {
                    const val = dataArray[i * 2] || 0;
                    if (val > 40) {
                        setStatus('success');
                        // Release mic immediately after detecting audio — no need to hold it
                        cleanupStream();
                    }
                    return Math.max(4, (val / 255) * 60);
                });
                setAudioLevels(levels);
                // Only continue animating if stream is still active
                if (streamRef.current) {
                    animationRef.current = requestAnimationFrame(update);
                }
            };
            animationRef.current = requestAnimationFrame(update);
        } catch (err) {
            console.error('Audio Check Failed:', err);
            setStatus('error');
            setMicBlocked(true);
        }
    };

    useEffect(() => {
        const checkPermission = async () => {
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const status = await navigator.permissions.query({ name: 'microphone' });
                    if (status.state === 'denied') {
                        setStatus('error');
                    }
                }
            } catch (e) {}
        };
        checkPermission();

        return () => cleanupStream();
    }, []);

    const messages = {
        interview: {
            ready: 'Let\'s ensure the AI interviewer can hear you clearly. We highly recommend testing your microphone now.',
            success: 'Vocal clarity verified. You are perfectly set to start your interview.'
        },
        placement: {
            ready: 'Please ensure you are in a quiet environment and your microphone is active for the assessment.',
            success: 'Audio levels optimized. Your spoken proficiency can now be analyzed accurately.'
        }
    }[type] || {
        ready: 'Let\'s verify your audio before we begin.',
        success: 'Audio check successful.'
    };

    return (
        <div className="flex-grow flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white/70 backdrop-blur-3xl p-6 sm:p-10 lg:p-14 rounded-[2rem] sm:rounded-[3rem] border border-white shadow-[0_30px_100px_-10px_rgba(0,0,0,0.06)] text-center max-w-lg w-full relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${status === 'success' ? 'from-emerald-400 to-teal-500' : 'from-blue-400 to-indigo-500'}`} />
                
                <div className="mb-6 sm:mb-10 relative">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-100/50 border border-blue-50 relative z-10 transition-all duration-500">
                        {status === 'success' ? (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex items-center gap-[2px] sm:gap-1">
                                {audioLevels.map((h, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: h }}
                                        className={`w-1 sm:w-1.5 rounded-full ${status === 'listening' ? 'bg-gradient-to-t from-blue-500 to-indigo-400' : 'bg-slate-100'}`}
                                        style={{ height: '4px' }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-slate-900 mb-3 sm:mb-4 tracking-tighter">
                    {status === 'success' ? 'Check Successful!' : 'Audio System Check'}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-10 leading-relaxed px-1 sm:px-4">
                    {status === 'success' 
                        ? messages.success
                        : status === 'listening'
                            ? "Please say 'Hello AI' or 'Testing 1 2 3' clearly to verify."
                            : messages.ready
                    }
                </p>

                <div className="flex flex-col gap-4">
                    {status === 'ready' && (
                        <button
                            onClick={startCheck}
                            className="group relative inline-flex justify-center items-center px-10 py-4 bg-blue-600 text-white font-black text-xs rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em]"
                        >
                            <span className="relative z-10">Test Microphone</span>
                        </button>
                    )}

                    {status === 'listening' && (
                        <div className="py-4 px-6 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
                            Listening for input...
                        </div>
                    )}

                    {status === 'success' && (
                        <button
                            onClick={onConfirm}
                            className="group relative inline-flex justify-center items-center px-10 py-4 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em]"
                        >
                            <span className="relative z-10">Begin Assessment</span>
                        </button>
                    )}
                    
                    {status === 'error' && (
                        <div className="space-y-6 pt-2">
                             <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-left">
                                <div className="flex gap-3 items-start mb-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 24 24"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 016 0v2H7V7z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-rose-900 font-black text-[11px] uppercase tracking-wider mb-1">How to enable:</h4>
                                        <p className="text-rose-600/80 text-[11px] leading-relaxed font-medium">
                                            1. Tap/Click the <span className="font-bold">🔒 Lock Icon</span> or <span className="font-bold">Settings</span> in the address bar.<br/>
                                            2. Locate <span className="font-bold">Microphone</span> and set it to <span className="font-bold text-rose-700">Allow</span>.<br/>
                                            3. Refresh this page to continue.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    I've enabled it - Refresh Page
                                </button>
                                <button onClick={() => setStatus('ready')} className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">
                                    Try again anyway
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioCheck;
