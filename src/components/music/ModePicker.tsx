/**
 * ARTI AI — Music Studio mode picker.
 *
 * The twelve creation modes, grouped and searchable. Selecting a mode only
 * sets the mode — it never claims the provider supports it. The capability
 * boundary decides that at generation time and reports honestly.
 */
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { MUSIC_MODES, type MusicModeDef, type MusicModeId } from '../../services/musicTypes';

interface ModePickerProps {
  activeMode: MusicModeId;
  onSelect: (mode: MusicModeId) => void;
}

const GROUP_ORDER: MusicModeDef['group'][] = ['vocals', 'lyrics', 'instrumental', 'specialist', 'custom'];
const GROUP_LABELS: Record<MusicModeDef['group'], string> = {
  vocals: 'Songs with vocals',
  lyrics: 'Lyrics',
  instrumental: 'Instrumental & background',
  specialist: 'Specialist styles',
  custom: 'Custom',
};

export const ModePicker: React.FC<ModePickerProps> = ({ activeMode, onSelect }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MUSIC_MODES;
    return MUSIC_MODES.filter(
      (m) => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="music-mode-picker">
      <div className="music-mode-search">
        <Search size={14} aria-hidden="true" />
        <input
          type="text"
          className="field-integrated"
          placeholder="Search creation modes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search creation modes"
        />
      </div>

      {filtered.length === 0 && <p className="music-empty-note">No mode matches “{query}”.</p>}

      {GROUP_ORDER.map((group) => {
        const modes = filtered.filter((m) => m.group === group);
        if (modes.length === 0) return null;
        return (
          <div key={group} className="music-mode-group">
            <h4 className="music-mode-group-title">{GROUP_LABELS[group]}</h4>
            <div className="music-mode-grid">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`music-mode-tile ${m.id === activeMode ? 'active' : ''}`}
                  onClick={() => onSelect(m.id)}
                  aria-pressed={m.id === activeMode}
                  title={m.guidance}
                >
                  <span className="music-mode-tile-label">{m.label}</span>
                  <span className="music-mode-tile-desc">{m.description}</span>
                  <span className="music-mode-tile-tags">
                    {m.producesAudio ? <span className="music-tag">Audio</span> : <span className="music-tag alt">Text only</span>}
                    {m.instrumentalOnly && <span className="music-tag">Instrumental</span>}
                    {m.expectsVocals && <span className="music-tag">Vocals</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModePicker;
