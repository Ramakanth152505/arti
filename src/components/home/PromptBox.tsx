import React, { useState } from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const PromptBox: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const { navigate } = useWorkspace();

  const submit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    // Open the dedicated conversation workspace; the initial prompt travels in
    // the URL so it is never lost during navigation and is sent there.
    navigate('conversation', { prompt: encodeURIComponent(trimmed) });
    setPrompt('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    submit();
  };

  return (
    <div className="prompt-box-wrapper">
      <form onSubmit={handleSubmit} className="prompt-box" role="form">
        <Sparkles className="prompt-spark-icon" size={18} aria-hidden="true" />
        <input
          type="text"
          className="prompt-input field-integrated"
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
          <ArrowUp size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
};
