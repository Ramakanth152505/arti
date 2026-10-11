import React, { useState } from 'react';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  MoreVertical,
  Archive,
  Edit2,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import { useIsMobileNav } from '../../../hooks/useMediaQuery';
import { DemoDataNotice } from '../../common/DemoDataNotice';
import { chatStore, useChatStore, type ChatConversation } from '../../../services/chatStore';
import { getConnection, isAiConfigured, getProviderLabel } from '../../../services/aiService';
import { MessageList } from '../../conversation/MessageList';
import { Composer } from '../../conversation/Composer';

export const ChatsWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const isMobileNav = useIsMobileNav();
  const state = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [wasMobileNav, setWasMobileNav] = useState(isMobileNav);

  // On small screens the conversation list is an overlay: start it closed so the
  // active conversation is readable, and reset to the desktop default when the
  // layout returns to the rail. Adjusted during render to avoid an extra commit.
  if (wasMobileNav !== isMobileNav) {
    setWasMobileNav(isMobileNav);
    setIsSidebarOpen(!isMobileNav);
  }

  const conversations = state.conversations;
  const activeConv = conversations.find((c) => c.id === state.activeId);
  const isPending = activeConv ? state.pendingIds.includes(activeConv.id) : false;
  const connected = isAiConfigured();
  const connection = getConnection();

  const handleCreateNewChat = () => {
    chatStore.createConversation();
    setInputMessage('');
    showToast('New conversation initialized', { type: 'gold' });
  };

  const handleSendMessage = (value: string) => {
    if (!activeConv) {
      const conv = chatStore.createConversation();
      void chatStore.sendMessage(conv.id, value);
    } else {
      void chatStore.sendMessage(activeConv.id, value);
    }
    setInputMessage('');
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    chatStore.togglePin(id);
    setActiveMenuId(null);
    showToast('Pin status updated', { type: 'info' });
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    chatStore.archive(id);
    setActiveMenuId(null);
    showToast('Conversation archived', { type: 'info' });
  };

  const handleRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === id);
    const newTitle = window.prompt('Rename conversation:', conv?.title);
    if (newTitle && newTitle.trim()) {
      chatStore.rename(id, newTitle);
      showToast('Conversation renamed', { type: 'success' });
    }
    setActiveMenuId(null);
  };

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
          <button type="button" className="new-chat-btn" onClick={handleCreateNewChat}>
            <Plus size={15} aria-hidden="true" />
            <span>New Chat</span>
          </button>
          <button
            type="button"
            className="chats-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(false)}
            title="Collapse chats list"
            aria-label="Collapse chats list"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Search Chats Input */}
        <div className="chats-search-bar">
          <div className="chats-search-box">
            <Search size={14} className="chats-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="chats-search-input field-integrated"
              placeholder="Search conversations..."
              aria-label="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {state.isDemo && (
          <div className="chats-demo-notice-wrap">
            <DemoDataNotice
              message="These example conversations are not real chat history. Start a new chat to create your own."
              onClear={() => chatStore.clearDemo()}
            />
          </div>
        )}

        {/* Conversation List Groups */}
        <div className="chats-list-scroll">
          {pinnedList.length > 0 && (
            <div className="chats-group">
              <span className="chats-group-title">
                <Pin size={11} aria-hidden="true" /> Pinned Chats
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
              <button type="button" className="gold-ghost-btn" onClick={handleCreateNewChat}>
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
                aria-label="Open conversations list"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            )}
            <div>
              <h2 className="chat-active-title">
                {activeConv ? activeConv.title : 'No Conversation Selected'}
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
          </div>

          <div className="chat-canvas-actions">
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => navigate('settings')}
              title="Configure Model Providers"
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Model Config</span>
            </button>
          </div>
        </div>

        {/* Conversation Feed */}
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

        {/* Message Composer */}
        <Composer
          value={inputMessage}
          onChange={setInputMessage}
          onSubmit={handleSendMessage}
          pending={isPending}
          onStop={() => activeConv && chatStore.stop(activeConv.id)}
          onAttach={() =>
            showToast('Attachment handler ready. Select file from local disk.', { type: 'info' })
          }
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
      </main>
    </div>
  );

  function renderConvItem(conv: ChatConversation) {
    const isActive = conv.id === state.activeId;
    const isMenuOpen = activeMenuId === conv.id;

    return (
      <div
        key={conv.id}
        className={`chat-item-row ${isActive ? 'active' : ''}`}
        onClick={() => {
          chatStore.setActive(conv.id);
          if (isMobileNav) setIsSidebarOpen(false);
        }}
      >
        <span className="chat-item-title">{conv.title}</span>
        <div className="chat-item-actions">
          {conv.isPinned && <Pin size={11} className="chat-pin-icon" aria-hidden="true" />}
          <button
            type="button"
            className="chat-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(isMenuOpen ? null : conv.id);
            }}
            title="Conversation options"
            aria-label="Conversation options"
          >
            <MoreVertical size={13} aria-hidden="true" />
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
