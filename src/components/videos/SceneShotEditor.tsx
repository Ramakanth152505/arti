import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Film,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  videoProductionStore,
  type Production,
  type Scene,
  type Shot,
  type Episode,
} from '../../services/videoProduction';
import { downloadVideo } from '../../services/videoDownload';
import { formatDuration } from '../../services/videoTypes';
import { CAMERA_MOVEMENTS } from '../../services/videoPrompt';

interface SceneShotEditorProps {
  production: Production;
  seasonId: string;
  episode: Episode;
  /** Run a real generation job for one shot; provided by the parent workspace. */
  onGenerateShot: (scene: Scene, shot: Shot) => void;
  /** True while any job for this production is running. */
  busy: boolean;
}

const SHOT_STATUS_LABEL: Record<Shot['status'], string> = {
  draft: 'Draft',
  planned: 'Planned',
  ready: 'Ready',
  generating: 'Generating',
  generated: 'Generated',
  failed: 'Failed',
  blocked: 'Blocked',
};

/**
 * Scene and shot editor.
 *
 * Breaks an episode into scenes and shots and generates one shot at a time.
 * Regenerating a single shot never touches its siblings or the rest of the
 * season: every scene/shot is addressed by its own id. Successful takes are
 * preserved even when a later shot fails.
 */
export const SceneShotEditor: React.FC<SceneShotEditorProps> = ({
  production,
  seasonId,
  episode,
  onGenerateShot,
  busy,
}) => {
  const { showToast } = useToast();
  const [openSceneId, setOpenSceneId] = useState<string | null>(episode.scenes[0]?.id ?? null);

  const addScene = () => {
    const scene = videoProductionStore.addScene(production.id, seasonId, episode.id, {
      title: `Scene ${episode.scenes.length + 1}`,
      shots: [],
    });
    if (scene) {
      videoProductionStore.addShot(production.id, seasonId, episode.id, scene.id, { prompt: '', durationSeconds: 6 });
      setOpenSceneId(scene.id);
      showToast('Scene added', { type: 'gold' });
    }
  };

  const handleDownload = async (url: string, title: string, format: string) => {
    const outcome = await downloadVideo(url, title, format, 1);
    showToast(outcome.ok ? `Downloaded ${outcome.filename}.` : outcome.reason, { type: outcome.ok ? 'success' : 'error' });
  };

  return (
    <div className="scene-shot-editor">
      <div className="scene-shot-head">
        <span className="scene-shot-title">
          <Film size={14} aria-hidden="true" /> Scenes &amp; shots
        </span>
        <button type="button" className="gold-ghost-btn small" onClick={addScene}>
          <Plus size={13} aria-hidden="true" />
          <span>Add scene</span>
        </button>
      </div>

      {episode.scenes.length === 0 ? (
        <div className="scene-shot-empty">
          <p>No scenes yet. Add a scene to begin breaking the episode into shots.</p>
        </div>
      ) : (
        <div className="scene-list">
          {episode.scenes.map((scene) => {
            const open = openSceneId === scene.id;
            return (
              <section key={scene.id} className={`scene-card ${open ? 'open' : ''}`}>
                <button
                  type="button"
                  className="scene-card-head"
                  onClick={() => setOpenSceneId(open ? null : scene.id)}
                  aria-expanded={open}
                >
                  {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                  <span className="scene-num">#{scene.number}</span>
                  <input
                    type="text"
                    className="scene-title-input"
                    value={scene.title}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      videoProductionStore.updateScene(production.id, seasonId, episode.id, scene.id, {
                        title: e.target.value,
                      })
                    }
                    aria-label={`Scene ${scene.number} title`}
                  />
                  <span className={`scene-status status-${scene.status}`}>{scene.status}</span>
                  <span className="scene-meta">
                    {scene.shots.length} shot{scene.shots.length === 1 ? '' : 's'} ·{' '}
                    {formatDuration(scene.shots.reduce((n, s) => n + s.durationSeconds, 0))}
                  </span>
                  <button
                    type="button"
                    className="scene-del-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete scene #${scene.number}? This cannot be undone.`)) {
                        videoProductionStore.removeScene(production.id, seasonId, episode.id, scene.id);
                        showToast('Scene deleted', { type: 'info' });
                      }
                    }}
                    title="Delete scene"
                    aria-label={`Delete scene ${scene.number}`}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </button>

                {open && (
                  <div className="scene-card-body">
                    <div className="settings-field">
                      <label className="settings-label">Scene prompt</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={scene.prompt}
                        placeholder="Describe the action, atmosphere and staging for this scene."
                        onChange={(e) =>
                          videoProductionStore.updateScene(production.id, seasonId, episode.id, scene.id, {
                            prompt: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-label">Lighting</label>
                      <input
                        type="text"
                        className="form-input"
                        value={scene.lighting}
                        placeholder="e.g. golden hour, low-key"
                        onChange={(e) =>
                          videoProductionStore.updateScene(production.id, seasonId, episode.id, scene.id, {
                            lighting: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="shot-list">
                      {scene.shots.map((shot) => (
                        <div key={shot.id} className="shot-row">
                          <div className="shot-row-head">
                            <span className="shot-num">Shot {shot.number}</span>
                            <span className={`shot-status status-${shot.status}`}>
                              {SHOT_STATUS_LABEL[shot.status]}
                            </span>
                            <span className="shot-dur">{formatDuration(shot.durationSeconds)}</span>
                            <button
                              type="button"
                              className="shot-del-btn"
                              onClick={() => {
                                if (scene.shots.length <= 1) {
                                  showToast('A scene needs at least one shot', { type: 'warning' });
                                  return;
                                }
                                videoProductionStore.removeShot(production.id, seasonId, episode.id, scene.id, shot.id);
                              }}
                              title="Remove shot"
                              aria-label={`Remove shot ${shot.number}`}
                            >
                              <Trash2 size={12} aria-hidden="true" />
                            </button>
                          </div>

                          <textarea
                            className="form-textarea shot-prompt"
                            rows={2}
                            value={shot.prompt}
                            placeholder="Shot prompt (what happens in this shot)."
                            onChange={(e) =>
                              videoProductionStore.updateShot(production.id, seasonId, episode.id, scene.id, shot.id, {
                                prompt: e.target.value,
                              })
                            }
                          />

                          <div className="shot-row-controls">
                            <select
                              className="form-select"
                              value={shot.cameraMovement}
                              onChange={(e) =>
                                videoProductionStore.updateShot(production.id, seasonId, episode.id, scene.id, shot.id, {
                                  cameraMovement: e.target.value,
                                })
                              }
                              aria-label="Camera movement"
                            >
                              {CAMERA_MOVEMENTS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <label className="shot-dur-input">
                              <span>Duration (s)</span>
                              <input
                                type="number"
                                min={0.1}
                                step={0.1}
                                className="form-input"
                                value={shot.durationSeconds}
                                onChange={(e) =>
                                  videoProductionStore.updateShot(production.id, seasonId, episode.id, scene.id, shot.id, {
                                    durationSeconds: Math.max(0.1, parseFloat(e.target.value) || 0.1),
                                  })
                                }
                              />
                            </label>
                            <button
                              type="button"
                              className="gold-primary-btn small"
                              onClick={() => onGenerateShot(scene, shot)}
                              disabled={busy}
                              title="Generate this shot only"
                            >
                              <Play size={13} aria-hidden="true" />
                              <span>{shot.versions.length ? 'Regenerate' : 'Generate'}</span>
                            </button>
                          </div>

                          {shot.versions.length > 0 && (
                            <div className="shot-versions">
                              {shot.versions.map((v, i) => (
                                <div key={v.id} className="shot-version">
                                  <video src={v.url} controls preload="metadata" className="shot-version-player" />
                                  <div className="shot-version-meta">
                                    <span>{i === 0 ? 'Current take' : `Take ${shot.versions.length - i}`}</span>
                                    <span className="shot-version-time">{v.createdAt}</span>
                                    <button
                                      type="button"
                                      className="video-tile-action"
                                      onClick={() => handleDownload(v.url, `${episode.title} ${scene.title} shot ${shot.number}`, 'mp4')}
                                      title="Download this take"
                                      aria-label="Download this take"
                                    >
                                      <Download size={12} aria-hidden="true" />
                                    </button>
                                  </div>
                                  {v.note && <p className="shot-version-note">{v.note}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="gold-ghost-btn small"
                        onClick={() =>
                          videoProductionStore.addShot(production.id, seasonId, episode.id, scene.id, {
                            prompt: '',
                            durationSeconds: 6,
                          })
                        }
                      >
                        <Plus size={12} aria-hidden="true" />
                        <span>Add shot</span>
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Job log for this episode — real persisted state */}
      {episode.jobs.length > 0 && (
        <div className="episode-jobs">
          <h4 className="episode-jobs-title">Generation jobs</h4>
          <ul className="episode-jobs-list">
            {episode.jobs.slice(0, 20).map((job) => (
              <li key={job.id} className={`job-row job-${job.state}`}>
                <span className="job-state-icon" aria-hidden="true">
                  {job.state === 'completed' ? (
                    <CheckCircle2 size={12} />
                  ) : job.state === 'failed' || job.state === 'blocked' ? (
                    <AlertTriangle size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                </span>
                <span className="job-target">{job.target.type}</span>
                <span className="job-state">{job.state}</span>
                <span className="job-attempts">
                  attempt {job.attempts}/{job.maxAttempts}
                </span>
                {job.error && <span className="job-error" title={job.error}>{job.error.slice(0, 80)}</span>}
                {job.state === 'failed' && (
                  <button
                    type="button"
                    className="gold-ghost-btn tiny"
                    onClick={() =>
                      videoProductionStore.setJobState(production.id, seasonId, episode.id, job.id, {
                        state: 'queued',
                        error: undefined,
                      })
                    }
                    title="Retry this failed job only"
                  >
                    <RefreshCw size={11} aria-hidden="true" />
                    <span>Retry</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="episode-jobs-note">
            <Copy size={11} aria-hidden="true" /> Retrying one job never removes successful output from other
            shots.
          </p>
        </div>
      )}
    </div>
  );
};
