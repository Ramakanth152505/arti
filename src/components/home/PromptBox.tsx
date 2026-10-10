import React, { useState } from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';

export const PromptBox: React.FC = () => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    // Step 1: Real input state handling without fake backend inference
    console.log('Submitted prompt:', prompt);
    // Keep prompt text or handle state cleanly
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
          placeholder="Type your message here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="ARTI AI prompt input"
        />
        <button
          type="submit"
          className="prompt-send-btn"
          title="Send Prompt"
          aria-label="Send prompt"
        >
          <ArrowUp size={18} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
};
