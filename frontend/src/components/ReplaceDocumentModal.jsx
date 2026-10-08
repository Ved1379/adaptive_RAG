import React, { useState } from 'react';
import { RefreshCw, UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { replaceDocument } from '../services/api';

export default function ReplaceDocumentModal({ isOpen, doc, onClose, onReplaced }) {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !doc) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a replacement PDF file.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_id', doc.id);

    const res = await replaceDocument(doc.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      onReplaced({
        ...doc,
        filename: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'Processing',
      });
      setFile(null);
      onClose();
    } else {
      setError(res.error || 'Failed to replace document.');
    }
  };

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
          maxWidth: '480px',
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
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Replace Document
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Replacing this document will update the document used by the RAG system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
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

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.8125rem',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Document
            </div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.875rem', marginTop: '2px' }}>
              {doc.filename}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              Department: {doc.department} • Year: {doc.academicYear}
            </div>
          </div>

          {/* New file upload selector */}
          <div
            style={{
              border: '2px dashed #243048',
              borderRadius: '10px',
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: '#0d121f',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
            onClick={() => document.getElementById('replace-file-input').click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <input
              id="replace-file-input"
              type="file"
              accept=".pdf,.txt,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
              }}
            >
              <UploadCloud size={20} />
            </div>

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#c4b5fd' }}>
                <FileText size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{file.name}</span>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0', margin: '0 0 2px 0' }}>
                  Choose updated PDF file
                </p>
                <p style={{ fontSize: '0.725rem', color: '#64748b', margin: 0 }}>
                  Click to select new version of this document
                </p>
              </>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="btn btn-primary"
            >
              <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
              <span>{isSubmitting ? 'Replacing...' : 'Replace & Re-index'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
