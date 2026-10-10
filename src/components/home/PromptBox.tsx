import React, { useState } from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const PromptBox: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const { navigate, setInitialChatPrompt } = useWorkspace();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    // Real transition to Chats workspace with the submitted prompt
    setInitialChatPrompt(trimmed);
    navigate('chats', { prompt: encodeURIComponent(trimmed) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="prompt-box-wrapper">
      <form onSubmit={handleSubmit} className="prompt-box" role="form">
        <Sparkles className="prompt-spark-icon" size={18} />
        <input
          type="text"
          className="prompt-input"
          placeholder="Ask ARTI anything, create a project, or synthesize ideas..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="ARTI AI prompt input"
        />
        <button
          type="submit"
          className="prompt-send-btn"
          title="Send to Intelligent Workspace (Enter)"
          aria-label="Send prompt"
          disabled={!prompt.trim()}
          style={{ opacity: prompt.trim() ? 1 : 0.6 }}
        >
          <ArrowUp size={18} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
};
