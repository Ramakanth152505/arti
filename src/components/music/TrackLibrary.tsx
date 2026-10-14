/**
 * ARTI AI — Music Studio track library.
 *
 * Every track record with its real metadata: title, mode, provider/model,
 * language, style, duration, creation date, provenance and status. Actions:
 * select, rename, favourite, delete, download, and transform. A track is only
 * shown as playable when a real audio asset exists; blocked/failed records are
 * labelled honestly.
 */
import React, { useState } from 'react';
import { Play, Pause, Star, Trash2, Pencil, Download, Music2, GitBranch, Clock } from 'lucide-react';
import { formatDuration, getMode, PROVENANCE_LABELS } from '../../services/musicTypes';
import { getGenre } from '../../services/musicStyles';
import { languageLabel } from '../../services/musicLanguages';
import type { GeneratedTrackRecord } from '../../services/chatStore';

interface TrackLibraryProps {
  tracks: GeneratedTrackRecord[];
  activeId: string;
  playingId: string | null;
  onSelect: (id: string) => void;
  onPlayToggle: (track: GeneratedTrackRecord) => void;
  onRename: (track: GeneratedTrackRecord) => void;
  onFavorite: (track: GeneratedTrackRecord) => void;
  onDelete: (track: GeneratedTrackRecord) => void;
  onDownload: (track: GeneratedTrackRecord) => void;
  onTransform: (track: GeneratedTrackRecord) => void;
}

function statusLabel(track: GeneratedTrackRecord): string {
  if (track.status === 'complete') return 'Ready';
  if (track.status === 'blocked') return 'Blocked';
  return 'Failed';
}

export const TrackLibrary: React.FC<TrackLibraryProps> = ({
  tracks,
  activeId,
  playingId,
  onSelect,
  onPlayToggle,
  onRename,
  onFavorite,
  onDelete,
  onDownload,
  onTransform,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = filter.trim()
    ? tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(filter.toLowerCase()) ||
          t.genre.toLowerCase().includes(filter.toLowerCase()) ||
          t.language.toLowerCase().includes(filter.toLowerCase())
      )
    : tracks;

  return (
    <div className="music-library">
      <div className="music-library-head">
        <h3 className="music-library-title">
          <Music2 size={15} aria-hidden="true" /> Track library
        </h3>
        <span className="music-library-count">{tracks.length} track{tracks.length === 1 ? '' : 's'}</span>
      </div>

      {tracks.length > 4 && (
        <input
          type="text"
          className="form-input field-integrated"
          placeholder="Filter by title, style or language…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter tracks"
        />
      )}

      {filtered.length === 0 && <p className="music-empty-note">No tracks match.</p>}

      <ul className="music-library-list">
        {filtered.map((t) => {
          const selected = t.id === activeId;
          const playing = t.id === playingId;
          const playable = Boolean(t.audioUrl) && t.status === 'complete';
          return (
            <li
              key={t.id}
              className={`music-library-row ${selected ? 'selected' : ''} status-${t.status}`}
              onClick={() => onSelect(t.id)}
            >
              <button
                type="button"
                className="music-library-play"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayToggle(t);
                }}
                disabled={!playable}
                aria-label={playing ? 'Pause' : 'Play'}
                title={playable ? (playing ? 'Pause' : 'Play') : 'No playable audio for this track'}
              >
                {playing ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
              </button>

              <div className="music-library-body">
                <div className="music-library-row-top">
                  <span className="music-library-row-title">{t.title}</span>
                  <span className={`music-library-status status-${t.status}`}>{statusLabel(t)}</span>
                  {t.favorite && <Star size={12} className="music-library-fav" aria-label="Favourite" />}
                </div>
                <div className="music-library-row-meta">
                  <span>{getMode(t.mode as never).label}</span>
                  <span>·</span>
                  <span>{getGenre(t.genre)?.label ?? (t.genre || '—')}</span>
                  <span>·</span>
                  <span>{languageLabel(t.language)}</span>
                  <span>·</span>
                  <span>
                    <Clock size={10} aria-hidden="true" /> {formatDuration(t.durationSeconds)}
                  </span>
                  {t.sourceTrackId && (
                    <>
                      <span>·</span>
                      <span className="music-library-variation">
                        <GitBranch size={10} aria-hidden="true" /> variation
                      </span>
                    </>
                  )}
                </div>
                <div className="music-library-row-provenance" title="Provenance">
                  {PROVENANCE_LABELS[t.provenance]}
                  {t.model ? ` · ${t.providerId}/${t.model}` : ` · ${t.providerId}`}
                  {t.transformMethod ? ` · ${t.transformMethod}` : ''}
                </div>
                {t.status !== 'complete' && t.error && (
                  <p className="music-library-row-error">{t.error}</p>
                )}
              </div>

              <div className="music-library-actions">
                <button
                  type="button"
                  className="music-library-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite(t);
                  }}
                  title={t.favorite ? 'Remove from favourites' : 'Add to favourites'}
                  aria-label="Toggle favourite"
                >
                  <Star size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="music-library-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(t);
                  }}
                  title="Rename"
                  aria-label="Rename track"
                >
                  <Pencil size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="music-library-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(t);
                  }}
                  disabled={!t.audioUrl}
                  title="Download"
                  aria-label="Download track"
                >
                  <Download size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="music-library-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransform(t);
                  }}
                  title="Regenerate or transform"
                  aria-label="Transform track"
                >
                  <GitBranch size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="music-library-action danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t);
                  }}
                  title="Delete"
                  aria-label="Delete track"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TrackLibrary;
