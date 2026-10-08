import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import DocumentDetails from './pages/DocumentDetails';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import AccessDenied from './pages/AccessDenied';

const STORAGE_KEY = 'adaptive_rag_sessions_v1';

export default function App() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load chat sessions from localStorage or initialize with a default one
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read chat sessions from localStorage:', e);
    }
    const initialId = `session-${Date.now()}`;
    return [
      {
        id: initialId,
        title: 'New Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return chatSessions[0]?.id || `session-${Date.now()}`;
  });

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions));
    } catch (e) {
      console.warn('Could not save sessions to localStorage:', e);
    }
  }, [chatSessions]);

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
  };

  const handleClearAllHistory = () => {
    const newId = `session-${Date.now()}`;
    const freshSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChatSessions([freshSession]);
    setCurrentSessionId(newId);
  };

  const handleAskDocument = (question) => {
    const active = chatSessions.find((s) => s.id === currentSessionId);
    let targetId = currentSessionId;
    if (active && active.messages.length > 0) {
      const newId = `session-${Date.now()}`;
      const newSession = {
        id: newId,
        title: question.length > 28 ? `${question.slice(0, 28)}...` : question,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setChatSessions((prev) => [newSession, ...prev]);
      targetId = newId;
      setCurrentSessionId(newId);
    }
    navigate('/');
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
      />

      {/* Main App Content View */}
      <main className="main-content">
        <Routes>
          {/* Public / Student & Admin Shared Routes */}
          <Route
            path="/"
            element={
              <Chat
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                currentSessionId={currentSessionId}
                chatSessions={chatSessions}
                setChatSessions={setChatSessions}
              />
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
                sessionCount={chatSessions.length}
              />
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={<Navigate to="/documents" replace />}
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Users onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <Analytics onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
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
