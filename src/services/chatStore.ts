/**
 * ARTI AI — shared conversation store.
 *
 * A single observable store backs both the Chats workspace and the dedicated
 * conversation workspace, so a conversation opened from Home is the same
 * object the Chats list shows, and messages never leak between conversations.
 *
 * Persistence is localStorage (`arti_ws_chats`), the repository's only storage
 * layer. Nothing is sent to a server; the store never claims server-side
 * history. Demonstration conversations are never persisted and are clearly
 * labelled by the UI until the owner creates a real one.
 */
import { useSyncExternalStore } from 'react';
import { sendChatCompletion, type ChatTurn } from '../services/aiService';

export type MessageSender = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'sending' | 'failed';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  status: MessageStatus;
  /** Present on a failed assistant turn so the UI can explain the real error. */
  error?: string;
  retryable?: boolean;
}

export type DateGroup = 'today' | 'yesterday' | 'previous7' | 'older';

export interface ChatConversation {
  id: string;
  title: string;
  isPinned: boolean;
  dateGroup: DateGroup;
  updatedAt: string;
  model: string;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'arti_ws_chats';

const DEMO_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-1',
    title: 'Universal AI Operating Architecture',
    isPinned: true,
    dateGroup: 'today',
    updatedAt: '10:45 AM',
    model: 'ARTI Engine (Standby)',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        content: 'How should ARTI AI structure its autonomous agent orchestration and task execution engine?',
        timestamp: '10:45 AM',
        status: 'complete',
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        content:
          'ARTI AI is architected with a decoupled 3-tier foundation:\n1. Universal Workspace Shell & Graphical Canvas (User Interface)\n2. Task Control Center & Dependency Planner (Deterministic Orchestration)\n3. Model Execution & Verification Engine (Specialist Agents with Proof of Work)\n\nNote: Live AI inference requires connecting a provider in Settings > Connected Services.',
        timestamp: '10:45 AM',
        status: 'complete',
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'High-Fidelity Cinema Pipeline Specs',
    isPinned: false,
    dateGroup: 'yesterday',
    updatedAt: 'Yesterday',
    model: 'ARTI Visual Orchestrator',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        content: 'Review the scene consistency requirements for multi-scene video generation.',
        timestamp: 'Yesterday',
        status: 'complete',
      },
      {
        id: 'msg-4',
        sender: 'assistant',
        content:
          'Scene continuity requires anchor latent embeddings, character identity seed locks, and camera trajectory interpolation across adjacent generation segments.',
        timestamp: 'Yesterday',
        status: 'complete',
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Where Is My Data Stored?',
    isPinned: false,
    dateGroup: 'previous7',
    updatedAt: '3 days ago',
    model: 'ARTI Engine (Standby)',
    messages: [
      {
        id: 'msg-5',
        sender: 'user',
        content: 'Where does ARTI store my conversations?',
        timestamp: '3 days ago',
        status: 'complete',
      },
      {
        id: 'msg-6',
        sender: 'assistant',
        content:
          'In this build, records you create are saved to your browser\u2019s localStorage on this device. They persist across reloads in this browser only. No encryption layer is applied and nothing is sent to a server.',
        timestamp: '3 days ago',
        status: 'complete',
      },
    ],
  },
];

interface StoreState {
  conversations: ChatConversation[];
  activeId: string;
  isDemo: boolean;
  /** Conversations with an assistant request currently in flight. */
  pendingIds: string[];
}

function readStored(): ChatConversation[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Older persisted records may predate `status`; default them to complete.
    return (parsed as ChatConversation[]).map((c) => ({
      ...c,
      messages: (c.messages || []).map((m) => ({ ...m, status: m.status || 'complete' })),
    }));
  } catch {
    return null;
  }
}

function initialState(): StoreState {
  const stored = readStored();
  if (stored) {
    return { conversations: stored, activeId: stored[0]?.id ?? '', isDemo: false, pendingIds: [] };
  }
  return {
    conversations: DEMO_CONVERSATIONS,
    activeId: DEMO_CONVERSATIONS[0]?.id ?? '',
    isDemo: DEMO_CONVERSATIONS.length > 0,
    pendingIds: [],
  };
}

class ChatStore {
  private state: StoreState = initialState();
  private listeners = new Set<() => void>();
  private pendingControllers = new Map<string, AbortController>();

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private persist() {
    if (typeof window === 'undefined' || this.state.isDemo) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.conversations));
    } catch {
      // Storage may be unavailable; the in-memory session still works.
    }
  }

  private setState(next: Partial<StoreState>) {
    this.state = { ...this.state, ...next };
    this.persist();
    this.emit();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): StoreState => this.state;

  getConversation(id: string): ChatConversation | undefined {
    return this.state.conversations.find((c) => c.id === id);
  }

  setActive(id: string) {
    if (this.state.activeId === id) return;
    this.setState({ activeId: id });
  }

  createConversation(): ChatConversation {
    const conv: ChatConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: 'New Conversation',
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Engine',
      messages: [],
    };
    this.setState({
      conversations: [conv, ...this.state.conversations],
      activeId: conv.id,
      isDemo: false,
    });
    return conv;
  }

  /** Drop demonstration content and start from an empty real collection. */
  clearDemo() {
    this.setState({ conversations: [], activeId: '', isDemo: false });
  }

  /**
   * Start a new real conversation from a Home prompt and immediately request
   * the assistant reply. Returns the new conversation id so the caller can put
   * it in the URL.
   */
  startFromPrompt(prompt: string): string {
    const text = prompt.trim();
    const conv: ChatConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: text.slice(0, 40) || 'New Conversation',
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Engine',
      messages: [],
    };
    this.setState({
      conversations: [conv, ...this.state.conversations],
      activeId: conv.id,
      isDemo: false,
    });
    if (text) void this.sendMessage(conv.id, text);
    return conv.id;
  }

  private replaceConversation(id: string, updater: (c: ChatConversation) => ChatConversation) {
    this.setState({
      conversations: this.state.conversations.map((c) => (c.id === id ? updater(c) : c)),
    });
  }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Append a user message and request the real assistant reply. The user turn
   * is committed immediately and kept even if the request fails.
   */
  async sendMessage(conversationId: string, rawText: string) {
    const text = rawText.trim();
    if (!text) return;

    const existing = this.getConversation(conversationId);
    if (!existing) return;
    // Guard against overlapping sends for the same conversation.
    if (this.pendingControllers.has(conversationId)) return;

    const stamp = this.now();
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_u',
      sender: 'user',
      content: text,
      timestamp: stamp,
      status: 'complete',
    };

    this.replaceConversation(conversationId, (c) => ({
      ...c,
      title: c.title === 'New Conversation' ? text.slice(0, 40) : c.title,
      updatedAt: 'Just now',
      messages: [...c.messages, userMsg],
    }));

    await this.requestReply(conversationId);
  }

  /**
   * (Re)request the assistant reply for the latest user turn. Used both for the
   * first send and for an explicit retry after a failure.
   */
  async requestReply(conversationId: string) {
    const conv = this.getConversation(conversationId);
    if (!conv || this.pendingControllers.has(conversationId)) return;

    // Build the context from completed turns only (drop failed placeholders).
    const turns: ChatTurn[] = conv.messages
      .filter((m) => m.status !== 'failed')
      .map((m) => ({ role: m.sender, content: m.content }));
    if (turns.length === 0) return;

    const controller = new AbortController();
    this.pendingControllers.set(conversationId, controller);
    this.setState({ pendingIds: [...this.pendingControllers.keys()] });

    // Show a pending assistant placeholder so the UI has a real "waiting" state.
    const pendingId = 'msg_' + Date.now() + '_a';
    this.replaceConversation(conversationId, (c) => ({
      ...c,
      messages: [
        ...c.messages.filter((m) => m.status !== 'failed'),
        { id: pendingId, sender: 'assistant', content: '', timestamp: this.now(), status: 'sending' },
      ],
    }));

    try {
      const reply = await sendChatCompletion(turns, controller.signal);
      this.replaceConversation(conversationId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === pendingId ? { ...m, content: reply, status: 'complete' } : m
        ),
      }));
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      if (aborted) {
        // A stop was requested; remove the placeholder without an error state.
        this.replaceConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.filter((m) => m.id !== pendingId),
        }));
      } else {
        const message = err instanceof Error ? err.message : 'The AI request failed.';
        const retryable = (err as { retryable?: boolean }).retryable !== false;
        this.replaceConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === pendingId
              ? { ...m, content: message, status: 'failed', error: message, retryable }
              : m
          ),
        }));
      }
    } finally {
      this.pendingControllers.delete(conversationId);
      this.setState({ pendingIds: [...this.pendingControllers.keys()] });
    }
  }

  /** Abort an in-flight request for a conversation (the Stop control). */
  stop(conversationId: string) {
    this.pendingControllers.get(conversationId)?.abort();
  }

  isPending(conversationId: string): boolean {
    return this.pendingControllers.has(conversationId);
  }

  /**
   * Retry a failed assistant turn: drop the failed placeholder and request the
   * reply again from the completed history.
   */
  async retry(conversationId: string) {
    const conv = this.getConversation(conversationId);
    if (!conv) return;
    this.replaceConversation(conversationId, (c) => ({
      ...c,
      messages: c.messages.filter((m) => m.status !== 'failed'),
    }));
    await this.requestReply(conversationId);
  }

  togglePin(id: string) {
    this.replaceConversation(id, (c) => ({ ...c, isPinned: !c.isPinned }));
  }

  rename(id: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.replaceConversation(id, (c) => ({ ...c, title: trimmed }));
  }

  archive(id: string) {
    const remaining = this.state.conversations.filter((c) => c.id !== id);
    const activeId = this.state.activeId === id ? remaining[0]?.id ?? '' : this.state.activeId;
    this.setState({ conversations: remaining, activeId });
  }
}

export const chatStore = new ChatStore();

/** React binding: re-renders subscribers when the store changes. */
export function useChatStore(): StoreState {
  return useSyncExternalStore(chatStore.subscribe, chatStore.getState, chatStore.getState);
}

export { DEMO_CONVERSATIONS };
