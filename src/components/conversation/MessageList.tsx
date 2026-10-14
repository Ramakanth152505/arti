import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { AlertTriangle, RotateCcw, Check, Copy } from 'lucide-react';
import type { ChatMessage } from '../../services/chatStore';
import { DUR, EASE, SPRING } from '../../motion/tokens';

interface MessageListProps {
  messages: ChatMessage[];
  /** Rendered instead of the list when there are no messages. */
  emptyState?: React.ReactNode;
  onRetry?: () => void;
  /**
   * Optional content rendered inside the same scroll container, after the
   * message list — used by the Images workspace to keep generated results
   * scrolling together with the conversation.
   */
  footer?: React.ReactNode;
}

/**
 * Copy-to-clipboard feedback. The check mark only appears after the browser
 * confirms the write, so a denied clipboard permission can never produce a
 * false "copied" state.
 */
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions / insecure context): report nothing
      // rather than pretending the copy succeeded.
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className={`chat-copy-btn ${copied ? 'copied' : ''}`}
      onClick={copy}
      aria-label={copied ? 'Copied to clipboard' : 'Copy response'}
      title={copied ? 'Copied' : 'Copy response'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'check' : 'copy'}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: DUR.fast }}
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

/**
 * Speakerless conversation feed.
 *
 * Ownership is conveyed by layout only — user turns sit in a compact surface
 * aligned to the right, assistant turns in a clean surface aligned to the left.
 * No names, avatars, role badges or speaker headings are rendered, and the
 * markup exposes each turn to assistive tech as a labelled list item instead.
 *
 * Each turn animates in on arrival. Reduced motion (handled globally by
 * `MotionConfig`) collapses that to a plain opacity change, so reading is never
 * delayed or disturbed.
 */
export const MessageList: React.FC<MessageListProps> = ({ messages, emptyState, onRetry, footer }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const didMount = useRef(false);
  const reduced = usePrefersReducedMotion();

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  const lastStatus = messages[messages.length - 1]?.status;

  // Follow new content only when the reader is already at the bottom, so
  // scrolling up to re-read earlier turns is never interrupted.
  useEffect(() => {
    const behavior: ScrollBehavior = didMount.current && !reduced ? 'smooth' : 'auto';
    didMount.current = true;
    if (nearBottom.current) {
      endRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, [messages.length, lastStatus, reduced]);

  return (
    <div className="chat-messages-container" ref={scrollRef} onScroll={handleScroll}>
      {messages.length === 0 ? (
        emptyState
      ) : (
        <div className="chat-messages-list" role="list" aria-label="Conversation messages">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <motion.div
                  key={msg.id}
                  className={`chat-message-row ${msg.sender} ${msg.status}`}
                  role="listitem"
                  aria-label={isUser ? 'Your message' : 'ARTI AI response'}
                  layout="position"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.base, ease: EASE.enter }}
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
                          <motion.button
                            type="button"
                            className="chat-retry-btn"
                            onClick={onRetry}
                            whileTap={{ scale: 0.95 }}
                            transition={SPRING.snappy}
                          >
                            <RotateCcw size={12} aria-hidden="true" />
                            <span>Retry</span>
                          </motion.button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="chat-message-text">{msg.content}</div>
                        <div className="chat-message-foot">
                          <span className="chat-msg-time">{msg.timestamp}</span>
                          {!isUser && msg.content && <CopyButton text={msg.content} />}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={endRef} aria-hidden="true" />
        </div>
      )}
      {footer}
    </div>
  );
};
