import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Upload,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Menu,
  AlertTriangle,
  XCircle,
  Cpu,
  Layers,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { getAnalytics } from '../services/api';
import UploadModal from '../components/UploadModal';

export default function AdminDashboard({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    const res = await getAnalytics();
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const overview = data?.overview || {
    total_users: 0,
    total_submissions: 0,
    pending_requests: 0,
    approved_documents: 0,
    rejected_submissions: 0,
    failed_ingestion_jobs: 0,
    active_knowledge_base_documents: 0,
    total_indexed_chunks: 0,
    total_chatbot_queries: 0,
    successful_responses: 0,
    flagged_responses: 0,
    average_latency_ms: 0,
    average_regeneration_attempts: 0,
  };

  const primaryCards = [
    {
      title: 'Active Documents',
      value: overview.approved_documents,
      subtitle: `${overview.total_indexed_chunks} indexed ChromaDB chunks`,
      icon: CheckCircle2,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      link: '/documents',
    },
    {
      title: 'Pending Approvals',
      value: overview.pending_requests,
      subtitle: `${overview.total_submissions} total submissions`,
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      link: '/admin/approvals',
    },
    {
      title: 'Failed Ingestions',
      value: overview.failed_ingestion_jobs,
      subtitle: 'Jobs requiring admin retry',
      icon: AlertTriangle,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      link: '/admin/approvals',
    },
    {
      title: 'Total Queries',
      value: overview.total_chatbot_queries,
      subtitle: `${overview.flagged_responses} flagged by AI evaluator`,
      icon: Zap,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      link: '/admin/analytics',
    },
  ];

  const secondaryMetrics = [
    { label: 'Registered Users', val: overview.total_users, icon: Users, color: '#38bdf8' },
    { label: 'Rejected Submissions', val: overview.rejected_submissions, icon: XCircle, color: '#f87171' },
    { label: 'Successful Answers', val: overview.successful_responses, icon: ShieldCheck, color: '#34d399' },
    { label: 'Avg Latency', val: `${overview.average_latency_ms} ms`, icon: Clock, color: '#a78bfa' },
    { label: 'Avg Regenerations', val: overview.average_regeneration_attempts, icon: RefreshCw, color: '#fbbf24' },
    { label: 'Abstained Cases', val: overview.abstained_count || 0, icon: AlertTriangle, color: '#cbd5e1' },
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
            <LayoutDashboard size={18} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Administration & Governance Console
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchStats}
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
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Welcome Banner */}
          <div
            style={{
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(13, 18, 31, 0.9) 0%, rgba(30, 41, 59, 0.4) 100%)',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
                Adaptive RAG Governance & Oversight
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, maxWidth: '650px' }}>
                All document approvals, vector database indexing, AI response evaluations, and bounded regenerations are governed server-side and recorded persistently.
              </p>
            </div>
            {overview.pending_requests > 0 && (
              <button
                type="button"
                onClick={() => navigate('/admin/approvals')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#f59e0b',
                  color: '#090d16',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Review {overview.pending_requests} Pending</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          {/* Primary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {primaryCards.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(c.link)}
                  style={{
                    backgroundColor: '#0d121f',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = c.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1e293b';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 500, color: '#94a3b8' }}>{c.title}</span>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: c.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: c.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                    {isLoading ? '—' : c.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.subtitle}</div>
                </div>
              );
            })}
          </div>

          {/* Secondary Real Metric Counters */}
          <div
            style={{
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
              System Health & Operational Metrics (SQLite Live)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {secondaryMetrics.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#111726',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ color: m.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{m.label}</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                        {isLoading ? '—' : m.val}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div
              onClick={() => navigate('/admin/approvals')}
              style={{
                padding: '20px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#f59e0b' }}>
                <Clock size={20} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                  Document Approval Queue
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 14px' }}>
                Review pending submissions, inspect extracted text, approve or provide rejection feedback.
              </p>
              <span style={{ fontSize: '0.775rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Open Approval Queue <ArrowRight size={13} />
              </span>
            </div>

            <div
              onClick={() => navigate('/admin/analytics')}
              style={{
                padding: '20px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#10b981' }}>
                <BarChart3 size={20} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                  Hallucination Analytics
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 14px' }}>
                Examine faithfulness, groundedness, relevance, initial vs final scores, and bounded regeneration gains.
              </p>
              <span style={{ fontSize: '0.775rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Research Analytics <ArrowRight size={13} />
              </span>
            </div>

            <div
              onClick={() => navigate('/admin/audit-logs')}
              style={{
                padding: '20px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#8b5cf6' }}>
                <ShieldAlert size={20} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                  Audit & Security Logs
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 14px' }}>
                View immutable chronological audit trail of document approvals, rejections, and deletions.
              </p>
              <span style={{ fontSize: '0.775rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Review Audit Trail <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={fetchStats}
      />
    </div>
  );
}
