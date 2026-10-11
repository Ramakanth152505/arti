import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';

interface ExtensionItem {
  id: string;
  name: string;
  category: 'Agent Packs' | 'Toolkits' | 'Workflows' | 'Visual Models' | 'Sound Packs';
  description: string;
  status: 'Planned Integration' | 'Conceptual';
  version: string;
  author: string;
}

const PLANNED_EXTENSIONS: ExtensionItem[] = [
  {
    id: 'ext-1',
    name: 'Autonomous Systems Engineer Agent Pack',
    category: 'Agent Packs',
    description: 'Concept for a fleet of specialized software engineering agents for TypeScript, Rust, and WebGL.',
    status: 'Planned Integration',
    version: 'Not released',
    author: 'Proposed',
  },
  {
    id: 'ext-2',
    name: 'Local Image Generation Connector',
    category: 'Toolkits',
    description: 'Concept for a bridge to self-hosted local generation instances for zero-cloud image creation.',
    status: 'Planned Integration',
    version: 'Not released',
    author: 'Proposed',
  },
  {
    id: 'ext-3',
    name: 'Cinematic Storyboard Long-Form Assembly Workflow',
    category: 'Workflows',
    description: 'Concept for a multi-stage production pipeline for multi-scene narrative consistency and audio alignment.',
    status: 'Conceptual',
    version: 'Not released',
    author: 'Proposed',
  },
  {
    id: 'ext-4',
    name: 'Orchestral Latent Sound Pack',
    category: 'Sound Packs',
    description: 'Concept for curated harmonic soundbed presets and orchestral instruments for cinema scores.',
    status: 'Conceptual',
    version: 'Not released',
    author: 'Proposed',
  },
];

export const MarketplaceWorkspace: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [selectedExt, setSelectedExt] = useState<ExtensionItem | null>(null);

  const filteredExtensions = PLANNED_EXTENSIONS.filter((ext) => {
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
        description="Explore planned specialist agent fleets, planned protocol connectors, and future workflows"
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
          No paywalls, paid credits, or monetization tiers. Entries below are proposed concepts, not installed or available extensions.
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
                <strong>Proposed Concept</strong>
                <p>
                  This entry describes a planned integration concept. It is not installed, downloadable, or
                  available for use in this build.
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
                disabled
                title="No install or download service is configured"
              >
                Not Available
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
