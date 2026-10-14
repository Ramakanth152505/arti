/**
 * ARTI AI — Music Studio style picker.
 *
 * A searchable, family-grouped catalog of genres, instruments, moods and
 * rhythms, plus recently-used styles and a custom free-text style. Combining is
 * explicitly allowed. Nothing here asserts that the provider supports the
 * combination — that is decided (and reported honestly) at generation time.
 */
import React, { useMemo, useState } from 'react';
import { Search, Star, Plus, X } from 'lucide-react';
import {
  GENRE_FAMILIES,
  INSTRUMENTS,
  MOODS,
  ENERGIES,
  RHYTHMS,
  MUSIC_GENRES,
  getGenre,
  getRecentGenres,
  rememberGenre,
  labelFor,
  type NamedDef,
} from '../../services/musicStyles';

interface StylePickerProps {
  genre: string;
  onGenre: (id: string) => void;
  instruments: string[];
  onInstruments: (ids: string[]) => void;
  mood: string;
  onMood: (id: string) => void;
  energy: string;
  onEnergy: (id: string) => void;
  rhythm: string;
  onRhythm: (id: string) => void;
  customStyle: string;
  onCustomStyle: (value: string) => void;
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

const InstrumentChips: React.FC<{ list: NamedDef[]; selected: string[]; onToggle: (id: string) => void }> = ({
  list,
  selected,
  onToggle,
}) => (
  <div className="music-chip-wrap">
    {list.map((i) => (
      <button
        key={i.id}
        type="button"
        className={`music-chip ${selected.includes(i.id) ? 'active' : ''}`}
        onClick={() => onToggle(i.id)}
        aria-pressed={selected.includes(i.id)}
      >
        {i.label}
      </button>
    ))}
  </div>
);

export const StylePicker: React.FC<StylePickerProps> = ({
  genre,
  onGenre,
  instruments,
  onInstruments,
  mood,
  onMood,
  energy,
  onEnergy,
  rhythm,
  onRhythm,
  customStyle,
  onCustomStyle,
}) => {
  const [query, setQuery] = useState('');
  const recent = useMemo(() => getRecentGenres(), []);

  const filteredGenres = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MUSIC_GENRES;
    return MUSIC_GENRES.filter(
      (g) => g.label.toLowerCase().includes(q) || g.hint.toLowerCase().includes(q) || g.family.toLowerCase().includes(q)
    );
  }, [query]);

  const compatible = getGenre(genre)?.compatibleWith ?? [];

  return (
    <div className="music-style-picker">
      <div className="music-mode-search">
        <Search size={14} aria-hidden="true" />
        <input
          type="text"
          className="field-integrated"
          placeholder="Search genres, moods, instruments…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search styles"
        />
      </div>

      {recent.length > 0 && (
        <div className="music-style-section">
          <h4 className="music-style-subhead">
            <Star size={12} aria-hidden="true" /> Recently used
          </h4>
          <div className="music-chip-wrap">
            {recent.map((id) => (
              <button
                key={id}
                type="button"
                className={`music-chip ${genre === id ? 'active' : ''}`}
                onClick={() => onGenre(id)}
              >
                {getGenre(id)?.label ?? id}
              </button>
            ))}
          </div>
        </div>
      )}

      {compatible.length > 0 && (
        <div className="music-style-section">
          <h4 className="music-style-subhead">Pairs well with</h4>
          <div className="music-chip-wrap">
            {compatible
              .map((id) => getGenre(id))
              .filter((g): g is NonNullable<typeof g> => Boolean(g))
              .map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`music-chip ${genre === g.id ? 'active' : ''}`}
                  onClick={() => {
                    onGenre(g.id);
                    rememberGenre(g.id);
                  }}
                  title={g.hint}
                >
                  {g.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {GENRE_FAMILIES.map((family) => {
        const genres = filteredGenres.filter((g) => g.family === family);
        if (genres.length === 0) return null;
        return (
          <div key={family} className="music-style-section">
            <h4 className="music-style-subhead">{family}</h4>
            <div className="music-chip-wrap">
              {genres.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`music-chip ${genre === g.id ? 'active' : ''}`}
                  onClick={() => {
                    onGenre(g.id);
                    rememberGenre(g.id);
                  }}
                  title={g.hint}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="music-style-section">
        <h4 className="music-style-subhead">Custom style</h4>
        <div className="music-custom-style-row">
          <input
            type="text"
            className="form-input field-integrated"
            placeholder="Describe a style in your own words…"
            value={customStyle}
            onChange={(e) => onCustomStyle(e.target.value)}
            aria-label="Custom style"
          />
          {customStyle && (
            <button
              type="button"
              className="music-chip-clear"
              onClick={() => onCustomStyle('')}
              title="Clear custom style"
              aria-label="Clear custom style"
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="music-style-section">
        <h4 className="music-style-subhead">Mood</h4>
        <div className="music-chip-wrap">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`music-chip ${mood === m.id ? 'active' : ''}`}
              onClick={() => onMood(m.id)}
              aria-pressed={mood === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="music-style-section">
        <h4 className="music-style-subhead">Energy</h4>
        <div className="music-chip-wrap">
          {ENERGIES.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`music-chip ${energy === e.id ? 'active' : ''}`}
              onClick={() => onEnergy(e.id)}
              aria-pressed={energy === e.id}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="music-style-section">
        <h4 className="music-style-subhead">Rhythm</h4>
        <div className="music-chip-wrap">
          <button
            type="button"
            className={`music-chip ${rhythm === '' ? 'active' : ''}`}
            onClick={() => onRhythm('')}
          >
            Unspecified
          </button>
          {RHYTHMS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`music-chip ${rhythm === r.id ? 'active' : ''}`}
              onClick={() => onRhythm(r.id)}
              aria-pressed={rhythm === r.id}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="music-style-section">
        <h4 className="music-style-subhead">
          <Plus size={12} aria-hidden="true" /> Instruments
        </h4>
        <InstrumentChips
          list={INSTRUMENTS}
          selected={instruments}
          onToggle={(id) => onInstruments(toggle(instruments, id))}
        />
        {instruments.length > 0 && (
          <p className="music-style-hint">
            Selected: {instruments.map((id) => labelFor(INSTRUMENTS, id)).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default StylePicker;
