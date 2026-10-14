/**
 * ARTI AI — Music Studio transform panel.
 *
 * Lets the user pick a transformation of an existing track and shows exactly
 * what ARTI will do before it starts. For tempo transforms it forces an explicit
 * choice between the three genuinely different operations (playback-speed,
 * pitch-preserving time stretch, AI re-arrangement) instead of treating them as
 * one thing. Time stretch is reported as unavailable until a DSP service exists.
 */
import React, { useState } from 'react';
import { GitBranch, AlertCircle, Info } from 'lucide-react';
import { MUSIC_TRANSFORMS, SPEED_METHODS, type SpeedMethod, type TransformId } from '../../services/musicTypes';
import { getGenre } from '../../services/musicStyles';
import type { GeneratedTrackRecord } from '../../services/chatStore';

interface TransformPanelProps {
  track: GeneratedTrackRecord;
  onApply: (
    transformId: TransformId,
    options: { speedMethod?: SpeedMethod; rate?: number; genre?: string; mood?: string; lyrics?: string }
  ) => void;
  onClose: () => void;
  busy: boolean;
}

export const TransformPanel: React.FC<TransformPanelProps> = ({ track, onApply, onClose, busy }) => {
  const [selected, setSelected] = useState<TransformId>('slower');
  const [speedMethod, setSpeedMethod] = useState<SpeedMethod>('playback-speed');
  const [rate, setRate] = useState(0.8);
  const [genre, setGenre] = useState(track.genre);
  const [mood, setMood] = useState('');
  const [lyrics, setLyrics] = useState(track.lyrics ?? '');

  const transform = MUSIC_TRANSFORMS.find((t) => t.id === selected) ?? MUSIC_TRANSFORMS[0];
  const isTempo = transform.category === 'tempo';
  const isGenre = selected === 'different-genre';
  const isMood = selected === 'different-mood';
  const isLyrics = selected === 'revised-lyrics';

  const apply = () => {
    const options: { speedMethod?: SpeedMethod; rate?: number; genre?: string; mood?: string; lyrics?: string } = {};
    if (isTempo) {
      options.speedMethod = speedMethod;
      options.rate = rate;
    }
    if (isGenre) options.genre = genre;
    if (isMood) options.mood = mood;
    if (isLyrics) options.lyrics = lyrics;
    onApply(selected, options);
  };

  return (
    <div className="music-transform-panel">
      <div className="music-transform-head">
        <h3 className="music-transform-title">
          <GitBranch size={15} aria-hidden="true" /> Regenerate / transform
        </h3>
        <button type="button" className="music-chip-clear" onClick={onClose} aria-label="Close">
          Close
        </button>
      </div>

      <p className="music-transform-source">
        Source: <strong>{track.title}</strong>
      </p>

      <div className="music-chip-wrap">
        {MUSIC_TRANSFORMS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`music-chip ${selected === t.id ? 'active' : ''}`}
            onClick={() => setSelected(t.id)}
            aria-pressed={selected === t.id}
            title={t.description}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="music-transform-detail" role="note">
        <Info size={13} aria-hidden="true" />
        <span>{transform.performs}</span>
      </div>

      {isTempo && (
        <div className="music-transform-methods">
          <h4 className="music-style-subhead">How should the tempo change be produced?</h4>
          {SPEED_METHODS.map((m) => {
            const unavailable = m.id === 'time-stretch';
            return (
              <button
                key={m.id}
                type="button"
                className={`music-transform-method ${speedMethod === m.id ? 'active' : ''}`}
                onClick={() => setSpeedMethod(m.id)}
                aria-pressed={speedMethod === m.id}
              >
                <span className="music-transform-method-label">
                  {m.label}
                  {unavailable && <span className="music-tag alt">Needs an audio service</span>}
                </span>
                <span className="music-transform-method-desc">{m.description}</span>
              </button>
            );
          })}

          {speedMethod === 'playback-speed' && (
            <div className="form-field">
              <label className="form-label">
                Playback rate: {Math.round(rate * 100)}%{' '}
                {rate < 1 ? '(slower — pitch drops)' : '(faster — pitch rises)'}
              </label>
              <input
                type="range"
                min="0.4"
                max="1.8"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="range-input"
              />
            </div>
          )}

          {speedMethod === 'time-stretch' && (
            <p className="music-lang-note" role="note">
              <AlertCircle size={13} aria-hidden="true" />
              Pitch-preserving time stretching requires a real DSP step, which is not connected. Choose
              playback-speed or AI re-arrangement instead.
            </p>
          )}
        </div>
      )}

      {isGenre && (
        <label className="music-field-label">
          Target genre
          <input
            type="text"
            className="form-input field-integrated"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder={getGenre(track.genre)?.label ?? 'e.g. jazz'}
          />
        </label>
      )}

      {isMood && (
        <label className="music-field-label">
          Target mood
          <input
            type="text"
            className="form-input field-integrated"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="e.g. hopeful"
          />
        </label>
      )}

      {isLyrics && (
        <>
          <label className="music-field-label" htmlFor="music-transform-lyrics">
            Revised lyrics
          </label>
          <textarea
            id="music-transform-lyrics"
            className="form-textarea music-lyrics-textarea"
            rows={8}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
          />
        </>
      )}

      <div className="music-transform-actions">
        <button type="button" className="gold-primary-btn" onClick={apply} disabled={busy}>
          {busy ? 'Working…' : 'Create this variation'}
        </button>
        <span className="music-style-hint">The original track is preserved. A new track is created.</span>
      </div>
    </div>
  );
};

export default TransformPanel;
