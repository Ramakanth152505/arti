import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  MoreVertical,
  Send,
  Paperclip,
  Archive,
  Edit2,
  Trash2,
  Sparkles,
  Bot,
  User,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ChatConversation {
  id: string;
  title: string;
  isPinned: boolean;
  dateGroup: 'today' | 'yesterday' | 'previous7' | 'older';
  updatedAt: string;
  messages: ChatMessage[];
  model: string;
}

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-1',
    title: 'Universal AI Operating Architecture',
    isPinned: true,
    dateGroup: 'today',
    updatedAt: '10:45 AM',
    model: 'ARTI Hybrid Engine (Standby)',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        content: 'How should ARTI AI structure its autonomous agent orchestration and task execution engine?',
        timestamp: '10:45 AM',
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        content:
          'ARTI AI is architected with a decoupled 3-tier foundation:\n1. Universal Workspace Shell & Graphical Canvas (User Interface)\n2. Task Control Center & Dependency Planner (Deterministic Orchestration)\n3. Model Execution & Verification Engine (Specialist Agents with Proof of Work)\n\nNote: Live AI inference requires connecting a provider in Settings > Connected Services.',
        timestamp: '10:45 AM',
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
      },
      {
        id: 'msg-4',
        sender: 'assistant',
        content:
          'Scene continuity requires anchor latent embeddings, character identity seed locks, and camera trajectory interpolation across adjacent generation segments.',
        timestamp: 'Yesterday',
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Zero-Telemetry Client Encryption',
    isPinned: false,
    dateGroup: 'previous7',
    updatedAt: '3 days ago',
    model: 'Security Core',
    messages: [
      {
        id: 'msg-5',
        sender: 'user',
        content: 'Verify client-side encryption isolation protocol.',
        timestamp: '3 days ago',
      },
      {
        id: 'msg-6',
        sender: 'assistant',
        content:
          'Session memory is locked into local browser IndexedDB storage with AES-256 GCM client encryption.',
        timestamp: '3 days ago',
      },
    ],
  },
];

export const ChatsWorkspace: React.FC = () => {
  const { initialChatPrompt, setInitialChatPrompt, routeParams, navigate } = useWorkspace();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Handle passed initial prompt from Home
  useEffect(() => {
    const passedPrompt = routeParams.prompt ? decodeURIComponent(routeParams.prompt) : initialChatPrompt;
    if (passedPrompt) {
      const newId = 'conv_' + Date.now();
      const newConv: ChatConversation = {
        id: newId,
        title: passedPrompt.slice(0, 36) + (passedPrompt.length > 36 ? '...' : ''),
        isPinned: false,
        dateGroup: 'today',
        updatedAt: 'Just now',
        model: 'ARTI Hybrid Engine (Standby)',
        messages: [
          {
            id: 'msg_' + Date.now(),
            sender: 'user',
            content: passedPrompt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            id: 'msg_' + (Date.now() + 1),
            sender: 'assistant',
            content:
              'Inference engine is in Standby mode. Connect an API provider (Google Gemini, Anthropic, OpenAI, or Ollama) in Settings > Connected Services to receive live model responses.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newId);
      setInitialChatPrompt('');
    }
  }, [initialChatPrompt, routeParams.prompt, setInitialChatPrompt]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleCreateNewChat = () => {
    const newId = 'conv_' + Date.now();
    const newConv: ChatConversation = {
      id: newId,
      title: 'New Conversation',
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Hybrid Engine (Standby)',
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    showToast('New conversation initialized', { type: 'gold' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const honestSystemResponse: ChatMessage = {
      id: 'msg_' + (Date.now() + 1),
      sender: 'assistant',
      content:
        'Inference service is disconnected. To chat with a live model, add your API key in Settings > Connected Services.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          const updatedMessages = [...c.messages, userMsg, honestSystemResponse];
          const newTitle = c.title === 'New Conversation' ? userMsg.content.slice(0, 32) : c.title;
          return {
            ...c,
            title: newTitle,
            updatedAt: 'Just now',
            messages: updatedMessages,
          };
        }
        return c;
      })
    );

    setInputMessage('');
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    setActiveMenuId(null);
    showToast('Pin status updated', { type: 'info' });
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveMenuId(null);
    if (activeConvId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) setActiveConvId(remaining[0].id);
    }
    showToast('Conversation archived', { type: 'info' });
  };

  const handleRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === id);
    const newTitle = window.prompt('Rename conversation:', conv?.title);
    if (newTitle && newTitle.trim()) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
      );
      showToast('Conversation renamed', { type: 'success' });
    }
    setActiveMenuId(null);
  };

  // Filtered by search
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedList = filtered.filter((c) => c.isPinned);
  const todayList = filtered.filter((c) => !c.isPinned && c.dateGroup === 'today');
  const yesterdayList = filtered.filter((c) => !c.isPinned && c.dateGroup === 'yesterday');
  const previous7List = filtered.filter((c) => !c.isPinned && c.dateGroup === 'previous7');
  const olderList = filtered.filter((c) => !c.isPinned && c.dateGroup === 'older');

  return (
    <div className="chats-workspace-layout">
      {/* Resizable / Collapsible Conversations Sidebar */}
      <aside className={`chats-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="chats-sidebar-header">
          <button
            type="button"
            className="new-chat-btn"
            onClick={handleCreateNewChat}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
          <button
            type="button"
            className="chats-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(false)}
            title="Collapse chats list"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Search Chats Input */}
        <div className="chats-search-bar">
          <Search size={14} className="chats-search-icon" />
          <input
            type="text"
            className="chats-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversation List Groups */}
        <div className="chats-list-scroll">
          {pinnedList.length > 0 && (
            <div className="chats-group">
              <span className="chats-group-title">
                <Pin size={11} /> Pinned Chats
              </span>
              {pinnedList.map((conv) => renderConvItem(conv))}
            </div>
          )}

          {todayList.length > 0 && (
            <div className="chats-group">
              <span className="chats-group-title">Today</span>
              {todayList.map((conv) => renderConvItem(conv))}
            </div>
          )}

          {yesterdayList.length > 0 && (
            <div className="chats-group">
              <span className="chats-group-title">Yesterday</span>
              {yesterdayList.map((conv) => renderConvItem(conv))}
            </div>
          )}

          {previous7List.length > 0 && (
            <div className="chats-group">
              <span className="chats-group-title">Previous 7 Days</span>
              {previous7List.map((conv) => renderConvItem(conv))}
            </div>
          )}

          {olderList.length > 0 && (
            <div className="chats-group">
              <span className="chats-group-title">Older Conversations</span>
              {olderList.map((conv) => renderConvItem(conv))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="chats-empty-list">
              <p>No conversations found</p>
              <button
                type="button"
                className="gold-ghost-btn"
                onClick={handleCreateNewChat}
              >
                Create New Chat
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Conversation Canvas */}
      <main className="chats-main-canvas" role="main">
        {/* Top Chat Header */}
        <div className="chat-canvas-header">
          <div className="chat-canvas-title-group">
            {!isSidebarOpen && (
              <button
                type="button"
                className="chats-sidebar-open-btn"
                onClick={() => setIsSidebarOpen(true)}
                title="Open conversations list"
              >
                <ChevronRight size={16} />
              </button>
            )}
            <div>
              <h2 className="chat-active-title">
                {activeConv ? activeConv.title : 'No Conversation Selected'}
              </h2>
              <div className="chat-active-meta">
                <span className="chat-engine-pill">
                  <Bot size={11} />
                  {activeConv?.model || 'ARTI Engine'}
                </span>
                <span className="chat-private-pill">
                  <ShieldCheck size={11} />
                  Private &amp; Encrypted
                </span>
              </div>
            </div>
          </div>

          <div className="chat-canvas-actions">
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => navigate('settings')}
              title="Configure Model Providers"
            >
              <SlidersHorizontal size={14} />
              <span>Model Config</span>
            </button>
          </div>
        </div>

        {/* Conversation Feed */}
        <div className="chat-messages-container">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-spark">
                <Sparkles size={28} />
              </div>
              <h3>Begin an Intelligent Conversation</h3>
              <p>
                Ask technical questions, draft whitepapers, synthesize architectures, or plan multi-agent workflows.
              </p>
              <div className="chat-prompt-starters">
                <button
                  type="button"
                  className="prompt-starter-pill"
                  onClick={() =>
                    setInputMessage('Explain the architecture of ARTI AI Universal Task Engine')
                  }
                >
                  &ldquo;Explain the architecture of ARTI AI Universal Task Engine&rdquo;
                </button>
                <button
                  type="button"
                  className="prompt-starter-pill"
                  onClick={() =>
                    setInputMessage('Design a zero-telemetry client encryption strategy')
                  }
                >
                  &ldquo;Design a zero-telemetry client encryption strategy&rdquo;
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-messages-list">
              {activeConv.messages.map((msg) => (
                <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                  <div className="chat-avatar-box">
                    {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                  </div>
                  <div className="chat-message-bubble">
                    <div className="chat-message-header">
                      <span className="chat-sender-name">
                        {msg.sender === 'user' ? 'Ramakanth' : 'ARTI AI'}
                      </span>
                      <span className="chat-msg-time">{msg.timestamp}</span>
                    </div>
                    <div className="chat-message-text">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="chat-composer-container">
          <form onSubmit={handleSendMessage} className="chat-composer-box">
            <button
              type="button"
              className="chat-attachment-btn"
              title="Attach File or Code Reference"
              onClick={() =>
                showToast('Attachment handler ready. Select file from local disk.', {
                  type: 'info',
                })
              }
            >
              <Paperclip size={16} />
            </button>

            <textarea
              className="chat-composer-textarea"
              placeholder="Type your message to ARTI AI... (Enter to send, Shift+Enter for new line)"
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />

            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputMessage.trim()}
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </form>

          <div className="chat-composer-notice">
            <FileCode size={11} />
            <span>
              Standalone UI Mode: Connect real inference keys in{' '}
              <button
                type="button"
                className="chat-link-btn"
                onClick={() => navigate('settings')}
              >
                Settings &gt; Connected Services
              </button>{' '}
              to enable live AI responses.
            </span>
          </div>
        </div>
      </main>
    </div>
  );

  function renderConvItem(conv: ChatConversation) {
    const isActive = conv.id === activeConvId;
    const isMenuOpen = activeMenuId === conv.id;

    return (
      <div
        key={conv.id}
        className={`chat-item-row ${isActive ? 'active' : ''}`}
        onClick={() => setActiveConvId(conv.id)}
      >
        <span className="chat-item-title">{conv.title}</span>
        <div className="chat-item-actions">
          {conv.isPinned && <Pin size={11} className="chat-pin-icon" />}
          <button
            type="button"
            className="chat-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(isMenuOpen ? null : conv.id);
            }}
            title="Conversation options"
          >
            <MoreVertical size={13} />
          </button>
        </div>

        {isMenuOpen && (
          <div className="chat-context-dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="chat-dropdown-item"
              onClick={(e) => handleTogglePin(conv.id, e)}
            >
              {conv.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              <span>{conv.isPinned ? 'Unpin' : 'Pin to Top'}</span>
            </button>
            <button
              type="button"
              className="chat-dropdown-item"
              onClick={(e) => handleRename(conv.id, e)}
            >
              <Edit2 size={13} />
              <span>Rename</span>
            </button>
            <button
              type="button"
              className="chat-dropdown-item danger"
              onClick={(e) => handleArchive(conv.id, e)}
            >
              <Archive size={13} />
              <span>Archive</span>
            </button>
          </div>
        )}
      </div>
    );
  }
};
