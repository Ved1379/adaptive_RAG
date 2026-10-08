import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  Menu,
} from 'lucide-react';
import { getAnalytics } from '../services/api';

export default function Analytics({ onToggleSidebar }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getAnalytics().then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setData(res.data);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#090d16',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0d121f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation sidebar"
            className="mobile-hamburger"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: '#10b981' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Adaptive RAG Analytics
            </h1>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.725rem',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontWeight: 500,
          }}
        >
          Mock Analytics Preview
        </span>
      </header>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              Hallucination Detection & Verification Metrics
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
              Evaluation metrics tracking answer groundedness, multi-attempt strict regenerations, and fallback rates.
            </p>
          </div>

          {isLoading || !data ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading analytics data...
            </div>
          ) : (
            <>
              {/* 4 Summary Stat Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Total Questions Asked */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Total Questions Asked
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
                    {data.overview.totalQuestions.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#38bdf8', marginTop: '4px' }}>
                    All student & faculty sessions
                  </div>
                </div>

                {/* Successful Answers */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Verified Answers
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>
                    {data.overview.acceptanceRate}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px' }}>
                    {data.overview.acceptedAnswers} questions grounded
                  </div>
                </div>

                {/* Hallucinations Mitigated */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Hallucinations Caught
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fbbf24' }}>
                    {data.overview.hallucinationsMitigated}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px' }}>
                    Filtered prior to student delivery
                  </div>
                </div>

                {/* Regeneration Attempts */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Adaptive Regenerations
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#a78bfa' }}>
                    {data.overview.adaptiveRegenerations}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px' }}>
                    Stricter prompt auto-healing
                  </div>
                </div>
              </div>

              {/* 5 Evaluator Criteria Breakdown */}
              <div
                style={{
                  backgroundColor: '#111726',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '20px 24px',
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  AI Evaluator Criteria Pass Rates (5 Backend Checkpoints)
                </h3>
                <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  Each response generated by Gemini is evaluated against all five criteria before final acceptance.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.evaluatorBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#0d121f',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 size={16} style={{ color: '#34d399' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc' }}>
                            {item.criterion}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38bdf8' }}>
                          {item.passRate}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Verification Events */}
              <div
                style={{
                  backgroundColor: '#111726',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '20px 24px',
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
                  Recent Adaptive Event Logs
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.recentEvents.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#0d121f',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 500 }}>
                          "{ev.query}"
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                          Resolved on Attempt #{ev.attempt} • {ev.time}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            ev.status === 'REGENERATED_PASS'
                              ? 'rgba(56, 189, 248, 0.12)'
                              : ev.status === 'ACCEPTED_ATTEMPT_1'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                          color:
                            ev.status === 'REGENERATED_PASS'
                              ? '#38bdf8'
                              : ev.status === 'ACCEPTED_ATTEMPT_1'
                              ? '#34d399'
                              : '#f87171',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          flexShrink: 0,
                        }}
                      >
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
