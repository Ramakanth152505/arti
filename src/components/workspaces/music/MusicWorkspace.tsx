import React, { useState } from 'react';
import {
  Music as MusicIcon,
  Play,
  Pause,
  Volume2,
  Download,
  Sparkles,
  Disc,
  FileAudio,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { EmptyState } from '../../common/EmptyState';
import { DemoDataNotice } from '../../common/DemoDataNotice';
import { useToast } from '../../../context/ToastContext';

interface TrackItem {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  duration: string;
  keySignature: string;
  instruments: string[];
  /** Set only when a real, playable audio artifact exists. Demonstrations have none. */
  audioUrl?: string;
}

const DEMO_TRACKS: TrackItem[] = [
  {
    id: 'trk-1',
    title: 'Ascent to the Planetary Citadel',
    genre: 'Neo-Classical Cinema',
    bpm: 78,
    duration: '3:42',
    keySignature: 'D Minor',
    instruments: ['Solo Cello', 'Celestial Choir', 'Analog Sub', 'Grand Piano'],
  },
  {
    id: 'trk-2',
    title: 'Reflective Waters at Midnight',
    genre: 'Ambient Atmospheric',
    bpm: 64,
    duration: '4:15',
    keySignature: 'A Minor',
    instruments: ['Tape Echo Synth', 'Orchestral Flute', 'Harp'],
  },
  {
    id: 'trk-3',
    title: 'Zero-G Orbital Pulse',
    genre: 'Cybernettic Downtempo',
    bpm: 92,
    duration: '2:58',
    keySignature: 'C Minor',
    instruments: ['Modular Synth', 'Moog Sub 37', 'Granular FX'],
  },
];

export const MusicWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState(
    'Atmospheric cinematic soundtrack with solemn cello, low sub-bass resonance, delicate piano arpeggios, and celestial ambient choir.'
  );
  const [genre, setGenre] = useState('Neo-Classical Cinema');
  const [bpm, setBpm] = useState(78);
  const [keySig, setKeySig] = useState('D Minor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState('trk-1');

  const [tracks, setTracks] = useState<TrackItem[]>(() => {
    try {
      const stored = localStorage.getItem('arti_ws_music');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as TrackItem[];
      }
    } catch {
      // ignore
    }
    return DEMO_TRACKS;
  });
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arti_ws_music') === null && DEMO_TRACKS.length > 0;
    } catch {
      return true;
    }
  });

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];
  const hasAudio = Boolean(activeTrack?.audioUrl);

  const handleTogglePlay = () => {
    if (!hasAudio) {
      showToast(
        'No audio artifact is loaded. Connect a synthesis provider to generate real playable audio.',
        { type: 'warning' }
      );
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleExport = () => {
    if (!hasAudio || !activeTrack) {
      showToast('Export unavailable: no rendered audio artifact exists for this track.', {
        type: 'warning',
      });
      return;
    }
    const a = document.createElement('a');
    a.href = activeTrack.audioUrl as string;
    a.download = `${activeTrack.title}.wav`;
    a.click();
    showToast(`Exported: ${activeTrack.title}`, { type: 'gold' });
  };

  const clearDemo = () => {
    setTracks([]);
    setIsDemo(false);
    try {
      localStorage.setItem('arti_ws_music', JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Music Studio"
        description="Track planning and audio synthesis controls. No audio provider is connected in this phase."
        icon={MusicIcon}
        badge="Composition Studio"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={handleExport}
              title="Export rendered audio artifact"
            >
              <Download size={14} />
              <span>Export Master</span>
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() =>
                showToast(
                  'Audio Synthesis Engine Disconnected: Add Suno / MusicLM API endpoint in Settings to synthesize live stems.',
                  { type: 'warning' }
                )
              }
            >
              <Sparkles size={14} />
              <span>Synthesize Score</span>
            </button>
          </div>
        }
      />

      {/* Main Studio Grid */}
      <div className="music-studio-grid">
        {isDemo && (
          <div className="demo-notice-span">
            <DemoDataNotice
              message="These example scores are illustrative metadata only. No real audio has been generated."
              onClear={clearDemo}
            />
          </div>
        )}
        {/* Left Column: Composition Prompt & Harmonic Controls */}
        <aside className="music-sidebar-column">
          <div className="spec-card">
            <h3 className="spec-card-heading">Musical Composition Brief</h3>
            <textarea
              className="spec-brief-textarea"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe mood, emotional trajectory, tempo, instruments..."
            />
          </div>

          <div className="spec-card">
            <h3 className="spec-card-heading">Harmonic &amp; Tempo Controls</h3>
            <div className="spec-style-row">
              <label className="spec-field-label">Genre</label>
              <select
                className="form-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="Neo-Classical Cinema">Neo-Classical Cinema</option>
                <option value="Ambient Atmospheric">Ambient Atmospheric</option>
                <option value="Cybernetic Downtempo">Cybernetic Downtempo</option>
                <option value="Symphonic Orchestral">Symphonic Orchestral</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Tempo: {bpm} BPM</label>
              <input
                type="range"
                min="50"
                max="160"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value, 10))}
                className="range-input"
              />
            </div>

            <div className="spec-style-row">
              <label className="spec-field-label">Key Signature</label>
              <select
                className="form-select"
                value={keySig}
                onChange={(e) => setKeySig(e.target.value)}
              >
                <option value="D Minor">D Minor (Solemn / Heroic)</option>
                <option value="A Minor">A Minor (Melancholic / Ethereal)</option>
                <option value="C Minor">C Minor (Dramatic / Cinematic)</option>
                <option value="F Major">F Major (Warm / Serene)</option>
              </select>
            </div>
          </div>

          <div className="spec-card subtle">
            <div className="engine-boundary-notice">
              <FileAudio size={13} />
              <span>Audio Synthesis Engine: Standby (Zero external telemetry)</span>
            </div>
          </div>
        </aside>

        <main className="music-main-column">
          {tracks.length === 0 ? (
            <EmptyState
              icon={MusicIcon}
              title="No tracks yet"
              description="Composed scores will appear here once an audio synthesis provider is connected and a track is generated."
              actionLabel="Compose a Score"
              onAction={() => showToast('Enter a composition brief, then connect a synthesis provider in Settings.', { type: 'info' })}
            />
          ) : (
          <>
          {/* Active Track Player Card */}
          <div className="audio-player-card">
            <div className="player-disc-spin-box">
              <Disc size={64} className={`player-disc-icon ${isPlaying && hasAudio ? 'spinning' : ''}`} />
            </div>

            <div className="player-track-info">
              <span className="player-track-genre">{activeTrack.genre}</span>
              <h2 className="player-track-title">{activeTrack.title}</h2>
              <div className="player-track-meta">
                <span>{activeTrack.bpm} BPM</span>
                <span>&middot;</span>
                <span>{activeTrack.keySignature}</span>
                <span>&middot;</span>
                <span>{activeTrack.duration}</span>
              </div>

              <div className="player-waveform-bar">
                {Array.from({ length: 48 }).map((_, i) => {
                  const height = 8 + Math.sin(i * 0.4) * 14 + (i % 5) * 4;
                  return (
                    <div
                      key={i}
                      className={`waveform-stripe ${isPlaying && hasAudio ? 'active' : ''}`}
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>

              {!hasAudio && (
                <span className="player-no-audio-note">
                  No audio artifact loaded
                </span>
              )}

              <div className="player-controls-row">
                <button
                  type="button"
                  className="player-play-btn"
                  onClick={handleTogglePlay}
                  title={hasAudio ? (isPlaying ? 'Pause playback' : 'Play audio') : 'No audio artifact available'}
                  aria-disabled={!hasAudio}
                >
                  {isPlaying && hasAudio ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="player-time-display">
                  <span>{hasAudio ? '0:00' : '--:--'}</span> / <span>{activeTrack.duration}</span>
                </div>
                <div className="player-volume-group">
                  <Volume2 size={15} />
                  <div className="volume-bar-mock" />
                </div>
              </div>
            </div>
          </div>

          {/* Track Library List */}
          <div className="track-library-card">
            <div className="library-header-row">
              <h3 className="library-title">Production Stems &amp; Scores</h3>
              <span className="library-count">{tracks.length} Tracks in Project</span>
            </div>

            <div className="tracks-list">
              {tracks.map((t) => {
                const isSelected = t.id === activeTrackId;
                return (
                  <div
                    key={t.id}
                    className={`track-item-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setActiveTrackId(t.id)}
                  >
                    <button
                      type="button"
                      className="track-item-play-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTrackId(t.id);
                        if (!t.audioUrl) {
                          showToast('No audio artifact loaded for this track.', { type: 'warning' });
                          return;
                        }
                        setIsPlaying(!isPlaying || t.id !== activeTrackId);
                      }}
                    >
                      {isSelected && isPlaying && t.audioUrl ? <Pause size={13} /> : <Play size={13} />}
                    </button>

                    <div className="track-item-details">
                      <span className="track-item-title">{t.title}</span>
                      <div className="track-item-tags">
                        {t.instruments.map((inst) => (
                          <span key={inst} className="instrument-tag">
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="track-item-meta">
                      <span>{t.bpm} BPM</span>
                      <span>{t.keySignature}</span>
                      <span>{t.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
};
