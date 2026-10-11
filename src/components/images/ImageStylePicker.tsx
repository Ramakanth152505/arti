import React, { useMemo, useState } from 'react';
import { Search, X, Check, Palette, AlertCircle } from 'lucide-react';
import {
  STYLE_CATEGORIES,
  searchStyles,
  type ImageStyle,
  type StyleCategoryId,
} from '../../services/imageStyles';

interface ImageStylePickerProps {
  isOpen: boolean;
  activeStyleId?: string;
  onSelect: (style: ImageStyle) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * Premium style-selection interface.
 *
 * Searchable, category-filtered, data-driven. Each tile shows a labelled
 * style-preview swatch (a real CSS illustration, not a fabricated generated
 * image) with lazy-loaded thumbnail rendering. Selecting a style closes the
 * picker; the caller applies the style's prompt guidance to the composer.
 */
export const ImageStylePicker: React.FC<ImageStylePickerProps> = ({
  isOpen,
  activeStyleId,
  onSelect,
  onClear,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StyleCategoryId | 'all'>('all');

  const results = useMemo(() => {
    const base = searchStyles(query);
    return category === 'all' ? base : base.filter((s) => s.category === category);
  }, [query, category]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container style-picker-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-picker-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="style-picker-title" className="dialog-title">
              <Palette size={16} aria-hidden="true" /> Choose Style
            </h2>
            <p className="dialog-description">
              Styles add real visual guidance to your prompt. Preview tiles are labelled style swatches,
              not generated images.
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
              placeholder="Search styles… (e.g. watercolor, cyberpunk, portrait)"
              aria-label="Search styles"
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
            {STYLE_CATEGORIES.map((c) => (
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
              <span className="style-picker-active-label">
                <Check size={12} aria-hidden="true" /> Style applied to this conversation
              </span>
              <button type="button" className="gold-ghost-btn small" onClick={onClear}>
                Remove style
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="style-picker-empty">
              <AlertCircle size={22} aria-hidden="true" />
              <p>No styles match “{query}”.</p>
            </div>
          ) : (
            <div className="style-grid">
              {results.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`style-tile ${activeStyleId === style.id ? 'active' : ''}`}
                  onClick={() => onSelect(style)}
                  aria-pressed={activeStyleId === style.id}
                  title={style.description}
                >
                  <span
                    className="style-tile-preview"
                    style={{
                      background: `linear-gradient(135deg, ${style.swatch[0]} 0%, ${style.swatch[1]} 100%)`,
                    }}
                    aria-hidden="true"
                  >
                    <span className="style-tile-preview-label">{style.name}</span>
                  </span>
                  <span className="style-tile-body">
                    <span className="style-tile-name">{style.name}</span>
                    <span className="style-tile-desc">{style.description}</span>
                  </span>
                  {activeStyleId === style.id && (
                    <span className="style-tile-check" aria-hidden="true">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
