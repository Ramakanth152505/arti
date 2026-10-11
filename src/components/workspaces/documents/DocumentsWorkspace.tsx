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
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { EmptyState } from '../../common/EmptyState';
import { DemoDataNotice } from '../../common/DemoDataNotice';
import { useWorkspaceData } from '../../../hooks/useWorkspaceData';
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

const DEMO_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'ARTI AI Architecture Notes',
    template: 'Technical Whitepaper',
    updatedAt: 'Today, 11:20 AM',
    version: 'v1.4',
    wordCount: 840,
    content: `# ARTI AI: Universal Workspace Foundation

## 1. Overview
ARTI AI is a premium universal workspace front end combining a cinematic interface with a modular module system.

## 2. Decoupled Architecture
The system separates concerns between:
- Interactive Client Canvas (React + Vite)
- Navigation and workspace shell
- Planned orchestration and model integration boundaries

## 3. Storage
Records you create are stored in this browser\u2019s local storage on this device. No encryption layer is applied and nothing is sent to a server.`,
  },
  {
    id: 'doc-2',
    title: 'Privacy & Data Handling Notes',
    template: 'Creative Manifesto',
    updatedAt: 'Yesterday',
    version: 'v1.0',
    wordCount: 320,
    content: `# Privacy & Data Handling Notes

*Local-first and honest by default.*

Principles for this build:
1. No telemetry is collected.
2. Data stays in this browser on this device.
3. No result is presented as real unless it was actually produced.`,
  },
];

export const DocumentsWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const {
    items: documents,
    isDemo,
    addItem,
    updateItem,
    clear,
  } = useWorkspaceData<DocumentItem>('documents', () => DEMO_DOCUMENTS);

  const [activeDocId, setActiveDocId] = useState<string>('doc-1');
  const [searchQuery, setSearchQuery] = useState('');

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
    addItem(newDoc);
    setActiveDocId(newDoc.id);
    showToast('New document created', { type: 'gold' });
  };

  const handleUpdateContent = (newContent: string) => {
    if (!activeDoc) return;
    const words = newContent.trim().split(/\s+/).filter(Boolean).length;
    updateItem(activeDoc.id, (d) => ({
      ...d,
      content: newContent,
      wordCount: words,
      updatedAt: 'Just now',
    }));
  };

  const handleExport = () => {
    if (!activeDoc) {
      showToast('No document selected to export.', { type: 'warning' });
      return;
    }
    if (activeDoc.content.trim().length === 0) {
      showToast('Nothing to export: the document is empty.', { type: 'warning' });
      return;
    }
    const blob = new Blob([activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${activeDoc.title} as Markdown`, { type: 'gold' });
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
              onClick={handleExport}
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
        {isDemo && (
          <div className="demo-notice-span">
            <DemoDataNotice
              message="These example documents are illustrative only and are not real saved work."
              onClear={() => {
                clear();
                setActiveDocId('');
              }}
            />
          </div>
        )}
        {/* Left Column: Documents Directory */}
        <aside className="documents-sidebar-column">
          <div className="doc-search-box">
            <Search size={14} className="doc-search-icon" />
            <input
              type="text"
              className="doc-search-input field-integrated"
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
          {!activeDoc ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Create your first document to start writing whitepapers, briefs, or notes. Documents are saved in your browser."
              actionLabel="New Document"
              onAction={handleCreateDocument}
            />
          ) : (
          <>
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
          </>
          )}
        </main>
      </div>
    </div>
  );
};
