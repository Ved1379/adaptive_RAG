import React from 'react';
import { Sparkles } from 'lucide-react';

export default function LoadingMessage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '20px',
        width: '100%',
        maxWidth: '85%',
      }}
    >
      {/* AI Avatar */}
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#38bdf8',
          marginTop: '2px',
        }}
      >
        <Sparkles size={17} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '4px',
            fontWeight: 600,
          }}
        >
          College Assistant
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '4px 16px 16px 16px',
            backgroundColor: '#131a29',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#94a3b8',
            fontSize: '0.875rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          }}
        >
          <span style={{ fontWeight: 500, color: '#cbd5e1' }}>Thinking</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                display: 'inline-block',
                animation: 'bounce 1.2s infinite ease-in-out',
                animationDelay: '0ms',
              }}
            />
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                display: 'inline-block',
                animation: 'bounce 1.2s infinite ease-in-out',
                animationDelay: '200ms',
              }}
            />
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                display: 'inline-block',
                animation: 'bounce 1.2s infinite ease-in-out',
                animationDelay: '400ms',
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>
            Retrieving documents & evaluating response...
          </span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
