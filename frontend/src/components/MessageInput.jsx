import React, { useRef, useEffect } from 'react';
import { ArrowUp, CornerDownLeft } from 'lucide-react';

export default function MessageInput({
  input,
  setInput,
  onSend,
  isLoading,
  placeholder = 'Ask anything about your college...',
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const isSendDisabled = !input.trim() || isLoading;

  return (
    <div
      style={{
        padding: '16px 24px 20px 24px',
        backgroundColor: '#090d16',
        borderTop: '1px solid #1e293b',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          backgroundColor: '#111726',
          border: '1px solid #243048',
          borderRadius: '16px',
          padding: '10px 14px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={() => {
          if (textareaRef.current) {
            textareaRef.current.parentElement.style.borderColor = 'rgba(59, 130, 246, 0.6)';
          }
        }}
        onBlur={() => {
          if (textareaRef.current) {
            textareaRef.current.parentElement.style.borderColor = '#243048';
          }
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f8fafc',
            fontSize: '0.9375rem',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            maxHeight: '140px',
            fontFamily: 'inherit',
            padding: '4px 0',
          }}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={isSendDisabled}
          title={isSendDisabled ? 'Type a question to send' : 'Send message (Enter)'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSendDisabled ? '#1e293b' : '#2563eb',
            color: isSendDisabled ? '#64748b' : '#ffffff',
            border: 'none',
            cursor: isSendDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            opacity: isSendDisabled ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSendDisabled) {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSendDisabled) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '8px',
          padding: '0 4px',
          fontSize: '0.725rem',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Adaptive RAG verifies answers against college documents</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Enter</span>
          <CornerDownLeft size={10} />
          <span>to send • Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
