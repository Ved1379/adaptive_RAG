import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  User,
  Calendar,
  Layers,
  Menu,
  ShieldCheck,
  X,
  RotateCcw
} from 'lucide-react';
import {
  getAdminRequests,
  approveDocument,
  rejectDocument,
  retryIngestion,
  previewDocument
} from '../services/api';

export default function PendingApprovals({ onToggleSidebar }) {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Rejection Modal
  const [rejectModalDoc, setRejectModalDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Preview Modal
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const fetchRequests = async (filter = statusFilter) => {
    setIsLoading(true);
    const res = await getAdminRequests(filter === 'ALL' ? '' : filter);
    if (res.success && res.data) {
      setRequests(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (docId) => {
    setActionLoadingId(docId);
    const res = await approveDocument(docId);
    setActionLoadingId(null);
    if (res.success) {
      fetchRequests(statusFilter);
    } else {
      alert(res.error || 'Approval failed.');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalDoc) return;
    setActionLoadingId(rejectModalDoc.id);
    const res = await rejectDocument(rejectModalDoc.id, rejectReason);
    setActionLoadingId(null);
    setRejectModalDoc(null);
    setRejectReason('');
    if (res.success) {
      fetchRequests(statusFilter);
    } else {
      alert(res.error || 'Rejection failed.');
    }
  };

  const handleRetry = async (docId) => {
    setActionLoadingId(docId);
    const res = await retryIngestion(docId);
    setActionLoadingId(null);
    if (res.success) {
      fetchRequests(statusFilter);
    } else {
      alert(res.error || 'Retry failed.');
    }
  };

  const handleOpenPreview = async (docId) => {
    setIsPreviewLoading(true);
    const res = await previewDocument(docId);
    setIsPreviewLoading(false);
    if (res.success && res.data) {
      setPreviewData(res.data);
    } else {
      alert(res.error || 'Failed to load preview.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.725rem',
              fontWeight: 600,
            }}
          >
            <Clock size={12} />
            <span>Pending Review</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.725rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={12} />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.725rem',
              fontWeight: 600,
            }}
          >
            <XCircle size={12} />
            <span>Rejected</span>
          </span>
        );
      case 'INGESTION_FAILED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.725rem',
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={12} />
            <span>Ingestion Failed</span>
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              fontSize: '0.725rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={12} className="animate-spin" />
            <span>Processing</span>
          </span>
        );
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
            <Clock size={18} style={{ color: '#f59e0b' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Document Approval Queue
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests(statusFilter)}
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
      </header>

      {/* Main Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { id: 'PENDING', label: 'Pending Review' },
              { id: 'INGESTION_FAILED', label: 'Failed Ingestions' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'ALL', label: 'All Submissions' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: statusFilter === tab.id ? '1px solid #3b82f6' : '1px solid #1e293b',
                  backgroundColor: statusFilter === tab.id ? 'rgba(59, 130, 246, 0.15)' : '#0d121f',
                  color: statusFilter === tab.id ? '#60a5fa' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Requests Table */}
          <div
            style={{
              backgroundColor: '#0d121f',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#111726', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Document</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Requester</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Submitted</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      {isLoading ? 'Loading submissions...' : `No ${statusFilter.toLowerCase()} submissions found.`}
                    </td>
                  </tr>
                ) : (
                  requests.map((doc) => {
                    const isBusy = actionLoadingId === doc.id;
                    return (
                      <tr
                        key={doc.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          color: '#cbd5e1',
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#60a5fa',
                              }}
                            >
                              <FileText size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{doc.filename}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {doc.page_count} pages • {(doc.file_size / 1024).toFixed(0)} KB
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} style={{ color: '#64748b' }} />
                            <div>
                              <div style={{ fontWeight: 500 }}>{doc.uploader_name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.uploader_email}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{doc.department}</td>

                        <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div>{getStatusBadge(doc.status)}</div>
                          {doc.rejection_reason && (
                            <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                              Reason: {doc.rejection_reason}
                            </div>
                          )}
                          {doc.error_message && (
                            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                              Error: {doc.error_message}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(doc.id)}
                              title="Preview Document Content"
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#111726',
                                border: '1px solid #1e293b',
                                borderRadius: '6px',
                                color: '#94a3b8',
                                fontSize: '0.785rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>

                            {doc.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(doc.id)}
                                  disabled={isBusy}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#10b981',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize: '0.785rem',
                                    fontWeight: 600,
                                    cursor: isBusy ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>{isBusy ? 'Indexing...' : 'Approve'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setRejectModalDoc(doc)}
                                  disabled={isBusy}
                                  style={{
                                    padding: '6px 10px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '6px',
                                    color: '#f87171',
                                    fontSize: '0.785rem',
                                    cursor: isBusy ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <XCircle size={13} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {doc.status === 'INGESTION_FAILED' && (
                              <button
                                type="button"
                                onClick={() => handleRetry(doc.id)}
                                disabled={isBusy}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#f59e0b',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#ffffff',
                                  fontSize: '0.785rem',
                                  fontWeight: 600,
                                  cursor: isBusy ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <RotateCcw size={13} />
                                <span>{isBusy ? 'Retrying...' : 'Retry Ingestion'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModalDoc && (
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
              maxWidth: '460px',
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                Reject Submission
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: '0 0 16px' }}>
              Please specify why <strong>{rejectModalDoc.filename}</strong> is being rejected. The requester will be able to review this reason.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete policy document or missing syllabus section."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0d121f',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '20px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Content Preview Modal */}
      {previewData && (
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
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
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
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  Document Preview: {previewData.document?.filename}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Total Pages: {previewData.total_pages} • Previewing first 5 pages
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {previewData.preview_pages?.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>
                  No text could be extracted from this PDF.
                </div>
              ) : (
                previewData.preview_pages.map((p) => (
                  <div
                    key={p.page_number}
                    style={{
                      padding: '14px',
                      backgroundColor: '#0d121f',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                      Page {p.page_number}
                    </div>
                    <p style={{ fontSize: '0.825rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
                      {p.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
