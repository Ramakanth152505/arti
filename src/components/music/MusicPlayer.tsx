/**
 * ARTI AI — Music Studio audio player.
 *
 * A real HTML `<audio>` player: play/pause, seek, position, volume and download.
 * It only ever points at a genuine asset the provider returned or that a real
 * local processing step produced. When a track has no audio it says so and
 * disables the controls rather than faking playback.
 */
import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Repeat } from 'lucide-react';
import { formatDuration } from '../../services/musicTypes';
import type { GeneratedTrackRecord } from '../../services/chatStore';

interface MusicPlayerProps {
  track: GeneratedTrackRecord;
  onDownload: () => void;
  onLoopChange?: (loop: boolean) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, onDownload, onLoopChange }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(track.durationSeconds || 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedTrackId, setRenderedTrackId] = useState(track.id);

  const hasAudio = Boolean(track.audioUrl);

  // Reset the transport when the selected track changes. Adjusting state during
  // render (rather than in an effect) avoids a cascading render.
  if (renderedTrackId !== track.id) {
    setRenderedTrackId(track.id);
    setPlaying(false);
    setPosition(0);
    setError(null);
    setDuration(track.durationSeconds || 0);
  }

  const toggle = () => {
    const el = audioRef.current;
    if (!el || !hasAudio) return;
    if (playing) {
      el.pause();
    } else {
      void el.play().catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Playback could not start.');
      });
    }
  };

  const onSeek = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = value;
    setPosition(value);
  };

  return (
    <div className="music-player">
      {hasAudio && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          preload="metadata"
          loop={loop}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          onError={() => setError('The audio asset could not be loaded. The provider URL may have expired.')}
        />
      )}

      <div className="music-player-transport">
        <button
          type="button"
          className="music-player-play"
          onClick={toggle}
          disabled={!hasAudio}
          aria-label={playing ? 'Pause' : 'Play'}
          title={hasAudio ? (playing ? 'Pause' : 'Play') : 'No audio asset available'}
        >
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>

        <span className="music-player-time">{formatDuration(position)}</span>
        <input
          type="range"
          className="music-player-seek"
          min={0}
          max={Math.max(1, duration)}
          step={0.1}
          value={Math.min(position, duration)}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          disabled={!hasAudio}
          aria-label="Seek"
        />
        <span className="music-player-time">{formatDuration(duration)}</span>
      </div>

      <div className="music-player-controls">
        <button
          type="button"
          className={`music-player-icon ${muted ? 'off' : ''}`}
          onClick={() => {
            const el = audioRef.current;
            if (!el) return;
            const next = !muted;
            el.muted = next;
            setMuted(next);
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
        </button>
        <input
          type="range"
          className="music-player-volume"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          aria-label="Volume"
        />
        <button
          type="button"
          className={`music-player-icon ${loop ? 'on' : ''}`}
          onClick={() => {
            const next = !loop;
            setLoop(next);
            onLoopChange?.(next);
          }}
          aria-label="Toggle loop"
          title="Loop"
        >
          <Repeat size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="music-player-icon"
          onClick={onDownload}
          disabled={!hasAudio}
          aria-label="Download track"
          title="Download"
        >
          <Download size={15} aria-hidden="true" />
        </button>
      </div>

      {!hasAudio && <p className="music-player-note">No audio asset is loaded for this track.</p>}
      {error && <p className="music-player-error" role="alert">{error}</p>}
    </div>
  );
};

export default MusicPlayer;
