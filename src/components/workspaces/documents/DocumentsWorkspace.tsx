import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Quote,
  Code,
  Download,
  History,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface DocumentItem {
  id: string;
  title: string;
  template: string;
  updatedAt: string;
  content: string;
  wordCount: number;
  version: string;
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'ARTI AI Architecture Whitepaper',
    template: 'Technical Whitepaper',
    updatedAt: 'Today, 11:20 AM',
    version: 'v1.4',
    wordCount: 840,
    content: `# ARTI AI: High-Performance Universal Autonomous Workspace

## 1. System Abstract
ARTI AI is engineered as an ultra-luxury, zero-telemetry command environment combining cinematic aesthetics with deterministic multi-agent execution.

## 2. Decoupled Architecture
The system enforces strict separation between:
- Interactive Client Canvas (React 19 / Vite)
- Orchestration DAG & Task Scheduling Loop
- Independent Model Providers and Synthesis Workers

## 3. Cryptographic Session Protocol
Session state resides exclusively in local IndexedDB storage with AES-256 client encryption, guaranteeing privacy.`,
  },
  {
    id: 'doc-2',
    title: 'Zero-Telemetry Privacy Manifesto',
    template: 'Creative Manifesto',
    updatedAt: 'Yesterday',
    version: 'v1.0',
    wordCount: 320,
    content: `# The Sovereign Intelligence Manifesto

*This AI is only for me. Simple on the surface. Extremely powerful underneath.*

We believe intelligence tools must respect computational sovereignty:
1. No telemetry without explicit user configuration.
2. Local-first persistence.
3. Deterministic verification over fabricated results.`,
  },
];

export const DocumentsWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>(DEFAULT_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState('doc-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  const handleCreateDocument = () => {
    const newDoc: DocumentItem = {
      id: 'doc-' + Date.now(),
      title: 'Untitled Executive Brief',
      template: 'Executive Brief',
      updatedAt: 'Just now',
      version: 'v1.0',
      wordCount: 12,
      content: `# Untitled Executive Brief\n\nOutline the primary objectives and key initiatives here.`,
    };
    setDocuments([newDoc, ...documents]);
    setActiveDocId(newDoc.id);
    showToast('New document created', { type: 'gold' });
  };

  const handleUpdateContent = (newContent: string) => {
    const words = newContent.trim().split(/\s+/).filter(Boolean).length;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDocId ? { ...d, content: newContent, wordCount: words, updatedAt: 'Just now' } : d
      )
    );
  };

  const handleExport = (format: string) => {
    showToast(`Exported document as ${format}`, { type: 'gold' });
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Documents Studio"
        description="Technical whitepapers, executive briefs, and markdown publishing with version history"
        icon={FileText}
        badge="Markdown Studio"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={() => setIsVersionDrawerOpen(!isVersionDrawerOpen)}
              title="View revision snapshots"
            >
              <History size={14} />
              <span>Revisions ({activeDoc.version})</span>
            </button>
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={() => handleExport('Markdown (.md)')}
              title="Download file"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              onClick={handleCreateDocument}
            >
              <Plus size={15} />
              <span>New Document</span>
            </button>
          </div>
        }
      />

      <div className="documents-studio-grid">
        {/* Left Column: Documents Directory */}
        <aside className="documents-sidebar-column">
          <div className="doc-search-box">
            <Search size={14} className="doc-search-icon" />
            <input
              type="text"
              className="doc-search-input"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="doc-library-list">
            {documents
              .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((doc) => {
                const isActive = doc.id === activeDocId;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    className={`doc-list-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveDocId(doc.id)}
                  >
                    <span className="doc-item-title">{doc.title}</span>
                    <div className="doc-item-meta">
                      <span className="doc-item-template">{doc.template}</span>
                      <span>&middot;</span>
                      <span className="doc-item-time">{doc.updatedAt}</span>
                    </div>
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Center/Right: Markdown Editor & Preview */}
        <main className="documents-main-column">
          {/* Document Editor Toolbar */}
          <div className="doc-toolbar-bar">
            <div className="doc-format-group">
              <button
                type="button"
                className="format-btn"
                onClick={() => handleUpdateContent(activeDoc.content + '\n**Bold Text**')}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => handleUpdateContent(activeDoc.content + '\n*Italic Text*')}
                title="Italic"
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => handleUpdateContent(activeDoc.content + '\n# Heading 1\n')}
                title="Heading 1"
              >
                <Heading1 size={14} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => handleUpdateContent(activeDoc.content + '\n## Heading 2\n')}
                title="Heading 2"
              >
                <Heading2 size={14} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => handleUpdateContent(activeDoc.content + '\n- Bullet Item\n')}
                title="Bullet List"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => handleUpdateContent(activeDoc.content + '\n> Blockquote text\n')}
                title="Quote"
              >
                <Quote size={13} />
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => handleUpdateContent(activeDoc.content + '\n```\n// code here\n```\n')}
                title="Code Block"
              >
                <Code size={13} />
              </button>
            </div>

            <div className="doc-stat-group">
              <span>{activeDoc.wordCount} words</span>
              <span>&middot;</span>
              <span>{activeDoc.version}</span>
            </div>
          </div>

          {/* Text Editor Area */}
          <div className="doc-editor-canvas">
            <textarea
              className="doc-markdown-textarea"
              value={activeDoc.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              placeholder="Begin writing document..."
            />
          </div>
        </main>
      </div>
    </div>
  );
};
