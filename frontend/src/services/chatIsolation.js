export function clearLegacyChatSessions(storage = window.localStorage) {
  storage.removeItem('adaptive_rag_sessions_v1');
}

export function isCurrentAccountResponse(requestAccountId, activeAccountId) {
  return Boolean(requestAccountId && requestAccountId === activeAccountId);
}

export function sessionsForAccount(sessions, ownerAccountId, activeAccountId) {
  return activeAccountId && ownerAccountId === activeAccountId ? sessions : [];
}

export function mapConversationHistory(conversations) {
  return conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title || 'New Conversation',
    messages: (conversation.messages || []).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.created_at,
    })),
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  }));
}

export function activateConversation(sessions, conversation) {
  const session = {
    ...conversation,
    messages: conversation.messages || [],
    createdAt: conversation.created_at || conversation.createdAt,
    updatedAt: conversation.updated_at || conversation.updatedAt,
  };
  return {
    sessions: [session, ...sessions.filter((item) => item.id !== session.id)],
    activeConversationId: session.id,
  };
}

export function beginChatTurn(sessions, sessionId, userMessage, title) {
  const existing = sessions.find((item) => item.id === sessionId);
  const session = existing
    ? { ...existing, title, messages: [...existing.messages, userMessage], updatedAt: Date.now() }
    : { id: sessionId, title, messages: [userMessage], createdAt: Date.now(), updatedAt: Date.now() };
  return {
    sessions: [session, ...sessions.filter((item) => item.id !== sessionId)],
    activeConversationId: sessionId,
  };
}

export function finishChatTurn(sessions, pendingId, savedId, messages) {
  const index = sessions.findIndex((item) => item.id === pendingId);
  if (index < 0) return sessions;
  const session = { ...sessions[index], id: savedId || pendingId, messages, updatedAt: Date.now() };
  return [session, ...sessions.filter((item) => item.id !== pendingId && item.id !== session.id)];
}
