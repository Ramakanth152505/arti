import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Paperclip, Send, Square } from 'lucide-react';
import { SPRING } from '../../motion/tokens';
import { ProcessingIndicator } from '../../motion/primitives';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** A response is in flight; the send control becomes a Stop control. */
  pending?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /** Optional notice rendered under the composer (provider / privacy status). */
  notice?: React.ReactNode;
  onAttach?: () => void;
}

/**
 * Shared conversation composer.
 *
 * Multiline, Enter to send, Shift+Enter for a newline, IME-composition safe,
 * auto-growing up to a cap, with a real disabled state while a reply is in
 * flight. It is the same control in both the Chats workspace and the dedicated
 * conversation workspace.
 *
 * Motion is deliberately restrained: the send/stop control swaps with a short
 * spring and the container lifts a fraction on focus. Nothing moves while the
 * operator types, and the inner field keeps the `.field-integrated` contract so
 * the single-border policy is preserved.
 */
export const Composer: React.FC<ComposerProps> = ({
  value,
  onChange,
  onSubmit,
  pending = false,
  onStop,
  placeholder = 'Type your message to ARTI AI… (Enter to send, Shift+Enter for new line)',
  notice,
  onAttach,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const [focused, setFocused] = useState(false);
  const canSend = value.trim().length > 0;

  // Grow with content up to the CSS max-height, then scroll.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  const submit = () => {
    if (!canSend || pending) return;
    onSubmit(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    // Never submit mid-composition (CJK / dead-key input).
    if (composing.current || (e.nativeEvent as KeyboardEvent).isComposing) return;
    e.preventDefault();
    submit();
  };

  return (
    <div className="chat-composer-container">
      <motion.form
        className="chat-composer-box"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        animate={{ y: focused && !pending ? -1 : 0 }}
        transition={SPRING.snappy}
      >
        {onAttach && (
          <button
            type="button"
            className="chat-attachment-btn"
            title="Attach File or Code Reference"
            aria-label="Attach file"
            onClick={onAttach}
          >
            <Paperclip size={16} aria-hidden="true" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          className="chat-composer-textarea field-integrated"
          placeholder={placeholder}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          aria-label="Message ARTI AI"
        />

        {/* Live processing indicator, driven by the real request lifecycle. */}
        <AnimatePresence initial={false}>
          {pending && (
            <motion.span
              className="chat-composer-pending"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRING.snappy}
            >
              <ProcessingIndicator compact label="Generating response" />
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {pending ? (
            <motion.button
              key="stop"
              type="button"
              className="chat-stop-btn"
              title="Stop generating"
              aria-label="Stop generating"
              onClick={onStop}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              whileTap={{ scale: 0.9 }}
              transition={SPRING.snappy}
            >
              <Square size={13} aria-hidden="true" />
            </motion.button>
          ) : (
            <motion.button
              key="send"
              type="submit"
              className="chat-send-btn"
              disabled={!canSend}
              title="Send Message"
              aria-label="Send message"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              whileTap={{ scale: 0.92 }}
              transition={SPRING.snappy}
            >
              <Send size={15} aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.form>

      {notice && <div className="chat-composer-notice">{notice}</div>}
    </div>
  );
};
