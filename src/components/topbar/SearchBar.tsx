import React from 'react';
import { Search } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const SearchBar: React.FC = () => {
  const { setIsSearchOpen } = useWorkspace();

  return (
    <button
      type="button"
      className="search-bar"
      onClick={() => setIsSearchOpen(true)}
      role="search"
      aria-label="Open global search and command palette"
      title="Search anything... (Ctrl + K)"
    >
      <Search className="search-icon" size={15} />
      <span className="search-placeholder">
        Search anything... (chats, projects, files, tools, knowledge...)
      </span>
      <div className="search-shortcut" title="Press Ctrl + K to focus search">
        Ctrl + K
      </div>
    </button>
  );
};
