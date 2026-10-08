import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function SuggestionCard({ text, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: '#131a29',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        color: '#e2e8f0',
        minHeight: '94px',
        position: 'relative',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#182236';
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.45)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#131a29';
        e.currentTarget.style.borderColor = '#1e293b';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
          }}
        >
          {Icon && <Icon size={16} />}
        </div>
        <ArrowUpRight size={15} style={{ color: '#64748b' }} />
      </div>

      <span
        style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: '#f1f5f9',
          lineHeight: '1.4',
        }}
      >
        "{text}"
      </span>
    </button>
  );
}
