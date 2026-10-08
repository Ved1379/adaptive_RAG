import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

/**
 * Enhanced Verification Badge supporting ALL FIVE backend evaluation criteria:
 * 1. Faithfulness
 * 2. Relevance
 * 3. Groundedness
 * 4. Completeness
 * 5. Factual Consistency
 */

const CRITERIA_DEFINITIONS = {
  faithfulness: 'Contains only information supported by the context without hallucinations',
  relevance: 'Directly addresses the user question without topical drift',
  groundedness: 'Every claim is strictly grounded in the retrieved college document chunks',
  completeness: 'Provides complete answers based on available institutional context',
  factual_consistency: 'Dates, numbers, regulations, and institutional facts match context exactly',
};

export default function EvaluationBadge({ label, status = 'PASS', detail }) {
  const isPass = status === 'PASS';
  const key = label.toLowerCase().replace(/\s+/g, '_');
  const tooltip = detail || CRITERIA_DEFINITIONS[key] || `${label}: ${status}`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
        isPass
          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
          : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
      }`}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 9px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: isPass ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: isPass ? '#34d399' : '#f87171',
        border: `1px solid ${isPass ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
      }}
    >
      {isPass ? (
        <CheckCircle2 size={13} strokeWidth={2.5} style={{ color: '#34d399' }} />
      ) : (
        <XCircle size={13} strokeWidth={2.5} style={{ color: '#f87171' }} />
      )}
      <span>{label}</span>
      <span style={{ opacity: 0.85, fontSize: '0.7rem', fontWeight: 600 }}>{status}</span>
    </div>
  );
}
