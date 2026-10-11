import React, { useMemo, useState } from 'react';
import { Search, X, Clapperboard, Check, Layers } from 'lucide-react';
import {
  VIDEO_TYPE_CATEGORIES,
  VIDEO_TYPES,
  type VideoTypeDef,
} from '../../services/videoTypes';

interface VideoTypePickerProps {
  isOpen: boolean;
  activeTypeId?: string;
  onSelect: (type: VideoTypeDef) => void;
  onClose: () => void;
}

/**
 * Expandable video-type selector.
 *
 * Video type describes what is being produced and how the production is
 * organised — it is a separate control from style. Types flagged `structured`
 * (series, seasons, franchises) route the request to the Series & Franchise
 * Studio; the picker says so plainly on each tile.
 */
export const VideoTypePicker: React.FC<VideoTypePickerProps> = ({
  isOpen,
  activeTypeId,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VIDEO_TYPE_CATEGORIES.map((cat) => ({
      cat,
      items: VIDEO_TYPES.filter(
        (t) =>
          t.category === cat.id &&
          (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container video-type-picker-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-type-picker-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="video-type-picker-title" className="dialog-title">
              <Clapperboard size={16} aria-hidden="true" /> Choose Video Type
            </h2>
            <p className="dialog-description">
              Type describes what you are producing and how it is organised. Structured types open the
              Series &amp; Franchise Studio; standalone types generate one video.
            </p>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close type picker">
            <X size={16} />
          </button>
        </div>

        <div className="style-picker-toolbar">
          <div className="style-picker-search">
            <Search size={14} className="style-picker-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="style-picker-search-input field-integrated"
              placeholder="Search types… (e.g. series, feature, trailer)"
              aria-label="Search video types"
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
        </div>

        <div className="dialog-body video-type-picker-body">
          {groups.length === 0 ? (
            <p className="style-picker-empty">No types match “{query}”.</p>
          ) : (
            groups.map(({ cat, items }) => (
              <section key={cat.id} className="video-type-group" aria-label={cat.label}>
                <h3 className="video-type-group-title">{cat.label}</h3>
                <p className="video-type-group-desc">{cat.description}</p>
                <div className="video-type-grid">
                  {items.map((t) => {
                    const isActive = t.id === activeTypeId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`video-type-tile ${isActive ? 'active' : ''} ${t.structured ? 'structured' : ''}`}
                        onClick={() => onSelect(t)}
                        aria-pressed={isActive}
                        title={t.description}
                      >
                        <span className="video-type-tile-top">
                          <span className="video-type-name">{t.name}</span>
                          {isActive && <Check size={13} className="video-type-check" aria-hidden="true" />}
                        </span>
                        <span className="video-type-desc">{t.description}</span>
                        {t.structured && (
                          <span className="video-type-structured-badge">
                            <Layers size={10} aria-hidden="true" /> Structured production
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
