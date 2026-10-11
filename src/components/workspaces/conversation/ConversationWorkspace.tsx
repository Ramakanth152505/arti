import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, SlidersHorizontal, ShieldCheck, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import { router } from '../../../services/router';
import { chatStore, useChatStore } from '../../../services/chatStore';
import { getConnection, isAiConfigured, getProviderLabel } from '../../../services/aiService';
import { MessageList } from '../../conversation/MessageList';
import { Composer } from '../../conversation/Composer';

/**
 * Dedicated conversation workspace (route: #/conversation).
 *
 * Opened from Home with `?prompt=…` (the initial message is carried over and
 * sent, never lost) or from the Chats list with `?id=…` (the exact conversation
 * is restored). All state lives in the shared {@link chatStore}, so this view
 * and the Chats workspace stay in sync.
 */
export const ConversationWorkspace: React.FC = () => {
  const { routeParams, navigate } = useWorkspace();
  const { showToast } = useToast();
  const state = useChatStore();
  const [input, setInput] = useState('');
  const consumedPrompt = useRef<string | null>(null);

  const activeConv = useMemo(
    () => state.conversations.find((c) => c.id === state.activeId),
    [state.conversations, state.activeId]
  );

  // Adopt the route target. A prompt param starts a new conversation and is
  // then replaced in history so a refresh/back does not resend it.
  useEffect(() => {
    const promptParam = routeParams.prompt ? decodeURIComponent(routeParams.prompt) : '';
    if (promptParam && consumedPrompt.current !== promptParam) {
      consumedPrompt.current = promptParam;
      const id = chatStore.startFromPrompt(promptParam);
      router.navigate('conversation', { id }, true);
      return;
    }
    if (routeParams.id && routeParams.id !== state.activeId) {
      chatStore.setActive(routeParams.id);
    }
  }, [routeParams.prompt, routeParams.id, state.activeId]);

  const isPending = activeConv ? state.pendingIds.includes(activeConv.id) : false;
  const connected = isAiConfigured();
  const connection = getConnection();

  const handleSubmit = (value: string) => {
    if (!activeConv) {
      const conv = chatStore.createConversation();
      void chatStore.sendMessage(conv.id, value);
    } else {
      void chatStore.sendMessage(activeConv.id, value);
    }
    setInput('');
  };

  const handleNewConversation = () => {
    const conv = chatStore.createConversation();
    router.navigate('conversation', { id: conv.id }, true);
    showToast('New conversation initialized', { type: 'gold' });
  };

  return (
    <div className="conversation-workspace">
      <header className="conversation-header">
        <div className="conversation-title-group">
          <h2 className="chat-active-title">
            {activeConv ? activeConv.title : 'New Conversation'}
          </h2>
          <div className="chat-active-meta">
            <span className="chat-engine-pill">
              {connected && connection ? getProviderLabel(connection.provider) : 'ARTI Engine · Standby'}
            </span>
            <span className="chat-private-pill">
              <ShieldCheck size={11} aria-hidden="true" />
              Local Browser Only
            </span>
          </div>
        </div>

        <div className="chat-canvas-actions">
          <button type="button" className="chat-action-btn" onClick={handleNewConversation}>
            <Plus size={14} aria-hidden="true" />
            <span>New</span>
          </button>
          <button type="button" className="chat-action-btn" onClick={() => navigate('settings')}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Model Config</span>
          </button>
        </div>
      </header>

      <MessageList
        messages={activeConv?.messages ?? []}
        onRetry={() => activeConv && void chatStore.retry(activeConv.id)}
        emptyState={
          <div className="chat-empty-state">
            <div className="chat-empty-spark">
              <Sparkles size={28} aria-hidden="true" />
            </div>
            <h3>Begin an Intelligent Conversation</h3>
            <p>
              Ask technical questions, draft whitepapers, synthesize architectures, or plan
              multi-agent workflows.
            </p>
          </div>
        }
      />

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        pending={isPending}
        onStop={() => activeConv && chatStore.stop(activeConv.id)}
        notice={
          connected && connection ? (
            <span>Connected to {getProviderLabel(connection.provider)}. Responses are generated live.</span>
          ) : (
            <span>
              Not connected. Add an API key in{' '}
              <button type="button" className="chat-link-btn" onClick={() => navigate('settings')}>
                Settings &gt; Connected Services
              </button>{' '}
              to enable live AI responses.
            </span>
          )
        }
      />
    </div>
  );
};
