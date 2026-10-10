import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const SearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="search-bar" role="search">
      <Search className="search-icon" size={15} />
      <input
        type="text"
        className="search-input"
        placeholder="Search anything... (chats, projects, files, tools, knowledge...)"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        aria-label="Search anything"
      />
      <div className="search-shortcut" title="Press Ctrl + K to focus search">
        Ctrl + K
      </div>
    </div>
  );
};
