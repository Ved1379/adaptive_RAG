import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Building,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  MessageSquare,
  Database,
  Menu,
  Lock,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { getDocument, deleteDocument } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ReplaceDocumentModal from '../components/ReplaceDocumentModal';

export default function DocumentDetails({ onToggleSidebar, onAskDocument }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isStudent } = useAuth();

  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals for Admin
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getDocument(id).then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setDoc(res.data);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAskAboutDoc = () => {
    if (doc) {
      const prompt = `What are the key rules specified in ${doc.filename}?`;
      onAskDocument(prompt);
      navigate('/');
    }
  };

  const handleDelete = async (docId) => {
    setIsDeleting(true);
    const res = await deleteDocument(docId);
    setIsDeleting(false);
    if (res.success) {
      navigate('/documents');
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
      {/* Header Bar */}
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
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="btn btn-secondary"
            style={{
              padding: '5px 10px',
              fontSize: '0.8125rem',
              gap: '6px',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Documents</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {doc && (
            <button
              type="button"
              onClick={handleAskAboutDoc}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            >
              <MessageSquare size={14} />
              <span>Ask About Document</span>
            </button>
          )}

          {isAdmin && doc && (
            <>
              <button
                type="button"
                onClick={() => setIsReplaceOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                title="Replace Document"
              >
                <RefreshCw size={14} />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '6px 10px', color: '#f87171' }}
                title="Delete Document"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              Loading document metadata...
            </div>
          ) : !doc ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              Document not found.
            </div>
          ) : (
            <>
              {/* Document Title Banner */}
              <div
                style={{
                  backgroundColor: '#111726',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#f8fafc',
                        letterSpacing: '-0.01em',
                        marginBottom: '6px',
                      }}
                    >
                      {doc.filename}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      {doc.description || 'Institutional document indexed in ChromaDB vector repository for RAG context.'}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>{doc.status}</span>
                </div>
              </div>

              {/* Grid of Key Properties */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                {/* Department */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <Building size={14} />
                    <span>Department</span>
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f1f5f9' }}>
                    {doc.department}
                  </div>
                </div>

                {/* Academic Year */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <Calendar size={14} />
                    <span>Academic Year</span>
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f1f5f9' }}>
                    {doc.academicYear || '2024-2025'}
                  </div>
                </div>

                {/* Upload Date */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <Clock size={14} />
                    <span>Upload Date</span>
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f1f5f9' }}>
                    {doc.uploadedDate}
                  </div>
                </div>

                {/* Number of Chunks */}
                <div
                  style={{
                    backgroundColor: '#111726',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <Database size={14} />
                    <span>Indexed Chunks</span>
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 600, color: '#60a5fa' }}>
                    {doc.chunkCount || (doc.chunks ? doc.chunks.length : 12)} Chunks
                  </div>
                </div>
              </div>

              {/* Chunks & Context Preview Section */}
              <div
                style={{
                  backgroundColor: '#111726',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                      {isAdmin ? 'ChromaDB Text Chunks & Vector Preview' : 'Document Information & Coverage'}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                      {isAdmin
                        ? 'Indexed chunks with 500-word sliding window and 100-word overlap'
                        : 'Verified institutional rules and academic guidelines available for questions'}
                    </p>
                  </div>
                  {isAdmin ? (
                    <span
                      style={{
                        fontSize: '0.725rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(139, 92, 246, 0.12)',
                        color: '#c4b5fd',
                        fontFamily: 'monospace',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                      }}
                    >
                      Admin Vector View
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.725rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#94a3b8',
                      }}
                    >
                      Document Grounded
                    </span>
                  )}
                </div>

                {isStudent ? (
                  /* STUDENT VIEW: safe summary, no raw chunk leaks */
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#0d121f',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      color: '#cbd5e1',
                      fontSize: '0.85rem',
                      lineHeight: '1.6',
                    }}
                  >
                    <p style={{ margin: '0 0 10px 0' }}>
                      This document contains official institutional policies covering attendance, examinations, academic regulations, or department details.
                    </p>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
                      Use the <strong>"Ask About Document"</strong> button above to ask questions directly. The Adaptive RAG assistant will retrieve relevant sections and verify every response across all 5 evaluation checkpoints.
                    </p>
                  </div>
                ) : (
                  /* ADMIN VIEW: full chunk inspection */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {doc.chunks && doc.chunks.length > 0 ? (
                      doc.chunks.map((chk, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '12px 14px',
                            backgroundColor: '#0d121f',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '6px',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
                              Chunk #{chk.chunkIndex ?? i}
                            </span>
                            {chk.page && (
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                Page {chk.page}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: '0.8125rem',
                              color: '#cbd5e1',
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {chk.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: '14px',
                          backgroundColor: '#0d121f',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          color: '#94a3b8',
                          fontSize: '0.8125rem',
                        }}
                      >
                        Sample chunks indexed in ChromaDB collection.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Admin Modals */}
      {isAdmin && doc && (
        <>
          <ReplaceDocumentModal
            isOpen={isReplaceOpen}
            doc={doc}
            onClose={() => setIsReplaceOpen(false)}
            onReplaced={(updated) => setDoc(updated)}
          />

          <DeleteConfirmModal
            isOpen={isDeleteOpen}
            doc={doc}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        </>
      )}
    </div>
  );
}
