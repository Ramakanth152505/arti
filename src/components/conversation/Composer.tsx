import React, { useEffect, useRef } from 'react';
import { Paperclip, Send, Square } from 'lucide-react';

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
      <form
        className="chat-composer-box"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
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
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          aria-label="Message ARTI AI"
        />

        {pending ? (
          <button
            type="button"
            className="chat-stop-btn"
            title="Stop generating"
            aria-label="Stop generating"
            onClick={onStop}
          >
            <Square size={13} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!canSend}
            title="Send Message"
            aria-label="Send message"
          >
            <Send size={15} aria-hidden="true" />
          </button>
        )}
      </form>

      {notice && <div className="chat-composer-notice">{notice}</div>}
    </div>
  );
};
