import React, { useMemo, useState } from 'react';
import { Sliders, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import {
  ASPECT_RATIOS,
  CAMERA_MOVEMENTS,
  COLOR_GRADES,
  FRAME_RATES,
  LIGHTING_OPTIONS,
  MOTION_OPTIONS,
  RESOLUTION_PRESETS,
  AUDIO_OPTIONS,
  getResolutionPreset,
} from '../../services/videoPrompt';
import { DURATION_PRESETS, formatDuration, parseDuration } from '../../services/videoTypes';
import {
  BRIDGE_CAPABILITY,
  sixteenKStatement,
  validateContinuousDuration,
} from '../../services/videoProvider';
import type { VideoGenerationSettings } from '../../services/chatStore';

interface VideoSettingsPanelProps {
  settings: VideoGenerationSettings;
  onChange: (patch: Partial<VideoGenerationSettings>) => void;
  onClose: () => void;
  /** When true the request is part of a structured production (aggregate runtime). */
  structured?: boolean;
}

/**
 * Video output settings.
 *
 * Requested settings are always shown separately from what the engine can
 * actually deliver: the duration validator reports the real clip limit (or that
 * the limit is unknown) and the 16K statement never claims native 16K that no
 * connected engine provides. Nothing is silently substituted.
 */
export const VideoSettingsPanel: React.FC<VideoSettingsPanelProps> = ({
  settings,
  onChange,
  onClose,
  structured = false,
}) => {
  const [durationInput, setDurationInput] = useState(() => formatDuration(settings.durationSeconds));

  const resolution = getResolutionPreset(settings.resolution);
  const durationValidation = useMemo(
    () => validateContinuousDuration(settings.durationSeconds, BRIDGE_CAPABILITY),
    [settings.durationSeconds]
  );

  const applyDurationText = (value: string) => {
    setDurationInput(value);
    const parsed = parseDuration(value);
    if (parsed) onChange({ durationSeconds: parsed.seconds });
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container video-settings-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-settings-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="video-settings-title" className="dialog-title">
              <Sliders size={16} aria-hidden="true" /> Output settings
            </h2>
            <p className="dialog-description">
              Defaults are 1920×1080, 16:9 landscape. Requested settings are shown alongside what the
              engine can actually deliver.
            </p>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close settings">
            <AlertCircle size={16} />
          </button>
        </div>

        <div className="dialog-body video-settings-body">
          {/* Duration */}
          <div className="settings-field">
            <label className="settings-label" htmlFor="vid-duration">
              Requested duration {structured ? '(per episode)' : ''}
            </label>
            <input
              id="vid-duration"
              type="text"
              className="form-input"
              value={durationInput}
              placeholder="e.g. 15s, 45 minutes, 2h 30m, 1000 hours"
              onChange={(e) => applyDurationText(e.target.value)}
            />
            <div className="duration-preset-row">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`duration-preset-chip ${settings.durationSeconds === p.seconds ? 'active' : ''}`}
                  onClick={() => {
                    setDurationInput(p.label);
                    onChange({ durationSeconds: p.seconds });
                  }}
                  title={p.hint}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="settings-hint">
              Parsed as <strong>{formatDuration(settings.durationSeconds)}</strong> (
              {settings.durationSeconds.toLocaleString()} s). Fractional seconds are supported.
            </p>

            {structured ? (
              <div className="video-honesty-note info" role="note">
                <Info size={13} aria-hidden="true" />
                <span>
                  For a structured production the duration is <strong>per episode</strong>. Total runtime is
                  the sum of all episodes, not one continuous file.
                </span>
              </div>
            ) : (
              <div
                className={`video-honesty-note ${durationValidation.ok ? 'info' : 'warning'}`}
                role="note"
              >
                {durationValidation.ok ? <Info size={13} aria-hidden="true" /> : <AlertTriangle size={13} aria-hidden="true" />}
                <span>
                  {durationValidation.ok
                    ? durationValidation.note ??
                      'Within the engine’s declared single-clip limit.'
                    : durationValidation.note}
                </span>
              </div>
            )}
          </div>

          {/* Aspect ratio */}
          <div className="settings-field">
            <label className="settings-label" htmlFor="vid-aspect">Aspect ratio</label>
            <select
              id="vid-aspect"
              className="form-select"
              value={settings.aspectRatio}
              onChange={(e) => onChange({ aspectRatio: e.target.value })}
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution */}
          <div className="settings-field">
            <label className="settings-label" htmlFor="vid-res">Resolution</label>
            <select
              id="vid-res"
              className="form-select"
              value={settings.resolution}
              onChange={(e) => onChange({ resolution: e.target.value })}
            >
              {RESOLUTION_PRESETS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {settings.resolution === 'custom' && (
              <input
                type="text"
                className="form-input"
                style={{ marginTop: 8 }}
                placeholder="WIDTHxHEIGHT (e.g. 2048x858)"
                value={settings.customResolution}
                onChange={(e) => onChange({ customResolution: e.target.value })}
              />
            )}
            {resolution?.note && (
              <div className={`video-honesty-note ${resolution.aspirational ? 'warning' : 'info'}`} role="note">
                {resolution.aspirational ? <AlertTriangle size={13} aria-hidden="true" /> : <Info size={13} aria-hidden="true" />}
                <span>{resolution.note}</span>
              </div>
            )}
            {settings.resolution === '16K' && (
              <p className="settings-hint">{sixteenKStatement(BRIDGE_CAPABILITY)}</p>
            )}
          </div>

          {/* Frame rate */}
          <div className="settings-field">
            <label className="settings-label" htmlFor="vid-fps">Frame rate</label>
            <select
              id="vid-fps"
              className="form-select"
              value={settings.fps}
              onChange={(e) => onChange({ fps: parseInt(e.target.value, 10) })}
            >
              {FRAME_RATES.map((f) => (
                <option key={f} value={f}>{f} fps</option>
              ))}
            </select>
          </div>

          {/* Advanced */}
          <details className="video-advanced">
            <summary>Advanced direction</summary>
            <div className="video-advanced-grid">
              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-cam">Camera movement</label>
                <select
                  id="vid-cam"
                  className="form-select"
                  value={settings.cameraMovement}
                  onChange={(e) => onChange({ cameraMovement: e.target.value })}
                >
                  {CAMERA_MOVEMENTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-light">Lighting</label>
                <select
                  id="vid-light"
                  className="form-select"
                  value={settings.lighting}
                  onChange={(e) => onChange({ lighting: e.target.value })}
                >
                  <option value="">Default</option>
                  {LIGHTING_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-grade">Colour grading</label>
                <select
                  id="vid-grade"
                  className="form-select"
                  value={settings.colorGrade}
                  onChange={(e) => onChange({ colorGrade: e.target.value })}
                >
                  {COLOR_GRADES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-motion">Motion</label>
                <select
                  id="vid-motion"
                  className="form-select"
                  value={settings.motion}
                  onChange={(e) => onChange({ motion: e.target.value })}
                >
                  {MOTION_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-audio">Audio</label>
                <select
                  id="vid-audio"
                  className="form-select"
                  value={settings.audio}
                  onChange={(e) => onChange({ audio: e.target.value })}
                >
                  {AUDIO_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-lang">Language</label>
                <input
                  id="vid-lang"
                  type="text"
                  className="form-input"
                  value={settings.language}
                  onChange={(e) => onChange({ language: e.target.value })}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-narr">Narration</label>
                <input
                  id="vid-narr"
                  type="text"
                  className="form-input"
                  placeholder="Narration direction (optional)"
                  value={settings.narration}
                  onChange={(e) => onChange({ narration: e.target.value })}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-music">Music</label>
                <input
                  id="vid-music"
                  type="text"
                  className="form-input"
                  placeholder="Music direction (optional)"
                  value={settings.music}
                  onChange={(e) => onChange({ music: e.target.value })}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-seed">Seed (bridge-dependent)</label>
                <input
                  id="vid-seed"
                  type="text"
                  className="form-input"
                  placeholder="-1 for random"
                  value={settings.seed}
                  onChange={(e) => onChange({ seed: e.target.value })}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-neg">Negative prompt</label>
                <input
                  id="vid-neg"
                  type="text"
                  className="form-input"
                  placeholder="What to avoid (optional)"
                  value={settings.negativePrompt}
                  onChange={(e) => onChange({ negativePrompt: e.target.value })}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="vid-platform">Intended platform / audience</label>
                <input
                  id="vid-platform"
                  type="text"
                  className="form-input"
                  placeholder="e.g. cinema, YouTube, mobile"
                  value={settings.intendedPlatform}
                  onChange={(e) => onChange({ intendedPlatform: e.target.value })}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label settings-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.subtitles}
                    onChange={(e) => onChange({ subtitles: e.target.checked })}
                  />
                  <span>Include subtitles</span>
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
