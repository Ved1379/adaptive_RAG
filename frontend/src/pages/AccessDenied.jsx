import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, MessageSquare, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { role, toggleRole } = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: '#090d16',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#111726',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          padding: '36px 30px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <Lock size={26} />
        </div>

        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#f8fafc',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          Access Denied
        </h2>

        <p
          style={{
            fontSize: '0.9rem',
            color: '#94a3b8',
            lineHeight: '1.5',
            marginBottom: '24px',
          }}
        >
          You don't have permission to access this area. College document administration, user management, and system analytics are restricted to authorized administrators.
        </p>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#0d121f',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.785rem',
            color: '#64748b',
          }}
        >
          Current Active Role: <strong style={{ color: '#93c5fd' }}>{role}</strong>
          <div style={{ marginTop: '4px', fontSize: '0.725rem' }}>
            (Frontend RBAC preview. Switch to ADMIN in sidebar to test administrative privileges.)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.875rem' }}
          >
            <MessageSquare size={15} />
            <span>Return to Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
