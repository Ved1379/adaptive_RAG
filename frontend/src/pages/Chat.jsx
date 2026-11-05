import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Award,
  Layers,
  Building2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import ChatHeader from '../components/ChatHeader';
import ChatMessage from '../components/ChatMessage';
import LoadingMessage from '../components/LoadingMessage';
import MessageInput from '../components/MessageInput';
import SuggestionCard from '../components/SuggestionCard';
import { sendConversationMessage, checkHealth, deleteConversation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { beginChatTurn, finishChatTurn, isCurrentAccountResponse } from '../services/chatIsolation';

const DEFAULT_SUGGESTIONS = [
  {
    id: 1,
    text: 'What is the minimum attendance requirement?',
    icon: Clock,
  },
  {
    id: 2,
    text: 'Show me the examination rules',
    icon: Award,
  },
  {
    id: 3,
    text: 'Tell me about the departments',
    icon: Layers,
  },
  {
    id: 4,
    text: 'What facilities are available?',
    icon: Building2,
  },
];

export default function Chat({
  onToggleSidebar,
  currentSessionId,
  chatSessions,
  setChatSessions,
  setCurrentSessionId,
  isChatDisabled = false,
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const activeRequestRef = useRef(null);
  const identityRef = useRef(null);
  const selectedSessionRef = useRef(currentSessionId);
  const { user, token } = useAuth();
  identityRef.current = { userId: user?.id || null, token };
  selectedSessionRef.current = currentSessionId;

  useEffect(() => {
    activeRequestRef.current?.abort();
    return () => activeRequestRef.current?.abort();
  }, [user?.id, token]);

  // Get active session messages
  const currentSession = chatSessions.find((s) => s.id === currentSessionId) || {
    id: currentSessionId,
    messages: [],
  };
  const messages = currentSession.messages || [];

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    checkHealth().then((res) => {
      if (isMounted) {
        setIsBackendOnline(res.isOnline);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Smooth auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText = null) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading || isChatDisabled || !user || !token) return;

    const requestedUserId = user.id;
    const requestedToken = token;
    const sessionId = currentSessionId || `pending-${Date.now()}`;

    setError(null);
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: userTimestamp,
    };

    // Update session title if first message
    const updatedMessages = [...messages, newUserMessage];
    const updatedTitle =
      messages.length === 0
        ? textToSend.length > 28
          ? `${textToSend.slice(0, 28)}...`
          : textToSend
        : currentSession.title;

    setChatSessions((prev) => beginChatTurn(prev, sessionId, newUserMessage, updatedTitle).sessions);
    // Select the optimistic session immediately so the user message renders during generation.
    selectedSessionRef.current = sessionId;
    setCurrentSessionId(sessionId);

    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    try {
      activeRequestRef.current = controller;
      const response = await sendConversationMessage(
        textToSend,
        currentSessionId,
        controller.signal,
        requestedToken
      );
      if (!isCurrentAccountResponse(requestedUserId, identityRef.current?.userId)
        || identityRef.current?.token !== requestedToken) return;

      const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (response.success && response.data) {
        const { answer, evaluation, sources, regenerated, category, insufficient } = response.data;

        const newAiMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: answer || "I don't have enough information in the provided documents.",
          category: category || null,
          evaluation: evaluation || null,
          sources: sources || [],
          regenerated: Boolean(regenerated),
          insufficient: Boolean(insufficient),
          timestamp: aiTimestamp,
        };

        const savedConversationId = response.data.conversation_id;

        setChatSessions((prev) => finishChatTurn(
          prev,
          sessionId,
          savedConversationId,
          [...updatedMessages, newAiMessage]
        ));
        if (savedConversationId && selectedSessionRef.current === sessionId) {
          selectedSessionRef.current = savedConversationId;
          setCurrentSessionId(savedConversationId);
        }
      } else {
        // Display real error without falling back to fake attendance data
        const errMsg =
          response.error ||
          'Unable to connect to the chatbot server. Please make sure the FastAPI backend is running.';
        setError(errMsg);

        const errorAiMessage = {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Backend Notice**\n\n${errMsg}`,
          timestamp: aiTimestamp,
          isError: true,
        };

        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...updatedMessages, errorAiMessage],
                  updatedAt: Date.now(),
                }
              : s
          )
        );
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      if (!isCurrentAccountResponse(requestedUserId, identityRef.current?.userId)
        || identityRef.current?.token !== requestedToken) return;
      const errMsg = err.message || 'An unexpected error occurred.';
      setError(errMsg);
    } finally {
      if (isCurrentAccountResponse(requestedUserId, identityRef.current?.userId)
        && identityRef.current?.token === requestedToken) setIsLoading(false);
      if (activeRequestRef.current === controller) activeRequestRef.current = null;
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      const requestedUserId = user?.id;
      const deletingSessionId = currentSessionId;
      try {
        if (deletingSessionId && !deletingSessionId.startsWith('pending-')) {
          await deleteConversation(deletingSessionId, token);
        }
        if (!isCurrentAccountResponse(requestedUserId, identityRef.current?.userId)) return;
        setChatSessions((prev) => prev.filter((session) => session.id !== deletingSessionId));
        if (selectedSessionRef.current === deletingSessionId) {
          selectedSessionRef.current = null;
          setCurrentSessionId(null);
        }
        setError(null);
      } catch (err) {
        if (isCurrentAccountResponse(requestedUserId, identityRef.current?.userId)) {
          setError('Unable to delete this conversation. Please try again.');
        }
      }
    }
  };

  const handleRetryLast = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSend(lastUserMessage.content);
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
      <ChatHeader
        onToggleSidebar={onToggleSidebar}
        onClearChat={handleClearChat}
        messageCount={messages.length}
        isBackendOnline={isBackendOnline}
      />

      {/* Main Chat Scroll Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px 10px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '850px',
            width: '100%',
            margin: '0 auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.length === 0 ? (
            /* EMPTY CHAT STATE */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                textAlign: 'center',
                padding: '40px 16px',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              {/* College Badge */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Sparkles size={26} />
              </div>

              {/* Title & Subtitle */}
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em',
                }}
              >
                How can I help you today?
              </h2>

              <p
                style={{
                  fontSize: '0.9375rem',
                  color: '#94a3b8',
                  maxWidth: '560px',
                  lineHeight: '1.5',
                  marginBottom: '32px',
                }}
              >
                Ask questions about college rules, academics, departments,
                examinations, attendance, facilities and other college information.
              </p>

              {/* 4 Suggestion Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '720px',
                }}
              >
                {DEFAULT_SUGGESTIONS.map((sug) => (
                  <SuggestionCard
                    key={sug.id}
                    text={sug.text}
                    icon={sug.icon}
                    onClick={(text) => handleSend(text)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT MESSAGES */
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isLoading && <LoadingMessage />}

              {error && (
                <div
                  style={{
                    padding: '14px 18px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    color: '#f87171',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Connection Notice</div>
                      <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{error}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetryLast}
                    className="btn btn-secondary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} style={{ height: '8px' }} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <MessageInput
        input={input}
        setInput={setInput}
        onSend={() => handleSend()}
        isLoading={isLoading || isChatDisabled}
        placeholder="Ask anything about your college..."
      />
    </div>
  );
}
