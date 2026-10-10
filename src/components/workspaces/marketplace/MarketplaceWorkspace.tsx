import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { useToast } from '../../../context/ToastContext';

interface ExtensionItem {
  id: string;
  name: string;
  category: 'Agent Packs' | 'Toolkits' | 'Workflows' | 'Visual Models' | 'Sound Packs';
  description: string;
  status: 'Open Protocol' | 'Planned Integration' | 'Verified Core';
  version: string;
  author: string;
}

const EXTENSIONS: ExtensionItem[] = [
  {
    id: 'ext-1',
    name: 'Autonomous Systems Engineer Agent Pack',
    category: 'Agent Packs',
    description: 'Fleet of 4 specialized software engineering agents for TypeScript, Rust, and WebGL.',
    status: 'Verified Core',
    version: 'v2.1',
    author: 'ARTI Core Labs',
  },
  {
    id: 'ext-2',
    name: 'Local ComfyUI / Stable Diffusion Connector',
    category: 'Toolkits',
    description: 'Websocket bridge to self-hosted local ComfyUI instances for zero-cloud image generation.',
    status: 'Open Protocol',
    version: 'v1.0',
    author: 'Open Community Spec',
  },
  {
    id: 'ext-3',
    name: 'Cinematic Storyboard Long-Form Assembly Workflow',
    category: 'Workflows',
    description: '12-stage production pipeline for multi-scene narrative consistency and audio alignment.',
    status: 'Planned Integration',
    version: 'v0.9',
    author: 'Cinema Architecture Team',
  },
  {
    id: 'ext-4',
    name: 'Symphonic Orchestral Latent Sound Pack',
    category: 'Sound Packs',
    description: 'Curated harmonic soundbed presets and orchestral instruments for cinema scores.',
    status: 'Open Protocol',
    version: 'v1.2',
    author: 'Audio Synthesis Foundation',
  },
];

export const MarketplaceWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [selectedExt, setSelectedExt] = useState<ExtensionItem | null>(null);

  const filteredExtensions = EXTENSIONS.filter((ext) => {
    const matchesSearch =
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || ext.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Marketplace &amp; Capability Exchange"
        description="Discover specialist agent fleets, verified protocol connectors, and production workflows"
        icon={ShoppingBag}
        badge="Open Architecture"
      />

      {/* Toolbar */}
      <div className="workspace-toolbar">
        <div className="toolbar-search-box">
          <Search size={14} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search extensions, workflows, or agent packs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filter-cluster">
          <div className="toolbar-select-wrap">
            <select
              className="toolbar-select"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Agent Packs">Agent Packs</option>
              <option value="Toolkits">Toolkits</option>
              <option value="Workflows">Workflows</option>
              <option value="Visual Models">Visual Models</option>
              <option value="Sound Packs">Sound Packs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sovereign Manifesto Notice */}
      <div className="workspace-storage-callout">
        <Shield size={13} className="callout-icon" />
        <span>
          Non-Commercial Architecture: No paywalls, paid credits, or monetization tiers. All extensions follow open protocols.
        </span>
      </div>

      {/* Extensions Grid */}
      <div className="extensions-grid">
        {filteredExtensions.map((ext) => (
          <div
            key={ext.id}
            className="extension-card"
            onClick={() => setSelectedExt(ext)}
          >
            <div className="extension-card-header">
              <span className="ext-cat-tag">{ext.category}</span>
              <span className={`ext-status-pill status-${ext.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {ext.status}
              </span>
            </div>

            <h3 className="ext-name">{ext.name}</h3>
            <p className="ext-desc">{ext.description}</p>

            <div className="ext-footer">
              <span>{ext.author}</span>
              <span>{ext.version}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Extension Modal */}
      {selectedExt && (
        <Dialog
          isOpen={Boolean(selectedExt)}
          onClose={() => setSelectedExt(null)}
          title={selectedExt.name}
          description={selectedExt.description}
        >
          <div className="tool-detail-dialog-body">
            <div className="detail-specs-grid">
              <div className="spec-card">
                <span className="spec-label">Category</span>
                <span className="spec-val">{selectedExt.category}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Protocol Status</span>
                <span className="spec-val">{selectedExt.status}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Author / Organization</span>
                <span className="spec-val">{selectedExt.author}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Version</span>
                <span className="spec-val">{selectedExt.version}</span>
              </div>
            </div>

            <div className="service-status-banner info">
              <AlertCircle size={15} />
              <div className="status-banner-text">
                <strong>Protocol Standard Specification</strong>
                <p>
                  ARTI extensions run in isolated client sandboxes. To enable custom workflows, configure their schema definition in your project directory.
                </p>
              </div>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="gold-ghost-btn"
                onClick={() => setSelectedExt(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="gold-primary-btn"
                onClick={() => {
                  setSelectedExt(null);
                  showToast(`Selected protocol: ${selectedExt.name}`, { type: 'gold' });
                }}
              >
                Inspect Schema
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
