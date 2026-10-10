import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Sparkles, ArrowRight, CornerDownLeft, Lock } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ALL_NAV_ITEMS, type RouteId } from '../../types/navigation';
import { useToast } from '../../context/ToastContext';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Workspace' | 'Action' | 'Tool' | 'Knowledge Source (Planned)';
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  route?: RouteId;
  action?: () => void;
  status: 'available' | 'disconnected' | 'planned';
}

export const CommandSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, navigate, toggleSidebar, cycleTheme, togglePrivateMode } = useWorkspace();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const allItems: SearchResultItem[] = useMemo(() => {
    const navItems: SearchResultItem[] = ALL_NAV_ITEMS.map((item) => ({
      id: `nav-${item.id}`,
      title: item.label,
      subtitle: item.description,
      category: 'Workspace',
      icon: item.icon,
      route: item.id,
      status: 'available',
    }));

    const actions: SearchResultItem[] = [
      {
        id: 'act-magic-mode',
        title: 'Launch Magic Mode Canvas',
        subtitle: 'Enter autonomous multi-agent orchestration workspace',
        category: 'Action',
        icon: Sparkles,
        route: 'magic-mode',
        status: 'available',
      },
      {
        id: 'act-new-chat',
        title: 'Start New Conversation',
        subtitle: 'Open clean chat session in private mode',
        category: 'Action',
        route: 'chats',
        status: 'available',
      },
      {
        id: 'act-new-project',
        title: 'Create New Project',
        subtitle: 'Initialize project space with architecture blueprint',
        category: 'Action',
        route: 'projects',
        status: 'available',
      },
      {
        id: 'act-cycle-theme',
        title: 'Switch Display Theme',
        subtitle: 'Toggle between Midnight Navy, Deep Obsidian, and Cyber Steel',
        category: 'Action',
        action: () => {
          cycleTheme();
          showToast('Display theme updated', { type: 'gold' });
        },
        status: 'available',
      },
      {
        id: 'act-toggle-sidebar',
        title: 'Toggle Navigation Sidebar',
        subtitle: 'Expand or collapse the main icon sidebar',
        category: 'Action',
        action: () => {
          toggleSidebar();
        },
        status: 'available',
      },
      {
        id: 'act-toggle-private',
        title: 'Toggle Private Mode State',
        subtitle: 'Manage local zero-cloud encryption isolation',
        category: 'Action',
        action: () => {
          togglePrivateMode();
          showToast('Session encryption profile updated', { type: 'info' });
        },
        status: 'available',
      },
      // Explicit planned sources to clearly differentiate unavailable backend data
      {
        id: 'src-git-repos',
        title: 'Remote Git Repository Index',
        subtitle: 'GitHub / GitLab cross-project code search (Requires remote auth connector)',
        category: 'Knowledge Source (Planned)',
        status: 'disconnected',
        action: () => {
          showToast('Remote Git Index is not connected. Configure in Settings > Connected Services.', { type: 'warning' });
        },
      },
      {
        id: 'src-cloud-vector',
        title: 'Cloud Vector Embeddings Store',
        subtitle: 'Pinecone / Qdrant cluster index (Currently utilizing local in-memory store)',
        category: 'Knowledge Source (Planned)',
        status: 'disconnected',
        action: () => {
          showToast('Cloud vector cluster is offline. Running in local zero-telemetry mode.', { type: 'info' });
        },
      },
    ];

    return [...navItems, ...actions];
  }, [cycleTheme, toggleSidebar, togglePrivateMode, showToast]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const lower = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.subtitle.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsSearchOpen(false);
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={() => setIsSearchOpen(false)}>
      <div
        className="command-palette-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Global Search and Commands"
      >
        {/* Search Input Bar */}
        <div className="command-input-bar">
          <Search size={18} className="command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            placeholder="Search anything... (chats, projects, tools, workspaces, commands)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search prompt"
          />
          <button
            type="button"
            className="command-close-btn"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>

        {/* Data Source Transparency Banner */}
        <div className="command-source-banner">
          <span className="source-banner-label">Search Scope:</span>
          <span className="source-tag source-tag-local">Local UI &amp; Workspaces Active</span>
          <span className="source-tag source-tag-remote">
            <Lock size={10} style={{ display: 'inline', marginRight: '3px' }} />
            Remote Data: Standby
          </span>
        </div>

        {/* Results List */}
        <div className="command-results-list" ref={listRef} role="listbox">
          {filteredItems.length === 0 ? (
            <div className="command-empty-results">
              <p>No matching commands or destinations found for &ldquo;{query}&rdquo;</p>
              <span>Try searching for &quot;Projects&quot;, &quot;Magic Mode&quot;, &quot;Theme&quot;, or &quot;Chats&quot;</span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon || ArrowRight;

              return (
                <div
                  key={item.id}
                  className={`command-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="command-item-icon-box">
                    <Icon size={16} />
                  </div>
                  <div className="command-item-info">
                    <div className="command-item-header">
                      <span className="command-item-title">{item.title}</span>
                      <span className={`command-item-badge badge-${item.status}`}>
                        {item.category}
                      </span>
                    </div>
                    <span className="command-item-subtitle">{item.subtitle}</span>
                  </div>
                  {isSelected && (
                    <div className="command-item-enter-hint">
                      <CornerDownLeft size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="command-footer">
          <div className="command-footer-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to open</span>
            <span><kbd>ESC</kbd> to dismiss</span>
          </div>
          <span className="command-footer-brand">ARTI AI Universal Command</span>
        </div>
      </div>
    </div>
  );
};
