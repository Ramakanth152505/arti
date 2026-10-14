/**
 * ARTI AI — Music Studio language picker.
 *
 * Searchable language selection with native-script names. It shows the real
 * *vocal* capability of each language: `declared` when the provider has said it
 * can sing it, `unknown` otherwise. It never claims a language is supported when
 * the provider has not declared it.
 */
import React, { useMemo, useState } from 'react';
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { languagesWithVocalCapability, languageLabel } from '../../services/musicLanguages';
import type { MusicCapabilityProfile } from '../../services/musicProvider';

interface LanguagePickerProps {
  language: string;
  onLanguage: (code: string) => void;
  capability: MusicCapabilityProfile;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ language, onLanguage, capability }) => {
  const [query, setQuery] = useState('');

  const declared = Array.isArray(capability.vocalLanguages) ? capability.vocalLanguages : null;
  const languages = useMemo(() => languagesWithVocalCapability(declared), [declared]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (l) => l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.includes(q)
    );
  }, [languages, query]);

  return (
    <div className="music-lang-picker">
      <div className="music-mode-search">
        <Search size={14} aria-hidden="true" />
        <input
          type="text"
          className="field-integrated"
          placeholder="Search languages…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search languages"
        />
      </div>

      {declared === null && (
        <p className="music-lang-note" role="note">
          <AlertCircle size={13} aria-hidden="true" />
          The connected provider has not declared which languages it can sing. Every language is therefore
          shown as <strong>unverified</strong>; ARTI will not silently substitute a different language.
        </p>
      )}

      <div className="music-lang-list">
        {filtered.map((l) => {
          const verified = l.vocalCapability === 'declared';
          return (
            <button
              key={l.code}
              type="button"
              className={`music-lang-row ${language === l.code ? 'active' : ''}`}
              onClick={() => onLanguage(l.code)}
              aria-pressed={language === l.code}
              dir={l.dir}
            >
              <span className="music-lang-name">
                {l.name}
                {l.native !== l.name && <span className="music-lang-native"> · {l.native}</span>}
              </span>
              <span className={`music-lang-status ${verified ? 'verified' : 'unknown'}`}>
                {verified ? <CheckCircle2 size={12} aria-hidden="true" /> : <AlertCircle size={12} aria-hidden="true" />}
                {verified ? 'Singable' : 'Unverified'}
              </span>
            </button>
          );
        })}
      </div>

      <p className="music-style-hint">Selected: {languageLabel(language)}</p>
    </div>
  );
};

export default LanguagePicker;
