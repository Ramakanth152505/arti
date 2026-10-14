/**
 * ARTI AI — Music Studio instrumental configuration panel.
 *
 * A dedicated instrumental path that does not require lyrics or vocals.
 * Theme, mood, energy, tempo, rhythm, duration, instruments, arrangement,
 * progression, intro/ending, intensity changes, transitions, prominence and
 * intended use — plus the background-music presets. Independent of the lyrics
 * workflow: selecting an instrumental mode never forces lyrics.
 */
import React from 'react';
import { INSTRUMENTAL_PRESETS } from '../../services/musicProvider';
import { INSTRUMENTS, MOODS, ENERGIES, RHYTHMS, labelFor } from '../../services/musicStyles';
import { formatDuration } from '../../services/musicTypes';

interface InstrumentalPanelProps {
  preset: string;
  onPreset: (id: string) => void;
  theme: string;
  onTheme: (v: string) => void;
  mood: string;
  onMood: (v: string) => void;
  energy: string;
  onEnergy: (v: string) => void;
  tempo: number;
  onTempo: (v: number) => void;
  rhythm: string;
  onRhythm: (v: string) => void;
  durationSeconds: number;
  onDuration: (v: number) => void;
  instruments: string[];
  onInstruments: (ids: string[]) => void;
  progression: string;
  onProgression: (v: string) => void;
  intro: string;
  onIntro: (v: string) => void;
  ending: string;
  onEnding: (v: string) => void;
  intensity: string;
  onIntensity: (v: string) => void;
  transitions: string;
  onTransitions: (v: string) => void;
  backgroundForeground: 'background' | 'foreground';
  onBackgroundForeground: (v: 'background' | 'foreground') => void;
  intendedUse: string;
  onIntendedUse: (v: string) => void;
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const InstrumentalPanel: React.FC<InstrumentalPanelProps> = (props) => {
  const {
    preset, onPreset, theme, onTheme, mood, onMood, energy, onEnergy, tempo, onTempo,
    rhythm, onRhythm, durationSeconds, onDuration, instruments, onInstruments,
    progression, onProgression, intro, onIntro, ending, onEnding, intensity, onIntensity,
    transitions, onTransitions, backgroundForeground, onBackgroundForeground, intendedUse, onIntendedUse,
  } = props;

  return (
    <div className="music-instrumental-panel">
      <h4 className="music-style-subhead">Background &amp; soundtrack presets</h4>
      <div className="music-chip-wrap">
        {INSTRUMENTAL_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`music-chip ${preset === p.id ? 'active' : ''}`}
            onClick={() => onPreset(p.id)}
            aria-pressed={preset === p.id}
            title={p.guidance}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="music-field-label" htmlFor="music-inst-theme">
        Theme / scene
      </label>
      <textarea
        id="music-inst-theme"
        className="form-textarea"
        rows={3}
        value={theme}
        onChange={(e) => onTheme(e.target.value)}
        placeholder="e.g. A slow sunrise over a quiet mountain town…"
      />

      <div className="music-inst-grid">
        <label className="music-field-label">
          Mood
          <select className="form-select" value={mood} onChange={(e) => onMood(e.target.value)}>
            {MOODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="music-field-label">
          Energy
          <select className="form-select" value={energy} onChange={(e) => onEnergy(e.target.value)}>
            {ENERGIES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        <label className="music-field-label">
          Rhythm
          <select className="form-select" value={rhythm} onChange={(e) => onRhythm(e.target.value)}>
            <option value="">Unspecified</option>
            {RHYTHMS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="music-field-label">
          Intended use
          <select className="form-select" value={intendedUse} onChange={(e) => onIntendedUse(e.target.value)}>
            <option value="">Unspecified</option>
            {['Video', 'Podcast', 'Game', 'Film', 'Presentation', 'Social media', 'Advertising'].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-field">
        <label className="form-label">Tempo: {tempo} BPM</label>
        <input
          type="range"
          min="40"
          max="200"
          value={tempo}
          onChange={(e) => onTempo(parseInt(e.target.value, 10))}
          className="range-input"
        />
      </div>

      <div className="form-field">
        <label className="form-label">Duration: {formatDuration(durationSeconds)}</label>
        <input
          type="range"
          min="10"
          max="900"
          step="5"
          value={Math.min(900, durationSeconds)}
          onChange={(e) => onDuration(parseInt(e.target.value, 10))}
          className="range-input"
        />
      </div>

      <label className="music-field-label">Instruments</label>
      <div className="music-chip-wrap">
        {INSTRUMENTS.map((i) => (
          <button
            key={i.id}
            type="button"
            className={`music-chip ${instruments.includes(i.id) ? 'active' : ''}`}
            onClick={() => onInstruments(toggle(instruments, i.id))}
            aria-pressed={instruments.includes(i.id)}
          >
            {i.label}
          </button>
        ))}
      </div>

      <div className="music-inst-grid">
        <label className="music-field-label">
          Arrangement / progression
          <input
            type="text"
            className="form-input field-integrated"
            value={progression}
            onChange={(e) => onProgression(e.target.value)}
            placeholder="e.g. slow build, key change at the bridge"
          />
        </label>
        <label className="music-field-label">
          Intro
          <input
            type="text"
            className="form-input field-integrated"
            value={intro}
            onChange={(e) => onIntro(e.target.value)}
            placeholder="e.g. solo piano, two bars"
          />
        </label>
        <label className="music-field-label">
          Ending
          <input
            type="text"
            className="form-input field-integrated"
            value={ending}
            onChange={(e) => onEnding(e.target.value)}
            placeholder="e.g. fade out, or a resolved cadence"
          />
        </label>
        <label className="music-field-label">
          Intensity changes
          <input
            type="text"
            className="form-input field-integrated"
            value={intensity}
            onChange={(e) => onIntensity(e.target.value)}
            placeholder="e.g. swell at 0:45, drop at 1:20"
          />
        </label>
        <label className="music-field-label">
          Transitions
          <input
            type="text"
            className="form-input field-integrated"
            value={transitions}
            onChange={(e) => onTransitions(e.target.value)}
            placeholder="e.g. smooth crossfade between sections"
          />
        </label>
        <label className="music-field-label">
          Prominence
          <select
            className="form-select"
            value={backgroundForeground}
            onChange={(e) => onBackgroundForeground(e.target.value as 'background' | 'foreground')}
          >
            <option value="background">Background — unobtrusive</option>
            <option value="foreground">Foreground — leads the mix</option>
          </select>
        </label>
      </div>

      <p className="music-style-hint">
        Instrumental generation needs no lyrics. Nothing here is sent to a lyrics model.
        {instruments.length > 0 && ` Selected: ${instruments.map((id) => labelFor(INSTRUMENTS, id)).join(', ')}.`}
      </p>
    </div>
  );
};

export default InstrumentalPanel;
