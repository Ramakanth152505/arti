import React, { useState } from 'react';
import {
  Video as VideoIcon,
  Play,
  Film,
  History,
  Sliders,
  Plus,
  Clock,
  Layers,
  Camera,
  Music,
  AlertCircle,
  Sparkles,
  Search,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { EmptyState } from '../../common/EmptyState';
import { Dialog } from '../../common/Dialog';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface StoryboardScene {
  id: string;
  sceneNumber: number;
  title: string;
  prompt: string;
  duration: number; // in seconds
  cameraMovement: string;
}

interface VideoRecord {
  id: string;
  title: string;
  prompt: string;
  duration: string;
  resolution: string;
  createdAt: string;
}

const DEFAULT_SCENES: StoryboardScene[] = [
  {
    id: 'sc-1',
    sceneNumber: 1,
    title: 'Establishing Shot: The Spires',
    prompt: 'Wide aerial sweep over ancient obsidian towers bathed in golden volumetric dawn mist, slow forward dolly.',
    duration: 6,
    cameraMovement: 'Forward Dolly & Slow Tilt Down',
  },
  {
    id: 'sc-2',
    sceneNumber: 2,
    title: 'Approach to the Citadel',
    prompt: 'Tracking shot alongside calm reflective water, water rippling gently, camera panning toward castle gates.',
    duration: 8,
    cameraMovement: 'Tracking Pan Left',
  },
  {
    id: 'sc-3',
    sceneNumber: 3,
    title: 'Planetary Ascent',
    prompt: 'Upward crane shot revealing the colossal ringed planetary sphere rising above the horizon.',
    duration: 10,
    cameraMovement: 'Crane Pedestal Up',
  },
];

export const VideosWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'studio' | 'history'>('studio');
  const [scenes, setScenes] = useState<StoryboardScene[]>(DEFAULT_SCENES);
  const [activeSceneId, setActiveSceneId] = useState<string>('sc-1');
  const [aspectRatio, setAspectRatio] = useState('16:9 (Cinema)');
  const [resolution, setResolution] = useState('1080p (Full HD)');
  const [audioScore, setAudioScore] = useState('Orchestral Cinematic Vibe');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [historyVideos, setHistoryVideos] = useState<VideoRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const newScene: StoryboardScene = {
      id: 'sc-' + Date.now(),
      sceneNumber: nextNum,
      title: `Scene ${nextNum}: New Sequence`,
      prompt: 'Enter descriptive prompt for this sequence...',
      duration: 6,
      cameraMovement: 'Static Horizon',
    };
    setScenes([...scenes, newScene]);
    setActiveSceneId(newScene.id);
    showToast(`Added Scene ${nextNum} to storyboard`, { type: 'gold' });
  };

  const handleUpdateActiveScene = (field: keyof StoryboardScene, val: any) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === activeSceneId ? { ...s, [field]: val } : s))
    );
  };

  const handleDeleteScene = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (scenes.length <= 1) {
      showToast('Storyboard requires at least one scene', { type: 'warning' });
      return;
    }
    const updated = scenes.filter((s) => s.id !== id);
    setScenes(updated);
    if (activeSceneId === id) setActiveSceneId(updated[0].id);
    showToast('Scene removed from timeline', { type: 'info' });
  };

  const handleRenderVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(
      'Video Generation Engine Disconnected: High-fidelity cinematic rendering requires a connected cluster (Runway, Luma, Sora, or Custom Multi-GPU Worker). Configure endpoints in Settings > Connected Services.'
    );
    showToast('Video engine disconnected', { type: 'warning' });
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Videos Studio"
        description="Cinematic film direction, multi-scene storyboard orchestration, and timeline video synthesis"
        icon={VideoIcon}
        badge="Cinematic Engine"
        actions={
          <div className="header-action-cluster">
            {activeTab === 'studio' ? (
              <button
                type="button"
                className="gold-ghost-btn"
                onClick={() => setActiveTab('history')}
              >
                <History size={14} />
                <span>Previous Videos ({historyVideos.length})</span>
              </button>
            ) : (
              <button
                type="button"
                className="gold-primary-btn"
                onClick={() => setActiveTab('studio')}
              >
                <Film size={14} />
                <span>Production Studio</span>
              </button>
            )}
          </div>
        }
      />

      {activeTab === 'studio' ? (
        <div className="video-studio-layout">
          {/* Top Row: Preview Canvas & Scene Editor */}
          <div className="video-top-workspace-grid">
            {/* Viewport / Video Preview Mockup */}
            <div className="video-viewport-panel">
              <div className="video-player-container">
                <div className="player-placeholder-overlay">
                  <Film size={40} className="player-film-icon" />
                  <span className="player-status-tag">Viewport Standby</span>
                  <p className="player-scene-tag">{activeScene.title}</p>
                  <span className="player-res-tag">{resolution} &middot; {aspectRatio}</span>
                </div>
              </div>
            </div>

            {/* Active Scene Prompt & Motion Controls */}
            <div className="scene-details-card">
              <div className="scene-details-header">
                <div className="scene-number-pill">Scene #{activeScene.sceneNumber}</div>
                <input
                  type="text"
                  className="scene-title-input"
                  value={activeScene.title}
                  onChange={(e) => handleUpdateActiveScene('title', e.target.value)}
                  placeholder="Scene Title"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Scene Prompt</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={activeScene.prompt}
                  onChange={(e) => handleUpdateActiveScene('prompt', e.target.value)}
                  placeholder="Describe lighting, action, subject motion, atmosphere..."
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label className="form-label">Camera Movement</label>
                  <select
                    className="form-select"
                    value={activeScene.cameraMovement}
                    onChange={(e) => handleUpdateActiveScene('cameraMovement', e.target.value)}
                  >
                    <option value="Forward Dolly & Slow Tilt Down">Forward Dolly &amp; Slow Tilt Down</option>
                    <option value="Tracking Pan Left">Tracking Pan Left</option>
                    <option value="Crane Pedestal Up">Crane Pedestal Up</option>
                    <option value="Orbit 360 Degree">Orbit 360 Degree</option>
                    <option value="Static Horizon">Static Horizon</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Duration: {activeScene.duration}s</label>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={activeScene.duration}
                    onChange={(e) =>
                      handleUpdateActiveScene('duration', parseInt(e.target.value, 10))
                    }
                    className="range-input"
                  />
                </div>
              </div>

              {/* Master settings */}
              <div className="form-row-3">
                <div className="form-field">
                  <label className="form-label">Aspect Ratio</label>
                  <select
                    className="form-select"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    <option value="16:9 (Cinema)">16:9 (Cinema)</option>
                    <option value="2.39:1 (Anamorphic)">2.39:1 (Anamorphic Scope)</option>
                    <option value="9:16 (Vertical)">9:16 (Vertical Mobile)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Target Resolution</label>
                  <select
                    className="form-select"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  >
                    <option value="1080p (Full HD)">1080p (Full HD)</option>
                    <option value="4K UHD (Master)">4K UHD (Master)</option>
                    <option value="Future 8K/16K Pipeline (Research)" disabled>
                      Future 8K/16K (Research Roadmap)
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Soundtrack Mood</label>
                  <select
                    className="form-select"
                    value={audioScore}
                    onChange={(e) => setAudioScore(e.target.value)}
                  >
                    <option value="Orchestral Cinematic Vibe">Orchestral Cinematic Vibe</option>
                    <option value="Ambient Sci-Fi Drone">Ambient Sci-Fi Drone</option>
                    <option value="Dialogue Prompt Only">Dialogue Prompt Only</option>
                    <option value="Mute / No Audio">Mute / No Audio</option>
                  </select>
                </div>
              </div>

              {statusMessage && (
                <div className="service-status-banner warning">
                  <AlertCircle size={15} />
                  <div className="status-banner-text">
                    <strong>Production Cluster Notice</strong>
                    <p>{statusMessage}</p>
                  </div>
                </div>
              )}

              <div className="scene-action-row">
                <button
                  type="button"
                  className="gold-primary-btn large"
                  onClick={handleRenderVideo}
                >
                  <Sparkles size={15} />
                  <span>Render Storyboard ({totalDuration}s Total)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline & Storyboard Assembly Track */}
          <div className="timeline-workspace-card">
            <div className="timeline-header-bar">
              <div className="timeline-title-group">
                <Film size={15} />
                <span className="timeline-title">Storyboard Sequence Timeline</span>
                <span className="timeline-meta">
                  {scenes.length} Scenes &middot; {totalDuration}s Sequence
                </span>
              </div>
              <button
                type="button"
                className="gold-ghost-btn small"
                onClick={handleAddScene}
              >
                <Plus size={13} />
                <span>Add Scene</span>
              </button>
            </div>

            {/* Visual Timeline Track */}
            <div className="timeline-track-container">
              <div className="timeline-ruler">
                <span>0:00</span>
                <span>0:10</span>
                <span>0:20</span>
                <span>0:30</span>
                <span>0:45</span>
              </div>

              <div className="timeline-scenes-track">
                {scenes.map((sc) => {
                  const isActive = sc.id === activeSceneId;
                  return (
                    <div
                      key={sc.id}
                      className={`timeline-scene-block ${isActive ? 'active' : ''}`}
                      style={{ flex: sc.duration }}
                      onClick={() => setActiveSceneId(sc.id)}
                    >
                      <div className="block-header">
                        <span className="block-num">#{sc.sceneNumber}</span>
                        <span className="block-dur">{sc.duration}s</span>
                        {scenes.length > 1 && (
                          <button
                            type="button"
                            className="block-del-btn"
                            onClick={(e) => handleDeleteScene(sc.id, e)}
                            title="Remove scene"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <span className="block-title">{sc.title}</span>
                      <span className="block-motion">{sc.cameraMovement}</span>
                    </div>
                  );
                })}
              </div>

              {/* Audio Score Track Preview */}
              <div className="timeline-audio-track">
                <Music size={12} className="audio-track-icon" />
                <span className="audio-track-label">{audioScore} (Audio Bed)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Previous Videos View */
        <div className="video-history-view">
          <div className="history-toolbar">
            <div className="toolbar-search-box">
              <Search size={14} className="toolbar-search-icon" />
              <input
                type="text"
                className="toolbar-search-input"
                placeholder="Search previously rendered video sequences..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          {historyVideos.length === 0 ? (
            <EmptyState
              icon={VideoIcon}
              title="No previous video sequences"
              description="Rendered cinema productions will be catalogued here once connected to an active rendering engine."
              actionLabel="Return to Production Studio"
              onAction={() => setActiveTab('studio')}
            />
          ) : (
            <div className="video-history-grid">
              {/* Display items when present */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
