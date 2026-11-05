import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import DocumentDetails from './pages/DocumentDetails';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import PendingApprovals from './pages/PendingApprovals';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import AccessDenied from './pages/AccessDenied';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';
import { createConversation, deleteConversation, getConversations } from './services/api';
import {
  activateConversation,
  clearLegacyChatSessions,
  isCurrentAccountResponse,
  mapConversationHistory,
  sessionsForAccount,
} from './services/chatIsolation';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionOwnerId, setSessionOwnerId] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const historyRequestRef = useRef(0);
  const createLockRef = useRef(null);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const activeUserId = user?.id || null;
  const identityRef = useRef({ userId: activeUserId, token });
  identityRef.current = { userId: activeUserId, token };
  const visibleChatSessions = sessionsForAccount(chatSessions, sessionOwnerId, activeUserId);
  const isChatDisabled = authLoading || isHistoryLoading || isCreatingConversation
    || !activeUserId || !token || sessionOwnerId !== activeUserId;

  // Discard the old shared browser cache. It has no reliable owner and is never imported.
  useEffect(() => {
    clearLegacyChatSessions();
  }, []);

  // Each identity transition clears visible state before loading that account's server history.
  useEffect(() => {
    setChatSessions([]);
    setCurrentSessionId(null);
    setSessionOwnerId(activeUserId);
    setHistoryError(null);
    createLockRef.current = null;
    setIsCreatingConversation(false);
    if (authLoading) {
      setIsHistoryLoading(true);
      return undefined;
    }
    if (!activeUserId || !token) {
      setIsHistoryLoading(false);
      return undefined;
    }

    setIsHistoryLoading(true);
    const controller = new AbortController();
    const requestedUserId = activeUserId;
    const requestedToken = token;
    const requestId = ++historyRequestRef.current;
    getConversations(controller.signal, token).then((conversations) => {
      if (controller.signal.aborted || requestId !== historyRequestRef.current
        || !isCurrentAccountResponse(requestedUserId, identityRef.current.userId)
        || requestedToken !== identityRef.current.token) return;
      const sessions = mapConversationHistory(conversations);
      setChatSessions(sessions);
      setCurrentSessionId(sessions[0]?.id || null);
    }).catch((error) => {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('[Chat] Could not load conversations:', error);
        if (requestId === historyRequestRef.current
          && isCurrentAccountResponse(requestedUserId, identityRef.current.userId)
          && requestedToken === identityRef.current.token) {
          setHistoryError('Could not load your conversations. Retry by refreshing the page.');
        }
      }
    }).finally(() => {
      if (requestId === historyRequestRef.current
        && isCurrentAccountResponse(requestedUserId, identityRef.current.userId)
        && requestedToken === identityRef.current.token) setIsHistoryLoading(false);
    });
    return () => {
      controller.abort();
      if (requestId === historyRequestRef.current) historyRequestRef.current += 1;
    };
  }, [activeUserId, token, authLoading]);

  const handleNewChat = async () => {
    if (!user || !token || isChatDisabled || createLockRef.current) return false;
    const requestedUserId = user.id;
    const requestedToken = token;
    const requestLock = {};
    createLockRef.current = requestLock;
    setIsCreatingConversation(true);
    setCurrentSessionId(null);
    try {
      const conversation = await createConversation(token);
      if (!isCurrentAccountResponse(requestedUserId, identityRef.current.userId)
        || requestedToken !== identityRef.current.token) return false;
      const activated = activateConversation(visibleChatSessions, conversation);
      setSessionOwnerId(requestedUserId);
      setChatSessions(activated.sessions);
      setCurrentSessionId(activated.activeConversationId);
      setHistoryError(null);
      return true;
    } catch (error) {
      console.error('[Chat] Could not create conversation:', error);
      return false;
    } finally {
      if (createLockRef.current === requestLock) {
        createLockRef.current = null;
        if (isCurrentAccountResponse(requestedUserId, identityRef.current.userId)
          && requestedToken === identityRef.current.token) setIsCreatingConversation(false);
      }
    }
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
  };

  const handleClearAllHistory = async () => {
    if (!user || !token) return false;
    const requestedUserId = user.id;
    const toDelete = visibleChatSessions.map((session) => session.id);
    try {
      await Promise.all(toDelete.map((id) => deleteConversation(id, token)));
      if (!isCurrentAccountResponse(requestedUserId, identityRef.current.userId)
        || token !== identityRef.current.token) return false;
      setChatSessions([]);
      setCurrentSessionId(null);
      return true;
    } catch (error) {
      console.error('[Chat] Could not delete all conversations:', error);
      return false;
    }
  };

  const handleAskDocument = (question) => {
    const active = visibleChatSessions.find((s) => s.id === currentSessionId);
    if (active && active.messages.length > 0) {
      handleNewChat();
    }
    navigate('/');
  };

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        chatSessions={visibleChatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        isNewChatDisabled={isChatDisabled}
      />

      {/* Main App Content View */}
      <main className="main-content">
        {historyError && (
          <div role="alert" style={{ padding: '8px 16px', color: '#f87171', backgroundColor: '#1f1418' }}>
            {historyError}
          </div>
        )}
        <Routes>
          {/* Public / Student & Admin Shared Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute adminOnly={false}>
                <Chat
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  currentSessionId={currentSessionId}
                  chatSessions={visibleChatSessions}
                  setChatSessions={setChatSessions}
                  setCurrentSessionId={setCurrentSessionId}
                  isChatDisabled={isChatDisabled}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={<Documents onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
          />
          <Route
            path="/documents/:id"
            element={
              <DocumentDetails
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onAskDocument={handleAskDocument}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onClearAllHistory={handleClearAllHistory}
                sessionCount={visibleChatSessions.length}
              />
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute adminOnly={true}>
                <PendingApprovals onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={<Navigate to="/documents" replace />}
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute adminOnly={true}>
                <Analytics onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute adminOnly={true}>
                <AuditLogs onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly={true}>
                <Users onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              </ProtectedRoute>
            }
          />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
