import React, { useState } from 'react';
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
} from 'lucide-react';
import UploadModal from '../components/UploadModal';

export default function AdminDashboard({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Mock dashboard metric values for presentation & engineering demonstration
  const stats = [
    {
      title: 'Total Documents',
      value: '12',
      change: '5 Active Handbooks',
      icon: FileText,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'Indexed Documents',
      value: '10',
      change: '100% ChromaDB Grounded',
      icon: CheckCircle2,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Processing Documents',
      value: '2',
      change: 'Chunking & Embedding',
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Total Users',
      value: '245',
      change: 'Students & Faculty',
      icon: Users,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
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
              Admin Dashboard
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
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
          {/* Welcome Banner */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '4px',
                  fontSize: '0.725rem',
                  color: '#c4b5fd',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                ADMIN ACCESS
              </div>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  marginBottom: '6px',
                  letterSpacing: '-0.02em',
                }}
              >
                Institutional Document & System Overview
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                Manage college regulations, oversee student query traffic, and audit AI response verification.
              </p>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
            }}
          >
            {stats.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>
                      {item.title}
                    </span>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      {item.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Management Actions Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Action 1: Documents Management */}
            <div
              style={{
                backgroundColor: '#111726',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onClick={() => navigate('/documents')}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: '#3b82f6' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    Manage Documents
                  </h3>
                </div>
                <ArrowRight size={16} style={{ color: '#64748b' }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Upload new handbooks, replace outdated ordinances, or delete removed regulations with vector un-indexing.
              </p>
            </div>

            {/* Action 2: User Access & RBAC */}
            <div
              style={{
                backgroundColor: '#111726',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onClick={() => navigate('/admin/users')}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    User Roles (RBAC)
                  </h3>
                </div>
                <ArrowRight size={16} style={{ color: '#64748b' }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                View registered students and faculty administrators. Audit role-based access permissions.
              </p>
            </div>

            {/* Action 3: Analytics & Hallucination Metrics */}
            <div
              style={{
                backgroundColor: '#111726',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onClick={() => navigate('/admin/analytics')}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} style={{ color: '#10b981' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    Adaptive RAG Analytics
                  </h3>
                </div>
                <ArrowRight size={16} style={{ color: '#64748b' }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Examine verification pass rates across the 5 evaluation criteria and adaptive regeneration cycles.
              </p>
            </div>
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => {}}
      />
    </div>
  );
}
