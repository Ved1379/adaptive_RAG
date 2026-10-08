import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, doc, onClose, onConfirm, isDeleting }) {
  if (!isOpen || !doc) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#111726',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Delete Document?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 12px 0' }}>
            This document will be removed from the document repository:
          </p>
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
              {doc.filename}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              {doc.department} • {doc.academicYear}
            </div>
          </div>
          <p style={{ fontSize: '0.785rem', color: '#94a3b8', margin: 0 }}>
            Note: This action will permanently delete all associated ChromaDB vector chunks and metadata once connected to FastAPI.
          </p>
        </div>

        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#0d121f',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(doc.id)}
            disabled={isDeleting}
            className="btn"
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
            }}
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
