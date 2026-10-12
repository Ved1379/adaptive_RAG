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
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  TrendingUp,
  XCircle,
  SlidersHorizontal
} from 'lucide-react';
import { getAnalytics } from '../services/api';

export default function Analytics({ onToggleSidebar }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const res = await getAnalytics();
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const ha = data?.hallucination_analytics || {
    total_evaluated_answers: 0,
    flagged_count: 0,
    flagged_percentage: 0,
    correction_success_rate: 100,
    faithfulness_score: 0,
    groundedness_score: 0,
    relevance_score: 0,
    completeness_score: 0,
    factual_consistency_score: 0,
    initial_pass_rate: 0,
    final_pass_rate: 0,
    abstained_percentage: 0,
  };

  const overview = data?.overview || {
    total_chatbot_queries: 0,
    average_latency_ms: 0,
    average_regeneration_attempts: 0,
    abstained_count: 0,
    corrected_count: 0,
  };

  const timeline = data?.timeline || [];

  const criteriaCards = [
    { label: 'Faithfulness', score: ha.faithfulness_score, desc: 'Supported directly by retrieved context' },
    { label: 'Groundedness', score: ha.groundedness_score, desc: 'No unverified external knowledge used' },
    { label: 'Relevance', score: ha.relevance_score, desc: 'Directly addresses user question' },
    { label: 'Completeness', score: ha.completeness_score, desc: 'Key available context included' },
    { label: 'Factual Consistency', score: ha.factual_consistency_score, desc: 'Zero contradictions with evidence' },
  ];

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
      {/* Top Header */}
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
              Hallucination Detection & Reduction Analytics
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#111726',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            color: '#94a3b8',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Research Clarification Notice */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <HelpCircle size={20} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
              <strong>Research Note:</strong> Metrics below reflect AI-based evaluator scores and bounded regeneration outcomes against retrieved knowledge base chunks. Scores are calculated live from stored query logs in SQLite.
            </p>
          </div>

          {/* Primary Research Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div
              style={{
                padding: '20px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                Evaluated RAG Queries
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                {ha.total_evaluated_answers}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {overview.total_chatbot_queries} total system conversations
              </div>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                Flagged for Hallucination
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                {ha.flagged_percentage}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {ha.flagged_count} answers failed initial check
              </div>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                Regeneration Correction Rate
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>
                {ha.correction_success_rate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {overview.corrected_count} answers successfully corrected
              </div>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                Abstention Rate
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                {ha.abstained_percentage}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {overview.abstained_count} abstained due to insufficient evidence
              </div>
            </div>
          </div>

          {/* Initial vs Final Comparison */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '12px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
              Adaptive Framework Impact: Initial Generation vs. Final Verification Pass Rate
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Initial Single-Shot Pass Rate:</span>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{ha.initial_pass_rate}%</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${ha.initial_pass_rate}%`,
                      height: '100%',
                      backgroundColor: '#64748b',
                      borderRadius: '5px',
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  Raw answer quality without critique feedback loops
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Final Adaptive Pass Rate (Post-Regeneration):</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>{ha.final_pass_rate}%</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${ha.final_pass_rate}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      borderRadius: '5px',
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '6px' }}>
                  Gain achieved through adaptive hallucination feedback & bounded regeneration
                </p>
              </div>
            </div>
          </div>

          {/* 5-Criteria Quality Breakdown */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '12px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
              Evaluation Dimensions Breakdown
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {criteriaCards.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                    {c.score}%
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: `${c.score}%`,
                        height: '100%',
                        backgroundColor: '#38bdf8',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Activity Trends */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '12px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
              Daily Query & Evaluation Pass Trend (7 Days)
            </h3>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', paddingBottom: '10px' }}>
              {timeline.map((day, idx) => {
                const maxQueries = Math.max(1, ...timeline.map((t) => t.queries));
                const heightPct = Math.max(15, Math.round((day.queries / maxQueries) * 100));

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>
                      {day.queries}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '40px',
                        height: `${heightPct}%`,
                        backgroundColor: day.queries > 0 ? '#3b82f6' : '#1e293b',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '6px' }}>
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
