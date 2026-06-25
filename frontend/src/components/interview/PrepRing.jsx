import React from 'react';

const PrepRing = ({ seconds, total, frozen, onStartNow }) => {
    const r = 32, circ = 2 * Math.PI * r;
    const offset = frozen ? 0 : circ - (circ * seconds) / total;
    const urgent = !frozen && seconds <= 2;
    return (
        <div className="flex flex-col items-center gap-2 mt-2 sm:mt-4 animate-in fade-in zoom-in duration-700">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 -rotate-90 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.1)]" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
                    <circle cx="36" cy="36" r={r} fill="none"
                        stroke={urgent ? '#ef4444' : '#3b82f6'} strokeWidth="5"
                        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', boxShadow: '0 0 20px currentColor' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg sm:text-xl font-black tabular-nums tracking-tighter ${urgent ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                        {seconds}
                    </span>
                    <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">Sec</span>
                </div>
            </div>
            <div className="text-center px-4">
                <p className="font-bold text-slate-700 text-xs sm:text-sm">{frozen ? 'Listening…' : 'Final Prep…'}</p>
            </div>
            <button onClick={onStartNow}
                className="group relative flex items-center justify-center px-4 sm:px-6 py-1.5 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(37,99,235,0.2)] text-[10px] sm:text-xs transition-all hover:scale-105 active:scale-95">
                <div className="absolute inset-0 rounded-full border border-blue-400 opacity-20 group-hover:animate-ping" />
                {frozen ? 'Speak Now' : 'Begin'}
            </button>
        </div>
    );
};

export default PrepRing;
