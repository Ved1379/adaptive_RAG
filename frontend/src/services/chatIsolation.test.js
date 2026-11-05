import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activateConversation,
  beginChatTurn,
  clearLegacyChatSessions,
  finishChatTurn,
  isCurrentAccountResponse,
  mapConversationHistory,
  sessionsForAccount,
} from './chatIsolation.js';

test('legacy globally shared conversation storage is removed without reading it', () => {
  const removed = [];
  clearLegacyChatSessions({ removeItem: (key) => removed.push(key) });
  assert.deepEqual(removed, ['adaptive_rag_sessions_v1']);
});

test('a response from a previous account cannot update the active account state', () => {
  assert.equal(isCurrentAccountResponse('user-a', 'user-b'), false);
  assert.equal(isCurrentAccountResponse('user-a', null), false);
  assert.equal(isCurrentAccountResponse('user-b', 'user-b'), true);
});

test('conversation sessions are visible only to the account that loaded them', () => {
  const sessions = [{ id: 'conversation-a', messages: [{ content: 'private A message' }] }];
  assert.deepEqual(sessionsForAccount(sessions, 'user-a', 'user-a'), sessions);
  assert.deepEqual(sessionsForAccount(sessions, 'user-a', 'user-b'), []);
  assert.deepEqual(sessionsForAccount(sessions, 'user-a', null), []);
});

test('New Chat activates a new server conversation without reusing the old one', () => {
  const old = { id: 'old-conversation', title: 'Old', messages: [{ content: 'old message' }] };
  const next = activateConversation([old], { id: 'new-conversation', title: 'New Conversation' });
  assert.equal(next.activeConversationId, 'new-conversation');
  assert.deepEqual(next.sessions.map((item) => item.id), ['new-conversation', 'old-conversation']);
  assert.deepEqual(next.sessions[0].messages, []);
});

test('a chat turn selects and renders its pending user message, then replaces it with persisted IDs', () => {
  const turn = beginChatTurn([], 'pending-1', { id: 'u1', role: 'user', content: 'question' }, 'question');
  assert.equal(turn.activeConversationId, 'pending-1');
  assert.equal(turn.sessions[0].messages[0].content, 'question');

  const completed = finishChatTurn(
    turn.sessions,
    'pending-1',
    'conversation-1',
    [turn.sessions[0].messages[0], { id: 'm2', role: 'assistant', content: 'answer' }]
  );
  assert.equal(completed[0].id, 'conversation-1');
  assert.deepEqual(completed[0].messages.map((message) => message.content), ['question', 'answer']);
});

test('server history restores messages for the same account and remains hidden from another', () => {
  const restored = mapConversationHistory([{
    id: 'saved-conversation', title: 'Previous chat', created_at: '2026-11-05T10:00:00',
    updated_at: '2026-11-05T10:01:00',
    messages: [{ id: 'm1', role: 'user', content: 'saved question', created_at: '2026-11-05T10:00:00' }],
  }]);
  assert.equal(restored[0].messages[0].content, 'saved question');
  assert.deepEqual(sessionsForAccount(restored, 'user-a', 'user-a'), restored);
  assert.deepEqual(sessionsForAccount(restored, 'user-a', 'user-b'), []);
});
