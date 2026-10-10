import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  History,
  Sliders,
  Download,
  Search,
  Filter,
  Eye,
  Maximize2,
  X,
  AlertCircle,
  Settings,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { EmptyState } from '../../common/EmptyState';
import { Dialog } from '../../common/Dialog';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface ImageRecord {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  resolution: string;
  createdAt: string;
  imageUrl?: string;
  model: string;
  seed: number;
}

export const ImagesWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1024x1024 (Standard)');
  const [style, setStyle] = useState('Cinematic');
  const [outputsCount, setOutputsCount] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [steps, setSteps] = useState(30);
  const [seed, setSeed] = useState('-1');

  // Generation status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Gallery items - initialized empty or real stored
  const [gallery, setGallery] = useState<ImageRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [previewImage, setPreviewImage] = useState<ImageRecord | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      showToast('Please enter an image prompt', { type: 'warning' });
      return;
    }

    // Honest status - do NOT fabricate fake image results or fake generation
    setStatusMessage(
      'Image Generation Backend Disconnected: Real-time rendering requires a connected provider (Flux.1, Stability AI, Replicate, or Local ComfyUI). Configure your endpoint in Settings > Connected Services.'
    );
    showToast('Inference provider not connected', { type: 'warning' });
  };

  const aspectRatios = [
    { label: '1:1 Square', value: '1:1', ratioClass: 'ratio-1-1' },
    { label: '16:9 Cinema', value: '16:9', ratioClass: 'ratio-16-9' },
    { label: '9:16 Portrait', value: '9:16', ratioClass: 'ratio-9-16' },
    { label: '4:3 Classic', value: '4:3', ratioClass: 'ratio-4-3' },
    { label: '21:9 Ultra-Wide', value: '21:9', ratioClass: 'ratio-21-9' },
  ];

  const styles = [
    'Cinematic',
    'Photorealistic',
    'Digital Art',
    'Fantasy Oil',
    'Minimalist 3D',
    'Architectural',
    'Cyberpunk Nocturne',
  ];

  const filteredGallery = gallery.filter((item) =>
    item.prompt.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Images Studio"
        description="Cinematic high-fidelity image composition and latent visual generation studio"
        icon={ImageIcon}
        badge="Precision Studio"
        actions={
          <div className="header-action-cluster">
            {activeTab === 'create' ? (
              <button
                type="button"
                className="gold-ghost-btn"
                onClick={() => setActiveTab('history')}
              >
                <History size={14} />
                <span>Previous Images ({gallery.length})</span>
              </button>
            ) : (
              <button
                type="button"
                className="gold-primary-btn"
                onClick={() => setActiveTab('create')}
              >
                <Sparkles size={14} />
                <span>Create Image</span>
              </button>
            )}
          </div>
        }
      />

      {activeTab === 'create' ? (
        <div className="image-studio-layout">
          {/* Main Prompt & Parameter Canvas */}
          <div className="image-studio-main">
            <form onSubmit={handleGenerate} className="image-composer-card">
              <div className="composer-card-header">
                <span className="composer-label">Creative Prompt</span>
                <span className="composer-char-count">{prompt.length} chars</span>
              </div>

              <textarea
                className="image-prompt-textarea"
                rows={4}
                placeholder="Describe your scene in detail: majestic celestial spires reflected in midnight waters, golden hour volumetric fog, 8k cinematic masterpiece..."
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (statusMessage) setStatusMessage(null);
                }}
              />

              {/* Style Presets */}
              <div className="composer-field-group">
                <label className="field-group-label">Aesthetic Style</label>
                <div className="style-pills-row">
                  {styles.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`style-pill ${style === s ? 'active' : ''}`}
                      onClick={() => setStyle(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Selection */}
              <div className="composer-field-group">
                <label className="field-group-label">Aspect Ratio</label>
                <div className="aspect-ratio-selector-grid">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.value}
                      type="button"
                      className={`aspect-card ${aspectRatio === ar.value ? 'active' : ''}`}
                      onClick={() => setAspectRatio(ar.value)}
                    >
                      <div className={`aspect-box-preview ${ar.ratioClass}`} />
                      <span className="aspect-label">{ar.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution & Outputs */}
              <div className="form-row-2">
                <div className="composer-field-group">
                  <label className="field-group-label">Target Resolution</label>
                  <select
                    className="form-select"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  >
                    <option value="1024x1024 (Standard)">1024 &times; 1024 (Standard)</option>
                    <option value="2048x2048 (High-Res 2K)">2048 &times; 2048 (High-Res 2K)</option>
                    <option value="4096x2160 (4K Cinema)">4096 &times; 2160 (4K Cinema)</option>
                  </select>
                </div>

                <div className="composer-field-group">
                  <label className="field-group-label">Number of Outputs</label>
                  <div className="outputs-toggle-group">
                    {[1, 2, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`output-btn ${outputsCount === num ? 'active' : ''}`}
                        onClick={() => setOutputsCount(num)}
                      >
                        {num} {num === 1 ? 'image' : 'images'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collapsible Advanced Parameters */}
              <div className="advanced-options-accordion">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                >
                  <div className="trigger-left">
                    <Sliders size={14} />
                    <span>Advanced Inference Parameters (CFG, Seed, Steps)</span>
                  </div>
                  {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isAdvancedOpen && (
                  <div className="accordion-content">
                    <div className="form-field">
                      <label className="form-label">Negative Prompt</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ugly, deformed, blurry, low quality, artifacts"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                      />
                    </div>

                    <div className="form-row-3">
                      <div className="form-field">
                        <label className="form-label">Guidance Scale (CFG): {cfgScale}</label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="0.5"
                          value={cfgScale}
                          onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                          className="range-input"
                        />
                      </div>

                      <div className="form-field">
                        <label className="form-label">Sampling Steps: {steps}</label>
                        <input
                          type="range"
                          min="15"
                          max="60"
                          step="1"
                          value={steps}
                          onChange={(e) => setSteps(parseInt(e.target.value, 10))}
                          className="range-input"
                        />
                      </div>

                      <div className="form-field">
                        <label className="form-label">Seed (-1 for random)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={seed}
                          onChange={(e) => setSeed(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Notice / Integration Boundary */}
              {statusMessage && (
                <div className="service-status-banner warning">
                  <AlertCircle size={16} />
                  <div className="status-banner-text">
                    <strong>Service Integration Boundary</strong>
                    <p>{statusMessage}</p>
                    <button
                      type="button"
                      className="gold-ghost-btn small"
                      onClick={() => navigate('settings')}
                    >
                      Configure Provider in Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="composer-submit-row">
                <button type="submit" className="gold-primary-btn large">
                  <Sparkles size={16} />
                  <span>Generate Image</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Info / Provider Capabilities Panel */}
          <aside className="image-studio-sidebar">
            <div className="studio-info-card">
              <h3 className="info-card-title">Generation Architecture</h3>
              <p className="info-card-desc">
                ARTI supports broad visual synthesis across photorealistic, cinematic, and illustrative pipelines.
              </p>
              <div className="capability-checklist">
                <div className="capability-row">
                  <span className="cap-label">Target Resolutions</span>
                  <span className="cap-val">Up to native 4K UHD</span>
                </div>
                <div className="capability-row">
                  <span className="cap-label">Latent Seed Lock</span>
                  <span className="cap-val">Enabled</span>
                </div>
                <div className="capability-row">
                  <span className="cap-label">Model Pipeline</span>
                  <span className="cap-val disconnected">Awaiting API Key</span>
                </div>
              </div>
            </div>

            <div className="studio-info-card subtle">
              <h4 className="info-card-subtitle">Zero Fabrication Guarantee</h4>
              <p className="info-card-footnote">
                ARTI never fabricates fake generated images or simulated success when backend providers are disconnected.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        /* History / Gallery View */
        <div className="image-history-view">
          <div className="history-toolbar">
            <div className="toolbar-search-box">
              <Search size={14} className="toolbar-search-icon" />
              <input
                type="text"
                className="toolbar-search-input"
                placeholder="Search previously generated images..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          {filteredGallery.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No previous generated images"
              description="Generated images will appear here once an inference provider is connected in Settings and image generation is triggered."
              actionLabel="Return to Image Studio"
              onAction={() => setActiveTab('create')}
            />
          ) : (
            <div className="image-gallery-grid">
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  className="gallery-card"
                  onClick={() => setPreviewImage(item)}
                >
                  <div className="gallery-card-img-placeholder">
                    <ImageIcon size={32} />
                  </div>
                  <div className="gallery-card-overlay">
                    <p className="gallery-card-prompt">{item.prompt}</p>
                    <div className="gallery-card-meta">
                      <span>{item.aspectRatio}</span>
                      <span>&middot;</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title="Image Artifact Details"
          maxWidth="680px"
        >
          <div className="image-preview-modal-body">
            <div className="preview-img-box">
              <ImageIcon size={48} />
            </div>
            <div className="preview-meta-details">
              <h4>Prompt</h4>
              <p className="preview-prompt-text">{previewImage.prompt}</p>
              <div className="preview-specs-table">
                <div><span>Aspect Ratio:</span> <strong>{previewImage.aspectRatio}</strong></div>
                <div><span>Resolution:</span> <strong>{previewImage.resolution}</strong></div>
                <div><span>Style:</span> <strong>{previewImage.style}</strong></div>
                <div><span>Seed:</span> <strong>{previewImage.seed}</strong></div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
