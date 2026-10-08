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
} from 'lucide-react';
import { getDocuments, deleteDocument } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UploadModal from '../components/UploadModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ReplaceDocumentModal from '../components/ReplaceDocumentModal';

export default function Documents({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { isAdmin, isStudent } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state (Admin only)
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [replaceTargetDoc, setReplaceTargetDoc] = useState(null);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async (query = '') => {
    setIsLoading(true);
    const result = await getDocuments(query);
    if (result.success && result.data) {
      setDocuments(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDocuments(searchQuery);
  }, [searchQuery]);

  const handleDocumentUploaded = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDocumentReplaced = (updatedDoc) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
  };

  const handleDeleteConfirm = async (docId) => {
    setIsDeleting(true);
    const res = await deleteDocument(docId);
    setIsDeleting(false);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setDeleteTargetDoc(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
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
            <span>Indexed</span>
          </span>
        );
      case 'Processing':
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
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <Clock size={12} />
            <span>Processing</span>
          </span>
        );
      case 'Available':
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
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <Layers size={12} />
            <span>Available</span>
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
      {/* Top Bar */}
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
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              College Documents
            </h1>
          </div>
        </div>

        {/* ADMIN ONLY: Upload Document button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        )}

        {isStudent && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.725rem',
              color: '#94a3b8',
              padding: '4px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              border: '1px solid #1e293b',
            }}
          >
            <Lock size={12} style={{ color: '#64748b' }} />
            <span>Read-Only Access</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
          {/* Page Intro */}
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              College Documents
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
              {isStudent
                ? 'Official documents used by the AI assistant.'
                : 'Documents used by the AI assistant to answer college-related questions with administrative repository controls.'}
            </p>
          </div>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#111726',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '8px 14px',
              }}
            >
              <Search size={16} style={{ color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search documents by name, department, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Documents Table */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Table Header */}
            <div
              className="table-header-row"
              style={{
                display: 'grid',
                gridTemplateColumns: isAdmin
                  ? 'minmax(220px, 2fr) minmax(170px, 1.2fr) 110px 110px 100px 140px'
                  : 'minmax(250px, 2fr) minmax(180px, 1.3fr) 120px 120px 100px 60px',
                padding: '12px 18px',
                backgroundColor: '#0d121f',
                borderBottom: '1px solid #1e293b',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div>Document Name</div>
              <div>Department</div>
              <div>Academic Year</div>
              <div>Last Updated</div>
              <div>Status</div>
              <div style={{ textAlign: 'right' }}>{isAdmin ? 'Actions' : 'View'}</div>
            </div>

            {/* Table Rows */}
            {isLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                Loading verified documents...
              </div>
            ) : documents.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                <FileText size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
                <div style={{ fontSize: '0.925rem', color: '#e2e8f0', fontWeight: 500 }}>
                  No documents found
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Try a different search query.
                </div>
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="table-item-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isAdmin
                      ? 'minmax(220px, 2fr) minmax(170px, 1.2fr) 110px 110px 100px 140px'
                      : 'minmax(250px, 2fr) minmax(180px, 1.3fr) 120px 120px 100px 60px',
                    padding: '14px 18px',
                    borderBottom: idx === documents.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                    alignItems: 'center',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#161f33';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Name */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.filename}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                        {doc.chunkCount ? `${doc.chunkCount} chunks • ${doc.fileSize || 'PDF'}` : 'PDF Document'}
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.department}
                  </div>

                  {/* Academic Year */}
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {doc.academicYear || '2024-25'}
                  </div>

                  {/* Last Updated */}
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {doc.lastUpdated || doc.uploadedDate}
                  </div>

                  {/* Status */}
                  <div>{getStatusBadge(doc.status)}</div>

                  {/* Actions Area */}
                  <div style={{ textAlign: 'right' }}>
                    {isStudent ? (
                      /* STUDENT: Read-only View Action */
                      <button
                        type="button"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        title="View document metadata"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <ExternalLink size={14} />
                      </button>
                    ) : (
                      /* ADMIN: View, Replace, Delete Actions */
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          title="View document details"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid #1e293b',
                            borderRadius: '4px',
                            color: '#cbd5e1',
                            fontSize: '0.725rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReplaceTargetDoc(doc)}
                          title="Replace this document"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            borderRadius: '4px',
                            color: '#c4b5fd',
                            fontSize: '0.725rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <RefreshCw size={12} />
                          <span>Replace</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTargetDoc(doc)}
                          title="Delete this document"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '4px',
                            color: '#f87171',
                            fontSize: '0.725rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin Modals */}
      {isAdmin && (
        <>
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onUploaded={handleDocumentUploaded}
          />

          <ReplaceDocumentModal
            isOpen={!!replaceTargetDoc}
            doc={replaceTargetDoc}
            onClose={() => setReplaceTargetDoc(null)}
            onReplaced={handleDocumentReplaced}
          />

          <DeleteConfirmModal
            isOpen={!!deleteTargetDoc}
            doc={deleteTargetDoc}
            onClose={() => setDeleteTargetDoc(null)}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
          />
        </>
      )}

      <style>{`
        @media (max-width: 820px) {
          .table-header-row {
            display: none !important;
          }
          .table-item-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
