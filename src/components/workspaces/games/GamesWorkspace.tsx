import React, { useState } from 'react';
import {
  Gamepad2,
  Plus,
  Play,
  Pause,
  Box,
  Layers,
  Sparkles,
  Sliders,
  Folder,
  Eye,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface GameAsset {
  id: string;
  name: string;
  category: 'Environment' | 'Character' | 'Audio FX' | 'Shader';
  format: string;
}

export const GamesWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [genre, setGenre] = useState('Sci-Fi Cinematic RPG');
  const [engine, setEngine] = useState('WebGPU Canvas / Three.js');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'levels' | 'assets' | 'physics'>('levels');
  const [concept, setConcept] = useState(
    'A cinematic exploration game set on an obsidian world where players navigate ancient spires and planetary gravity anomalies.'
  );

  const [assets, setAssets] = useState<GameAsset[]>([
    { id: 'a-1', name: 'Obsidian Spire Mesh (LOD 0)', category: 'Environment', format: '.glb' },
    { id: 'a-2', name: 'Atmospheric Fog Volumetric Shader', category: 'Shader', format: '.wgsl' },
    { id: 'a-3', name: 'Celestial Planetary Skybox Texture', category: 'Environment', format: '.hdr' },
    { id: 'a-4', name: 'Zero-G Resonance Audio Bed', category: 'Audio FX', format: '.wav' },
  ]);

  const handleToggleSimulation = () => {
    setIsPlaying(!isPlaying);
    showToast(
      !isPlaying
        ? 'Simulation viewport active: 60 FPS WebGPU Canvas loop running'
        : 'Simulation paused',
      { type: 'gold' }
    );
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Games Studio"
        description="Procedural world synthesis, WebGPU game mechanics, and interactive simulation engine"
        icon={Gamepad2}
        badge="Engine Viewport"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className={`gold-ghost-btn ${isPlaying ? 'active' : ''}`}
              onClick={handleToggleSimulation}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause Simulation' : 'Run Viewport'}</span>
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() => showToast('New game project wizard initialized', { type: 'gold' })}
            >
              <Plus size={15} />
              <span>New Game Project</span>
            </button>
          </div>
        }
      />

      {/* Main Studio Grid */}
      <div className="game-studio-grid">
        {/* Left Column: Concept & Engine Settings */}
        <aside className="game-sidebar-column">
          <div className="spec-card">
            <h3 className="spec-card-heading">Concept &amp; Mechanics</h3>
            <textarea
              className="spec-brief-textarea"
              rows={4}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Describe gameplay mechanics, narrative premise, controls..."
            />
            <div className="spec-style-row">
              <label className="spec-field-label">Genre</label>
              <select
                className="form-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="Sci-Fi Cinematic RPG">Sci-Fi Cinematic RPG</option>
                <option value="Orbital Strategy Simulator">Orbital Strategy Simulator</option>
                <option value="Procedural Roguelike">Procedural Roguelike</option>
                <option value="Physics Gravity Puzzle">Physics Gravity Puzzle</option>
              </select>
            </div>
            <div className="spec-style-row">
              <label className="spec-field-label">Target Engine</label>
              <select
                className="form-select"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
              >
                <option value="WebGPU Canvas / Three.js">WebGPU Canvas (Native Web)</option>
                <option value="Babylon.js WebGL2">Babylon.js (WebGL2)</option>
                <option value="Unreal Engine 5 Exporter">Unreal Engine 5 (Connector)</option>
                <option value="Godot 4 Web Assembly">Godot 4 (Wasm Export)</option>
              </select>
            </div>
          </div>

          <div className="spec-card subtle">
            <h4 className="info-card-subtitle">Engine Pipeline</h4>
            <div className="build-status-box">
              <div className="build-row">
                <span>Renderer:</span>
                <strong className="status-val ok">WebGPU Active</strong>
              </div>
              <div className="build-row">
                <span>Physics Worker:</span>
                <strong className="status-val ok">Rapier Wasm</strong>
              </div>
              <div className="build-row">
                <span>Shader Compiler:</span>
                <strong className="status-val ok">WGSL Ready</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* Center / Viewport Column */}
        <main className="game-main-column">
          {/* Game Viewport Container */}
          <div className="game-viewport-card">
            <div className="viewport-overlay-bar">
              <div className="viewport-status-tag">
                <span className={`sim-dot ${isPlaying ? 'running' : 'idle'}`} />
                <span>{isPlaying ? 'Simulation Running &middot; 60 FPS' : 'Viewport Standby'}</span>
              </div>
              <div className="viewport-camera-tag">Camera: Perspective (FOV 75)</div>
            </div>

            <div className="game-canvas-mock">
              <div className="game-scene-elements">
                <Box size={56} className={`scene-3d-wireframe ${isPlaying ? 'rotating' : ''}`} />
                <div className="scene-label-center">
                  <span>{genre}</span>
                  <p>{engine}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subsystem Tabs (Levels, Assets, Physics) */}
          <div className="game-subsystem-card">
            <div className="subsystem-tabs-row">
              <button
                type="button"
                className={`subsystem-tab ${activeTab === 'levels' ? 'active' : ''}`}
                onClick={() => setActiveTab('levels')}
              >
                <Layers size={13} />
                <span>Level Overview</span>
              </button>
              <button
                type="button"
                className={`subsystem-tab ${activeTab === 'assets' ? 'active' : ''}`}
                onClick={() => setActiveTab('assets')}
              >
                <Folder size={13} />
                <span>Asset Browser ({assets.length})</span>
              </button>
              <button
                type="button"
                className={`subsystem-tab ${activeTab === 'physics' ? 'active' : ''}`}
                onClick={() => setActiveTab('physics')}
              >
                <Sliders size={13} />
                <span>Physics &amp; World Rules</span>
              </button>
            </div>

            <div className="subsystem-tab-content">
              {activeTab === 'levels' ? (
                <div className="levels-list">
                  <div className="level-item active">
                    <span className="level-badge">Level 1</span>
                    <div className="level-info">
                      <h4>The Citadel of Obsidian</h4>
                      <p>Atmospheric entrance with reflective water bodies and volumetric light shafts.</p>
                    </div>
                  </div>
                  <div className="level-item">
                    <span className="level-badge">Level 2</span>
                    <div className="level-info">
                      <h4>Subterranean Resonance Chamber</h4>
                      <p>Zero-gravity acoustic testing hall with procedural reverberation.</p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'assets' ? (
                <div className="assets-grid">
                  {assets.map((asset) => (
                    <div key={asset.id} className="asset-card">
                      <span className="asset-cat-tag">{asset.category}</span>
                      <h4 className="asset-name">{asset.name}</h4>
                      <span className="asset-fmt">{asset.format}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="physics-rules-grid">
                  <div className="rule-card">
                    <span>Gravity Acceleration:</span>
                    <strong>-9.81 m/s² (Earth Standard)</strong>
                  </div>
                  <div className="rule-card">
                    <span>Atmospheric Drag Coefficient:</span>
                    <strong>0.12 (Thin Atmosphere)</strong>
                  </div>
                  <div className="rule-card">
                    <span>Collision Engine:</span>
                    <strong>Continuous Collision Detection (CCD)</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
