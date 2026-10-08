import React from 'react';
import { Menu, Trash2, Settings, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ChatHeader({ onToggleSidebar, onClearChat, messageCount = 0, isBackendOnline = false }) {
  const navigate = useNavigate();
  const { role, isAdmin } = useAuth();

  return (
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
        zIndex: 10,
      }}
    >
      {/* Left Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
          }}
          className="mobile-hamburger"
        >
          <Menu size={20} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#f8fafc',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              College Assistant
            </h1>
            <span
              style={{
                fontSize: '0.675rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: isBackendOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                color: isBackendOnline ? '#34d399' : '#38bdf8',
                border: isBackendOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.25)',
                fontWeight: 500,
              }}
            >
              {isBackendOnline ? 'FastAPI Online' : 'Adaptive RAG'}
            </span>

            <span
              style={{
                fontSize: '0.675rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: isAdmin ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                color: isAdmin ? '#c4b5fd' : '#93c5fd',
                border: isAdmin ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.25)',
                fontWeight: 600,
              }}
            >
              {role}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              AI-powered • Document grounded
            </span>
          </div>
        </div>
      </div>

      {/* Right Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {messageCount > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            title="Clear current chat conversation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: '#94a3b8',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = '#1e293b';
            }}
          >
            <Trash2 size={13} />
            <span className="hidden-sm">Clear chat</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/settings')}
          title="Open Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid #1e293b',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
