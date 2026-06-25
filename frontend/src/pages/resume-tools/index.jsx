import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import AiResumeBuilder from './AiResumeBuilder';
import AtsAnalyzer from './AtsAnalyzer';

const TAB_BUILDER = 'builder';
const TAB_ATS     = 'ats';

const ResumeToolsPage = () => {
  const navigate  = useNavigate();
  const [tab, setTab] = useState(() => {
    // Preserve last tab across page refreshes
    return localStorage.getItem('resumeTools_tab') || TAB_BUILDER;
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) navigate('/user-login');
  }, [navigate]);

  const switchTab = (t) => {
    setTab(t);
    localStorage.setItem('resumeTools_tab', t);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px 0',
        borderBottom: '1.5px solid var(--color-border, #e5e7eb)',
        background: 'var(--color-card, #fff)',
      }}>
        {[
          { key: TAB_BUILDER, label: '📝 Resume Builder',    sub: 'Build & download ATS-ready resume' },
          { key: TAB_ATS,     label: '🎯 ATS Analyzer',      sub: 'Score resume vs job description'  },
        ].map(({ key, label, sub }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => switchTab(key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '10px 20px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: active ? '3px solid #6366f1' : '3px solid transparent',
                transition: 'border-color 0.2s',
                marginBottom: -1.5,
              }}
            >
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: active ? '#6366f1' : '#6b7280',
              }}>{label}</span>
              <span style={{ fontSize: 11, color: active ? '#a5b4fc' : '#9ca3af', marginTop: 2 }}>
                {sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <main>
        {tab === TAB_BUILDER && (
          <div className="px-3 md:px-6 py-4 md:py-6">
            <AiResumeBuilder />
          </div>
        )}
        {tab === TAB_ATS && (
          /* AtsAnalyzer renders its own padding & Header call is suppressed by passing inTab prop */
          <AtsAnalyzer inTab />
        )}
      </main>
    </div>
  );
};

export default ResumeToolsPage;
