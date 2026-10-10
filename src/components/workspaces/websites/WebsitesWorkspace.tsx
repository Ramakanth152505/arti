import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  Code,
  Eye,
  Download,
  UploadCloud,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface WebsitePage {
  id: string;
  name: string;
  route: string;
  sectionsCount: number;
}

export const WebsitesWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();

  const [brief, setBrief] = useState(
    'Create an ultra-luxury private AI terminal interface website with midnight navy backgrounds, warm gold typography, cinematic glass cards, and responsive layout.'
  );
  const [template, setTemplate] = useState('Cinematic Dark Luxury');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'structure'>('preview');

  const [pages, setPages] = useState<WebsitePage[]>([
    { id: 'p-1', name: 'Home Landing', route: '/', sectionsCount: 6 },
    { id: 'p-2', name: 'Architecture & Engine', route: '/architecture', sectionsCount: 4 },
    { id: 'p-3', name: 'Privacy & Security', route: '/security', sectionsCount: 3 },
    { id: 'p-4', name: 'Manifesto', route: '/manifesto', sectionsCount: 2 },
  ]);
  const [activePageId, setActivePageId] = useState('p-1');

  const templates = [
    'Cinematic Dark Luxury',
    'Minimal Obsidian Editorial',
    'Cybernetic Systems SaaS',
    'Architectural Precision Portfolio',
  ];

  const handleExportZip = () => {
    showToast('Exporting static HTML/Tailwind project bundle...', { type: 'gold' });
  };

  const handlePublish = () => {
    showToast(
      'Static export generated. Cloud deployment provider (Vercel / Cloudflare) is not configured in this private session.',
      { type: 'warning' }
    );
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Websites Studio"
        description="Natural-language website architecture synthesis, responsive viewport studio, and template explorer"
        icon={Globe}
        badge="Responsive Builder"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={handleExportZip}
              title="Download HTML & Tailwind bundle"
            >
              <Download size={14} />
              <span>Export Code</span>
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              onClick={handlePublish}
              title="Publish website"
            >
              <UploadCloud size={14} />
              <span>Publish</span>
            </button>
          </div>
        }
      />

      {/* Main Studio Grid */}
      <div className="website-studio-grid">
        {/* Left Specification & Page Tree Column */}
        <aside className="website-spec-column">
          <div className="spec-card">
            <h3 className="spec-card-heading">Natural-Language Brief</h3>
            <textarea
              className="spec-brief-textarea"
              rows={4}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe website objective, audience, and visual styling..."
            />
            <div className="spec-style-row">
              <label className="spec-field-label">Template Aesthetic</label>
              <select
                className="form-select"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Page & Route Tree */}
          <div className="spec-card">
            <div className="spec-card-header-row">
              <h3 className="spec-card-heading">Page Structure ({pages.length})</h3>
              <button
                type="button"
                className="spec-mini-btn"
                onClick={() => {
                  const newPage: WebsitePage = {
                    id: 'p-' + Date.now(),
                    name: `Page ${pages.length + 1}`,
                    route: `/page-${pages.length + 1}`,
                    sectionsCount: 3,
                  };
                  setPages([...pages, newPage]);
                  setActivePageId(newPage.id);
                  showToast('Added page to route tree', { type: 'gold' });
                }}
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="pages-list-tree">
              {pages.map((p) => {
                const isActive = p.id === activePageId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`page-tree-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActivePageId(p.id)}
                  >
                    <div className="tree-item-title-row">
                      <span className="tree-item-name">{p.name}</span>
                      <span className="tree-item-route">{p.route}</span>
                    </div>
                    <span className="tree-item-sections">{p.sectionsCount} sections</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="spec-card subtle">
            <div className="engine-boundary-notice">
              <FileCode size={13} />
              <span>Boundary: Static bundle generation ready. Hosting runner decoupled.</span>
            </div>
          </div>
        </aside>

        {/* Center/Right Live Responsive Viewport & Code Area */}
        <main className="website-preview-column">
          {/* Viewport & View Mode Controls Toolbar */}
          <div className="preview-toolbar-row">
            <div className="view-mode-tabs">
              <button
                type="button"
                className={`view-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye size={13} />
                <span>Visual Canvas</span>
              </button>
              <button
                type="button"
                className={`view-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                <Code size={13} />
                <span>Code Output</span>
              </button>
              <button
                type="button"
                className={`view-tab-btn ${activeTab === 'structure' ? 'active' : ''}`}
                onClick={() => setActiveTab('structure')}
              >
                <Layers size={13} />
                <span>Components</span>
              </button>
            </div>

            {/* Responsive Viewport Switchers */}
            <div className="responsive-viewport-switch">
              <button
                type="button"
                className={`viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
                onClick={() => setViewport('desktop')}
                title="Desktop (1920px)"
              >
                <Monitor size={14} />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                className={`viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
                onClick={() => setViewport('tablet')}
                title="Tablet (768px)"
              >
                <Tablet size={14} />
                <span>Tablet</span>
              </button>
              <button
                type="button"
                className={`viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewport('mobile')}
                title="Mobile (375px)"
              >
                <Smartphone size={14} />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Viewport Frame Container */}
          <div className="viewport-stage">
            <div className={`viewport-mock-frame frame-${viewport}`}>
              {activeTab === 'preview' ? (
                <div className="mock-site-render">
                  {/* Mock Site Header */}
                  <header className="mock-site-nav">
                    <span className="mock-site-logo">ARTI AI</span>
                    <nav className="mock-site-links">
                      <span>Home</span>
                      <span>Architecture</span>
                      <span>Security</span>
                    </nav>
                  </header>

                  {/* Mock Site Hero */}
                  <div className="mock-site-hero">
                    <span className="mock-site-badge">{template}</span>
                    <h2 className="mock-site-h1">Autonomous Intelligence Operating Environment</h2>
                    <p className="mock-site-sub">
                      Private, encrypted, and designed for infinite exploratory creation.
                    </p>
                    <div className="mock-site-ctas">
                      <button type="button" className="mock-cta-primary">
                        Enter Workspace
                      </button>
                      <button type="button" className="mock-cta-ghost">
                        Read Whitepaper
                      </button>
                    </div>
                  </div>

                  {/* Mock Feature Grid */}
                  <div className="mock-site-grid">
                    <div className="mock-card">
                      <h4>Deterministic Task Engine</h4>
                      <p>Multi-agent orchestration with verifiable proof of execution.</p>
                    </div>
                    <div className="mock-card">
                      <h4>Client-Side Isolation</h4>
                      <p>Zero telemetry. Local memory protected with AES-256 client cryptography.</p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'code' ? (
                <div className="mock-code-viewer">
                  <pre className="code-block">
{`<!-- ARTI Generated Website Page: ${pages.find((p) => p.id === activePageId)?.name} -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARTI AI &middot; ${template}</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body class="bg-[#050811] text-[#f8fafc] font-sans antialiased">
  <header class="border-b border-white/10 px-8 py-4 flex justify-between">
    <div class="font-serif text-[#c9a84e] font-bold">ARTI AI</div>
  </header>
  <!-- Generated Components -->
</body>
</html>`}
                  </pre>
                </div>
              ) : (
                <div className="mock-structure-viewer">
                  <div className="structure-section-item">
                    <span className="sec-tag">Header</span>
                    <span className="sec-desc">Global Navigation &middot; Logo &middot; Actions</span>
                  </div>
                  <div className="structure-section-item">
                    <span className="sec-tag">Hero</span>
                    <span className="sec-desc">H1 Headline &middot; Subtitle &middot; Dual CTA Group</span>
                  </div>
                  <div className="structure-section-item">
                    <span className="sec-tag">Feature Grid</span>
                    <span className="sec-desc">2-Column Card Matrix with Gold Hairline Borders</span>
                  </div>
                  <div className="structure-section-item">
                    <span className="sec-tag">Footer</span>
                    <span className="sec-desc">Legal Notice &middot; Private Encryption Badge</span>
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
