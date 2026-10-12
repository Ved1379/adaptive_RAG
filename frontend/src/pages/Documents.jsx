import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Upload,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  Menu,
  Trash2,
  RefreshCw,
  Eye,
  Lock,
  XCircle,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { getDocuments, getMySubmissions, deleteDocument } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UploadModal from '../components/UploadModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Documents({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { isAdmin, isStudent, user } = useAuth();

  const [activeTab, setActiveTab] = useState('knowledge_base'); // 'knowledge_base' or 'my_submissions'
  const [documents, setDocuments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchActiveDocuments = async (query = '') => {
    setIsLoading(true);
    const result = await getDocuments(query);
    if (result.success && result.data) {
      setDocuments(result.data);
    }
    setIsLoading(false);
  };

  const fetchUserSubmissions = async () => {
    setIsLoading(true);
    const result = await getMySubmissions();
    if (result.success && result.data) {
      setMySubmissions(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'knowledge_base') {
      fetchActiveDocuments(searchQuery);
    } else {
      fetchUserSubmissions();
    }
  }, [activeTab, searchQuery]);

  const handleDocumentUploaded = (newDoc) => {
    if (activeTab === 'my_submissions') {
      setMySubmissions((prev) => [newDoc, ...prev]);
    } else {
      fetchActiveDocuments(searchQuery);
    }
  };

  const handleDeleteConfirm = async (docId) => {
    setIsDeleting(true);
    const res = await deleteDocument(docId);
    setIsDeleting(false);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setDeleteTargetDoc(null);
    } else {
      alert(res.error || 'Failed to delete document.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'Indexed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.725rem',
              fontWeight: 500,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <CheckCircle2 size={12} />
            <span>Active in RAG</span>
          </span>
        );
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.725rem',
              fontWeight: 500,
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <Clock size={12} />
            <span>Pending Review</span>
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
              fontSize: '0.725rem',
              fontWeight: 500,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
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
              fontSize: '0.725rem',
              fontWeight: 500,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
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
              fontSize: '0.725rem',
              fontWeight: 500,
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <RefreshCw size={12} className="animate-spin" />
            <span>Processing</span>
          </span>
        );
    }
  };

  const displayedList = activeTab === 'knowledge_base' ? documents : mySubmissions;

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
            <FileText size={18} style={{ color: '#38bdf8' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Knowledge Base Documents
            </h1>
          </div>
        </div>

        {/* Upload / Submit Document Button */}
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '0.825rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Upload size={14} />
          <span>{isAdmin ? 'Upload Document' : 'Submit for Review'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Tabs for Students */}
          {!isAdmin && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('knowledge_base')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: activeTab === 'knowledge_base' ? '1px solid #3b82f6' : '1px solid #1e293b',
                  backgroundColor: activeTab === 'knowledge_base' ? 'rgba(59, 130, 246, 0.15)' : '#0d121f',
                  color: activeTab === 'knowledge_base' ? '#60a5fa' : '#94a3b8',
                }}
              >
                Active Knowledge Base
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my_submissions')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: activeTab === 'my_submissions' ? '1px solid #3b82f6' : '1px solid #1e293b',
                  backgroundColor: activeTab === 'my_submissions' ? 'rgba(59, 130, 246, 0.15)' : '#0d121f',
                  color: activeTab === 'my_submissions' ? '#60a5fa' : '#94a3b8',
                }}
              >
                My Submissions & Status
              </button>
            </div>
          )}

          {/* Search bar */}
          {activeTab === 'knowledge_base' && (
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by filename or department..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  backgroundColor: '#0d121f',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Documents Table */}
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
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Chunks / Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      {isLoading
                        ? 'Loading documents...'
                        : activeTab === 'my_submissions'
                        ? 'You have not submitted any documents for review yet.'
                        : 'No documents found matching your search.'}
                    </td>
                  </tr>
                ) : (
                  displayedList.map((doc) => (
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

                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{doc.department}</td>

                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div>{getStatusBadge(doc.status)}</div>
                        {doc.status === 'APPROVED' && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                            {doc.chunk_count} ChromaDB chunks
                          </div>
                        )}
                        {doc.rejection_reason && (
                          <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                            Reason: {doc.rejection_reason}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {doc.status === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/documents/${doc.id}`)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#111726',
                                border: '1px solid #1e293b',
                                borderRadius: '6px',
                                color: '#38bdf8',
                                fontSize: '0.785rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={13} />
                              <span>View Chunks</span>
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetDoc(doc)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '6px',
                                color: '#f87171',
                                fontSize: '0.785rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload/Submit Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={handleDocumentUploaded}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetDoc)}
        onClose={() => setDeleteTargetDoc(null)}
        onConfirm={() => deleteTargetDoc && handleDeleteConfirm(deleteTargetDoc.id)}
        isDeleting={isDeleting}
        documentName={deleteTargetDoc?.filename || ''}
      />
    </div>
  );
}
