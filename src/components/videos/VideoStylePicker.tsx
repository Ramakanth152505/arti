import React, { useMemo, useState } from 'react';
import { Search, X, Palette, Check } from 'lucide-react';
import {
  VIDEO_STYLE_CATEGORIES,
  searchVideoStyles,
  type VideoStyle,
  type VideoStyleCategoryId,
} from '../../services/videoStyles';

interface VideoStylePickerProps {
  isOpen: boolean;
  activeStyleId?: string;
  onSelect: (style: VideoStyle) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * Premium video-style selector.
 *
 * Searchable, category-filtered and data-driven. Each tile is a labelled CSS
 * style swatch — never a fabricated generated clip. Selecting a style closes the
 * picker; the caller inserts the style's real prompt guidance into the composer
 * without overwriting the user's text or auto-submitting.
 */
export const VideoStylePicker: React.FC<VideoStylePickerProps> = ({
  isOpen,
  activeStyleId,
  onSelect,
  onClear,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<VideoStyleCategoryId | 'all'>('all');

  const results = useMemo(() => {
    const base = searchVideoStyles(query);
    return category === 'all' ? base : base.filter((s) => s.category === category);
  }, [query, category]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container video-style-picker-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-style-picker-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="video-style-picker-title" className="dialog-title">
              <Palette size={16} aria-hidden="true" /> Choose Video Style
            </h2>
            <p className="dialog-description">
              Styles add real visual guidance to your prompt. Preview tiles are labelled style swatches,
              not generated footage. Style is separate from video type.
            </p>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close style picker">
            <X size={16} />
          </button>
        </div>

        <div className="style-picker-toolbar">
          <div className="style-picker-search">
            <Search size={14} className="style-picker-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="style-picker-search-input field-integrated"
              placeholder="Search styles… (e.g. cyberpunk, documentary, anime)"
              aria-label="Search video styles"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="style-picker-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="style-picker-categories" role="tablist" aria-label="Style categories">
            <button
              type="button"
              role="tab"
              aria-selected={category === 'all'}
              className={`style-category-chip ${category === 'all' ? 'active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {VIDEO_STYLE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                className={`style-category-chip ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
                title={c.description}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dialog-body style-picker-body">
          {activeStyleId && (
            <div className="style-picker-active-row">
              <span className="style-picker-active-label">Current style applied to this conversation</span>
              <button type="button" className="gold-ghost-btn small" onClick={onClear}>
                <X size={12} aria-hidden="true" />
                <span>Remove style</span>
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <p className="style-picker-empty">No styles match “{query}”.</p>
          ) : (
            <div className="style-picker-grid">
              {results.map((style) => {
                const isActive = style.id === activeStyleId;
                return (
                  <button
                    key={style.id}
                    type="button"
                    className={`style-tile ${isActive ? 'active' : ''}`}
                    onClick={() => onSelect(style)}
                    aria-pressed={isActive}
                    title={style.promptGuidance}
                  >
                    <span
                      className="style-tile-swatch"
                      style={{
                        background: `linear-gradient(135deg, ${style.swatch[0]}, ${style.swatch[1]})`,
                      }}
                      aria-hidden="true"
                    >
                      {isActive && <Check size={16} className="style-tile-check" />}
                    </span>
                    <span className="style-tile-name">{style.name}</span>
                    <span className="style-tile-desc">{style.description}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
