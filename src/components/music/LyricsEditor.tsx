/**
 * ARTI AI — Music Studio lyrics editor.
 *
 * Generates, edits and regenerates original lyrics; supports user-provided
 * lyrics, verse/chorus/bridge/intro/outro structure and duet voice assignment.
 * Transliteration and translation are optional, separate actions that never
 * replace the original silently.
 *
 * Honesty: lyrics come from the language-model boundary (`musicLyrics`); when no
 * model is connected this panel says so and offers the user-lyrics path instead.
 * It never fabricates lyrics and presents them as real.
 */
import React, { useState } from 'react';
import { Sparkles, RefreshCw, Languages, Trash2, Wand2 } from 'lucide-react';
import {
  SONG_SECTIONS,
  DUET_ARRANGEMENTS,
  type DuetArrangement,
  type LyricSection,
  type SongSectionId,
  type VocalType,
} from '../../services/musicTypes';
import {
  writeLyrics,
  rewriteSection,
  transformLyricsText,
  type LyricsRequest,
} from '../../services/musicLyrics';
import { isAiConfigured } from '../../services/aiService';
import { languageLabel } from '../../services/musicLanguages';

interface LyricsEditorProps {
  language: string;
  vocalType: VocalType;
  theme: string;
  mood: string;
  structure: SongSectionId[];
  lyricsText: string;
  sections: LyricSection[];
  onLyricsText: (text: string) => void;
  onSections: (sections: LyricSection[]) => void;
  onStructure: (structure: SongSectionId[]) => void;
  onNotify: (message: string, type: 'success' | 'warning' | 'error' | 'info' | 'gold') => void;
}

function parsePlain(text: string): LyricSection[] {
  const lines = text.split('\n');
  const out: LyricSection[] = [];
  let current: LyricSection | null = null;
  let n = 0;
  const heading = /^\s*\[([^\]]+?)\]\s*(?:\[?(MALE|FEMALE|BOTH)\]?)?\s*$/i;
  for (const line of lines) {
    const t = line.trim();
    const m = t.match(heading);
    if (m) {
      if (current) out.push({ ...current, text: current.text.trim() });
      n += 1;
      const name = m[1].toLowerCase();
      const section = SONG_SECTIONS.find((s) => name.startsWith(s.id) || name.startsWith(s.label.toLowerCase()))?.id ?? 'verse';
      current = {
        id: `lyr_${Date.now()}_${n}`,
        section,
        label: m[1],
        text: '',
        voice: m[2] ? (m[2].toLowerCase() as 'male' | 'female' | 'both') : undefined,
      };
    } else if (t) {
      if (!current) {
        n += 1;
        current = { id: `lyr_${Date.now()}_${n}`, section: 'verse', text: '' };
      }
      current.text += (current.text ? '\n' : '') + t;
    }
  }
  if (current) out.push({ ...current, text: current.text.trim() });
  return out.filter((s) => s.text.length > 0);
}

export const LyricsEditor: React.FC<LyricsEditorProps> = ({
  language,
  vocalType,
  theme,
  mood,
  structure,
  lyricsText,
  sections,
  onLyricsText,
  onSections,
  onStructure,
  onNotify,
}) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [duetArrangement, setDuetArrangement] = useState<DuetArrangement>('shared-chorus');
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [translitTarget, setTranslitTarget] = useState('Latin script');
  const [translitResult, setTranslitResult] = useState<string | null>(null);
  const connected = isAiConfigured();
  const isDuet = vocalType === 'duet';

  const req = (): LyricsRequest => ({
    theme,
    language,
    structure,
    vocalType: vocalType === 'instrumental' ? 'female' : vocalType,
    duetArrangement,
    mood,
  });

  const handleGenerate = async () => {
    if (!connected) {
      onNotify('No language model is connected, so lyrics cannot be written. Paste your own lyrics instead.', 'warning');
      return;
    }
    setBusy('generate');
    const controller = new AbortController();
    try {
      const result = await writeLyrics(req(), controller.signal);
      if (!result.ok) {
        onNotify(result.reason, 'error');
        return;
      }
      onSections(result.sections);
      onLyricsText(result.plain);
      onNotify('Original lyrics written. Review and edit before generating music.', 'success');
    } finally {
      setBusy(null);
    }
  };

  const handleRewrite = async (section: LyricSection) => {
    if (!connected) {
      onNotify('No language model is connected, so this section cannot be rewritten.', 'warning');
      return;
    }
    setBusy(section.id);
    const controller = new AbortController();
    try {
      const result = await rewriteSection(req(), section, rewriteInstruction, controller.signal);
      if (!result.ok) {
        onNotify(result.reason, 'error');
        return;
      }
      const updated = sections.map((s) => (s.id === section.id ? result.sections[0] : s));
      onSections(updated);
      onLyricsText(
        updated
          .map((s) => `[${s.label ?? s.section}]${s.voice ? ` [${s.voice.toUpperCase()}]` : ''}\n${s.text}`)
          .join('\n\n')
      );
      onNotify('Section rewritten.', 'success');
    } finally {
      setBusy(null);
    }
  };

  const handleTransform = async (kind: 'transliterate' | 'translate') => {
    if (!lyricsText.trim()) {
      onNotify('There are no lyrics to process yet.', 'warning');
      return;
    }
    if (!connected) {
      onNotify(`No language model is connected, so ${kind} is unavailable.`, 'warning');
      return;
    }
    setBusy(kind);
    const controller = new AbortController();
    try {
      const result = await transformLyricsText(lyricsText, translitTarget, kind, controller.signal);
      if (!result.ok) {
        onNotify(result.reason, 'error');
        return;
      }
      setTranslitResult(result.text);
      onNotify(`${kind === 'translate' ? 'Translation' : 'Transliteration'} ready below — the original is unchanged.`, 'info');
    } finally {
      setBusy(null);
    }
  };

  const handleUseTranslit = () => {
    if (!translitResult) return;
    onLyricsText(translitResult);
    onSections(parsePlain(translitResult));
    setTranslitResult(null);
    onNotify('Replaced the lyrics with the processed version.', 'info');
  };

  return (
    <div className="music-lyrics-editor">
      {!connected && (
        <p className="music-lang-note" role="note">
          No language model is connected. ARTI cannot write lyrics here — paste your own lyrics into the box
          below, or connect a model in Settings &gt; Connected Services.
        </p>
      )}

      <div className="music-lyrics-toolbar">
        <button
          type="button"
          className="gold-ghost-btn"
          onClick={handleGenerate}
          disabled={busy !== null}
          title="Write original lyrics from the theme"
        >
          <Sparkles size={14} aria-hidden="true" />
          <span>{busy === 'generate' ? 'Writing…' : 'Write original lyrics'}</span>
        </button>

        <label className="music-lyrics-structure-label">
          Structure
          <select
            className="form-select"
            multiple
            size={3}
            value={structure}
            onChange={(e) => onStructure(Array.from(e.target.selectedOptions).map((o) => o.value as SongSectionId))}
            aria-label="Song structure"
          >
            {SONG_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {isDuet && (
          <label className="music-lyrics-structure-label">
            Duet arrangement
            <select
              className="form-select"
              value={duetArrangement}
              onChange={(e) => setDuetArrangement(e.target.value as DuetArrangement)}
              aria-label="Duet arrangement"
            >
              {DUET_ARRANGEMENTS.map((d) => (
                <option key={d.id} value={d.id} title={d.description}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isDuet && (
        <p className="music-style-hint">
          Duet: male and female leads. Section voice tags (MALE / FEMALE / BOTH) are sent to the provider. Where the
          provider cannot deliver independent male/female voices, it is reported rather than claimed.
        </p>
      )}

      <label className="music-field-label" htmlFor="music-lyrics-body">
        Lyrics — original, in {languageLabel(language)} (visible before submission)
      </label>
      <textarea
        id="music-lyrics-body"
        className="form-textarea music-lyrics-textarea"
        rows={10}
        dir={language === 'ur' || language === 'ar' || language === 'fa' || language === 'he' ? 'rtl' : 'ltr'}
        value={lyricsText}
        onChange={(e) => {
          onLyricsText(e.target.value);
          onSections(parsePlain(e.target.value));
        }}
        placeholder="[Intro]&#10;…&#10;[Verse 1] [MALE]&#10;…&#10;[Chorus] [BOTH]&#10;…"
      />

      {sections.length > 0 && (
        <div className="music-lyrics-sections">
          <div className="music-lyrics-rewrite-row">
            <input
              type="text"
              className="form-input field-integrated"
              placeholder="Optional direction for section rewrites…"
              value={rewriteInstruction}
              onChange={(e) => setRewriteInstruction(e.target.value)}
              aria-label="Rewrite direction"
            />
          </div>
          {sections.map((s) => (
            <div key={s.id} className="music-lyrics-section-row">
              <span className="music-lyrics-section-name">
                {s.label ?? s.section}
                {s.voice ? ` · ${s.voice}` : ''}
              </span>
              <button
                type="button"
                className="music-chip-clear"
                onClick={() => handleRewrite(s)}
                disabled={busy !== null}
                title="Regenerate this section"
                aria-label={`Regenerate ${s.label ?? s.section}`}
              >
                <RefreshCw size={12} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="music-chip-clear"
                onClick={() => {
                  const updated = sections.filter((x) => x.id !== s.id);
                  onSections(updated);
                  onLyricsText(
                    updated
                      .map((x) => `[${x.label ?? x.section}]${x.voice ? ` [${x.voice.toUpperCase()}]` : ''}\n${x.text}`)
                      .join('\n\n')
                  );
                }}
                title="Remove this section"
                aria-label={`Remove ${s.label ?? s.section}`}
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="music-lyrics-transform">
        <div className="music-custom-style-row">
          <input
            type="text"
            className="form-input field-integrated"
            value={translitTarget}
            onChange={(e) => setTranslitTarget(e.target.value)}
            aria-label="Transliteration or translation target"
          />
          <button
            type="button"
            className="gold-ghost-btn"
            onClick={() => handleTransform('transliterate')}
            disabled={busy !== null}
            title="Render the lyrics in Latin script"
          >
            <Languages size={13} aria-hidden="true" />
            <span>Transliterate</span>
          </button>
          <button
            type="button"
            className="gold-ghost-btn"
            onClick={() => handleTransform('translate')}
            disabled={busy !== null}
            title="Translate the lyrics"
          >
            <Wand2 size={13} aria-hidden="true" />
            <span>Translate</span>
          </button>
        </div>
        {translitResult && (
          <div className="music-translit-result">
            <p className="music-translit-note">Optional result — the original lyrics are preserved.</p>
            <pre className="music-translit-text">{translitResult}</pre>
            <div className="music-translit-actions">
              <button type="button" className="gold-ghost-btn" onClick={handleUseTranslit}>
                Use this version
              </button>
              <button type="button" className="music-chip-clear" onClick={() => setTranslitResult(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="music-style-hint">
        Lyrics are original. ARTI will not reproduce copyrighted lyrics or claim they came from a professional
        songwriter.
      </p>
    </div>
  );
};

export default LyricsEditor;
