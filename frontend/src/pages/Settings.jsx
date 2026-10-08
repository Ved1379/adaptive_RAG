import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Trash2,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Menu,
  Shield,
  RefreshCw,
  User,
} from 'lucide-react';
import { API_BASE_URL, checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings({ onToggleSidebar, onClearAllHistory, sessionCount = 0 }) {
  const { role, user, setRole, isAdmin } = useAuth();
  const [healthStatus, setHealthStatus] = useState({ checking: true, isOnline: false });
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  const testConnection = async () => {
    setHealthStatus({ checking: true, isOnline: false });
    const res = await checkHealth();
    setHealthStatus({ checking: false, isOnline: res.isOnline, error: res.error });
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all saved conversations and chat history?')) {
      onClearAllHistory();
      setShowClearSuccess(true);
      setTimeout(() => setShowClearSuccess(false), 3000);
    }
  };

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
            <SettingsIcon size={18} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Settings Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 0: Role & Access Control (RBAC) */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                }}
              >
                <Shield size={16} style={{ color: isAdmin ? '#a78bfa' : '#38bdf8' }} />
                <span>Role-Based Access Control (RBAC)</span>
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                }}
              >
                Development Mode
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Switch active role to test student read-only restrictions vs administrator document controls
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: '#0d121f',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                  Current Active Role: <span style={{ color: isAdmin ? '#c4b5fd' : '#93c5fd' }}>{role}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  {isAdmin
                    ? 'Full access: Upload, Replace, Delete documents, Admin Dashboard, Users & Analytics'
                    : 'Restricted access: Chat and read-only college document browsing'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.785rem',
                    backgroundColor: role === 'STUDENT' ? '#1d4ed8' : 'rgba(255, 255, 255, 0.04)',
                    color: role === 'STUDENT' ? '#ffffff' : '#94a3b8',
                    borderColor: role === 'STUDENT' ? 'rgba(59, 130, 246, 0.5)' : '#1e293b',
                  }}
                >
                  <User size={13} />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.785rem',
                    backgroundColor: role === 'ADMIN' ? '#6d28d9' : 'rgba(255, 255, 255, 0.04)',
                    color: role === 'ADMIN' ? '#ffffff' : '#94a3b8',
                    borderColor: role === 'ADMIN' ? 'rgba(139, 92, 246, 0.5)' : '#1e293b',
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Appearance */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '20px 24px',
            }}
          >
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#f8fafc',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Moon size={16} style={{ color: '#38bdf8' }} />
              <span>Appearance</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Custom visual theme tuned for academic and engineering demonstrations
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#0d121f',
                borderRadius: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}>
                  Theme Mode
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Charcoal / Deep Navy palette with high-contrast slate typography
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Dark (Active)
              </div>
            </div>
          </div>

          {/* Section 2: Chat & Storage */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '20px 24px',
            }}
          >
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#f8fafc',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Trash2 size={16} style={{ color: '#f87171' }} />
              <span>Chat Management</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Manage session state and conversation memory
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#0d121f',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}>
                  Clear Chat History
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Resets active conversations ({sessionCount} session{sessionCount === 1 ? '' : 's'})
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearHistory}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8125rem',
                  padding: '6px 12px',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
              >
                Clear all history
              </button>
            </div>

            {showClearSuccess && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#34d399',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={14} />
                <span>All chat history cleared successfully.</span>
              </div>
            )}
          </div>

          {/* Section 3: API & FastAPI Backend Architecture */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                }}
              >
                <Server size={16} style={{ color: '#3b82f6' }} />
                <span>Backend Architecture</span>
              </h3>
              <button
                type="button"
                onClick={testConnection}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid #1e293b',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={11} className={healthStatus.checking ? 'animate-spin' : ''} />
                <span>Test Connection</span>
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Live RAG pipeline connected via <code style={{ color: '#93c5fd' }}>src/services/api.js</code> through Vite development proxy
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Endpoint Status Box */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0d121f',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}>
                    FastAPI Server Target
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                    http://127.0.0.1:8000 (Vite Proxy: /chat, /health)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {healthStatus.checking ? (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Checking...</span>
                  ) : healthStatus.isOnline ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: '#34d399',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      FastAPI Online (/health OK)
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: '#fbbf24',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      <AlertCircle size={13} />
                      FastAPI Offline (Not Responding)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: About Project */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#38bdf8' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Adaptive RAG College Assistant
              </h3>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#cbd5e1',
                lineHeight: '1.6',
                marginBottom: '16px',
              }}
            >
              "An AI-powered Retrieval-Augmented Generation system designed to answer college-related questions using institutional documents while detecting and reducing unsupported responses."
            </p>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.8125rem',
                color: '#93c5fd',
                lineHeight: '1.5',
              }}
            >
              <strong>Notice:</strong> This system incorporates strict multi-metric evaluation across 5 criteria (Faithfulness, Relevance, Groundedness, Completeness, Factual Consistency) and adaptive regeneration to systematically minimize unsupported answers. It is engineered to detect and reduce hallucinations, without making inaccurate claims of zero error.
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>Capstone Project: BE Engineering (Div B, Group 32)</div>
              <div>Stack: React 18, Vite, FastAPI, ChromaDB, Sentence Transformers, Google Gemini</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
