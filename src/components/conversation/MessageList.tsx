import React, { useEffect, useRef } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { ChatMessage } from '../../services/chatStore';

interface MessageListProps {
  messages: ChatMessage[];
  /** Rendered instead of the list when there are no messages. */
  emptyState?: React.ReactNode;
  onRetry?: () => void;
}

/**
 * Speakerless conversation feed.
 *
 * Ownership is conveyed by layout only — user turns sit in a compact surface
 * aligned to the right, assistant turns in a clean surface aligned to the left.
 * No names, avatars, role badges or speaker headings are rendered, and the
 * markup exposes each turn to assistive tech as a labelled list item instead.
 */
export const MessageList: React.FC<MessageListProps> = ({ messages, emptyState, onRetry }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const didMount = useRef(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  const lastStatus = messages[messages.length - 1]?.status;

  // Follow new content only when the reader is already at the bottom, so
  // scrolling up to re-read earlier turns is never interrupted.
  useEffect(() => {
    const behavior: ScrollBehavior = didMount.current ? 'smooth' : 'auto';
    didMount.current = true;
    if (nearBottom.current) {
      endRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, [messages.length, lastStatus]);

  return (
    <div className="chat-messages-container" ref={scrollRef} onScroll={handleScroll}>
      {messages.length === 0 ? (
        emptyState
      ) : (
        <div className="chat-messages-list" role="list" aria-label="Conversation messages">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`chat-message-row ${msg.sender} ${msg.status}`}
                role="listitem"
                aria-label={isUser ? 'Your message' : 'ARTI AI response'}
              >
                <div className="chat-message-bubble">
                  {msg.status === 'sending' ? (
                    <div className="chat-typing" role="status" aria-label="Waiting for response">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : msg.status === 'failed' ? (
                    <div className="chat-message-error" role="alert">
                      <AlertTriangle size={14} aria-hidden="true" />
                      <span>{msg.error || 'The response could not be generated.'}</span>
                      {msg.retryable !== false && onRetry && (
                        <button type="button" className="chat-retry-btn" onClick={onRetry}>
                          <RotateCcw size={12} aria-hidden="true" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="chat-message-text">{msg.content}</div>
                      <span className="chat-msg-time">{msg.timestamp}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
