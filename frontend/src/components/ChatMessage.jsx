import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, RefreshCw, AlertCircle, Compass, GraduationCap } from 'lucide-react';
import SourcePanel from './SourcePanel';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isInsufficient =
    message.insufficient ||
    (message.content &&
      message.content.includes("I don't have enough information in the provided documents."));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '20px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          maxWidth: '85%',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
            backgroundColor: isUser ? '#1d4ed8' : '#1e293b',
            border: isUser
              ? '1px solid rgba(59, 130, 246, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            color: isUser ? '#ffffff' : '#38bdf8',
          }}
        >
          {isUser ? <User size={18} /> : <Sparkles size={17} />}
        </div>

        {/* Message Bubble Container */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
          {/* Sender label, category badge, and timestamp */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <span style={{ fontWeight: 600, color: isUser ? '#93c5fd' : '#cbd5e1' }}>
              {isUser ? 'You' : 'College Assistant'}
            </span>

            {/* Category badge from actual backend classification */}
            {!isUser && message.category && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor:
                    message.category === 'COLLEGE'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(148, 163, 184, 0.12)',
                  color: message.category === 'COLLEGE' ? '#60a5fa' : '#94a3b8',
                  border:
                    message.category === 'COLLEGE'
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid rgba(148, 163, 184, 0.25)',
                }}
              >
                {message.category === 'COLLEGE' ? (
                  <>
                    <GraduationCap size={11} />
                    <span>COLLEGE</span>
                  </>
                ) : (
                  <>
                    <Compass size={11} />
                    <span>GENERAL</span>
                  </>
                )}
              </span>
            )}

            <span>•</span>
            <span>{message.timestamp || 'Just now'}</span>
          </div>

          {/* Main Bubble */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              backgroundColor: isUser ? '#1e3a8a' : '#131a29',
              border: isUser
                ? '1px solid rgba(59, 130, 246, 0.35)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f1f5f9',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              fontSize: '0.925rem',
              lineHeight: 1.6,
            }}
          >
            {/* Adaptive Regeneration Indicator: "Response refined after verification" */}
            {!isUser && message.regenerated && !isInsufficient && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 9px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#38bdf8',
                  marginBottom: '10px',
                  fontWeight: 500,
                }}
              >
                <RefreshCw size={12} style={{ color: '#38bdf8' }} />
                <span>Response refined after verification</span>
              </div>
            )}

            {/* Insufficient Document Information State */}
            {!isUser && isInsufficient ? (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#f87171',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>Information Unavailable in Grounded Documents</span>
                </div>
                <p style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '0.9rem' }}>
                  "I don't have enough information in the provided documents."
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
                  Try asking about something covered in the available college documents (e.g.,
                  attendance requirements, examination rules, departments, or facilities).
                </p>
              </div>
            ) : (
              /* Standard Markdown AI / User Content */
              <div className="prose-chat" style={{ wordBreak: 'break-word' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => (
                      <p style={{ margin: '0 0 10px 0', lineHeight: 1.6 }} {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        style={{ margin: '6px 0 10px 20px', paddingLeft: 0, listStyleType: 'disc' }}
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        style={{
                          margin: '6px 0 10px 20px',
                          paddingLeft: 0,
                          listStyleType: 'decimal',
                        }}
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                    strong: ({ node, ...props }) => (
                      <strong style={{ fontWeight: 600, color: '#ffffff' }} {...props} />
                    ),
                    code: ({ node, inline, ...props }) =>
                      inline ? (
                        <code
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.35)',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontSize: '0.825em',
                            color: '#e2e8f0',
                            fontFamily: 'monospace',
                          }}
                          {...props}
                        />
                      ) : (
                        <pre
                          style={{
                            backgroundColor: '#0a0e17',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            overflowX: 'auto',
                            margin: '8px 0',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.825em',
                          }}
                        >
                          <code {...props} />
                        </pre>
                      ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Expandable Sources & Verification section for AI messages (only if real sources or real evaluation provided) */}
            {!isUser &&
              !isInsufficient &&
              ((message.sources && message.sources.length > 0) ||
                (message.evaluation && Object.keys(message.evaluation).length > 0)) && (
                <SourcePanel
                  sources={message.sources}
                  evaluation={message.evaluation}
                  regenerated={message.regenerated}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
