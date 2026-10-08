import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState('Academic Affairs');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF document to upload.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', department);
    formData.append('academic_year', academicYear);

    const result = await uploadDocument(formData);

    setIsSubmitting(false);
    if (result.success) {
      setSuccess('Document uploaded successfully and queued for chunking & indexing.');
      setTimeout(() => {
        onUploaded && onUploaded({
          id: `doc-${Date.now()}`,
          filename: file.name,
          department,
          academicYear,
          uploadedDate: new Date().toISOString().split('T')[0],
          status: 'Processing',
          chunkCount: 0,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        });
        setFile(null);
        setSuccess(null);
        onClose();
      }, 1200);
    } else {
      setError(result.error || 'Failed to upload document.');
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
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#111726',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Upload College Document
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Add regulations, curriculum, or notices for RAG indexing
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Modal Form */}
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

          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                color: '#34d399',
                fontSize: '0.8125rem',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* File Upload Drop Area */}
          <div
            style={{
              border: '2px dashed #243048',
              borderRadius: '10px',
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: '#0d121f',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'border-color 0.15s ease',
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf,.txt,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto',
              }}
            >
              <UploadCloud size={22} />
            </div>

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#93c5fd' }}>
                <FileText size={16} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{file.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', margin: '0 0 4px 0' }}>
                  Click to choose file or drag & drop here
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Supports PDF (e.g. academic ordinances, syllabus guides)
                </p>
              </>
            )}
          </div>

          {/* Department Selection */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Department / Office
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0d121f',
                border: '1px solid #243048',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            >
              <option value="Academic Affairs">Academic Affairs</option>
              <option value="Examination Cell">Examination Cell</option>
              <option value="Computer & IT Engineering">Computer & IT Engineering</option>
              <option value="Student Affairs">Student Affairs</option>
              <option value="Research & Capstone">Research & Capstone</option>
            </select>
          </div>

          {/* Academic Year Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Academic Year
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2024-2025"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0d121f',
                border: '1px solid #243048',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
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
              {isSubmitting ? 'Uploading...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
