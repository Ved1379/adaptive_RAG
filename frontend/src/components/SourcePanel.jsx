import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ShieldCheck, Lock, Eye } from 'lucide-react';
import EvaluationBadge from './EvaluationBadge';
import { useAuth } from '../context/AuthContext';

export default function SourcePanel({ sources = [], evaluation = null, regenerated = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAdmin, isStudent } = useAuth();

  const hasSources = sources && sources.length > 0;
  const hasEvaluation = evaluation && typeof evaluation === 'object';

  if (!hasSources && !hasEvaluation) {
    return null;
  }

  // Count passes across all 5 criteria
  const criteriaKeys = [
    { key: 'faithfulness', label: 'Faithfulness' },
    { key: 'relevance', label: 'Relevance' },
    { key: 'groundedness', label: 'Groundedness' },
    { key: 'completeness', label: 'Completeness' },
    { key: 'factual_consistency', label: 'Factual Consistency' },
  ];

  const presentCriteria = criteriaKeys.filter((c) => evaluation && evaluation[c.key]);

  return (
    <div
      style={{
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        fontSize: '0.8125rem',
      }}
    >
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '6px 8px',
          borderRadius: '6px',
          color: '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.color = '#e2e8f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={15} style={{ color: '#38bdf8' }} />
          <span style={{ fontWeight: 500 }}>Sources & Verification</span>
          {hasSources && (
            <span
              style={{
                fontSize: '0.72rem',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                padding: '1px 6px',
                borderRadius: '9999px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              {sources.length} {sources.length === 1 ? 'source' : 'sources'}
            </span>
          )}
          {presentCriteria.length > 0 && (
            <span
              style={{
                fontSize: '0.675rem',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                padding: '1px 6px',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontWeight: 500,
              }}
            >
              {presentCriteria.length}/5 Verified
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expandable Details Body */}
      {isExpanded && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: 'rgba(10, 15, 25, 0.6)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Five Evaluation Criteria Section */}
          {presentCriteria.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.725rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  marginBottom: '8px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>AI Verification Evaluation (5 Criteria)</span>
                <span style={{ fontSize: '0.675rem', color: '#94a3b8', textTransform: 'none' }}>
                  Hallucination Detection & Mitigation
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {presentCriteria.map((c) => (
                  <EvaluationBadge
                    key={c.key}
                    label={c.label}
                    status={evaluation[c.key]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sources Section - Role-Aware Privacy */}
          {hasSources && (
            <div>
              <div
                style={{
                  fontSize: '0.725rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  marginBottom: '8px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Grounded Institutional Sources</span>
                {isAdmin ? (
                  <span
                    style={{
                      fontSize: '0.675rem',
                      color: '#a78bfa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textTransform: 'none',
                    }}
                  >
                    <Eye size={11} /> Admin Chunk View
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.675rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textTransform: 'none',
                    }}
                  >
                    <Lock size={11} /> Verified Institutional Reference
                  </span>
                )}
              </div>

              {isStudent && (
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    borderRadius: '6px',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    fontSize: '0.75rem',
                    color: '#93c5fd',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldCheck size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <span>Verified against official college documents. Raw repository text is restricted to administrators.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sources.map((src, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <FileText size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                        <span
                          style={{
                            fontWeight: 500,
                            color: '#e2e8f0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {src.document || src.filename || 'Official College Document'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {src.page && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#94a3b8',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Page {src.page}
                          </span>
                        )}
                        {isAdmin && src.chunk_index !== undefined && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#c4b5fd',
                              backgroundColor: 'rgba(139, 92, 246, 0.12)',
                              border: '1px solid rgba(139, 92, 246, 0.25)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Chunk #{src.chunk_index}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ADMIN ONLY: show raw retrieved chunk content */}
                    {isAdmin && src.text && (
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#cbd5e1',
                          lineHeight: '1.4',
                          margin: 0,
                          fontStyle: 'italic',
                          borderLeft: '2px solid rgba(139, 92, 246, 0.5)',
                          paddingLeft: '8px',
                          marginTop: '6px',
                        }}
                      >
                        "{src.text}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
