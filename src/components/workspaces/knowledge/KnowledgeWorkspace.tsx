import React, { useState } from 'react';
import {
  Database,
  Search,
  Plus,
  Upload,
  FileText,
  Tag,
  Shield,
  Layers,
  CheckCircle2,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface KnowledgeItem {
  id: string;
  title: string;
  space: 'System Core' | 'Projects' | 'Research' | 'Security';
  fileType: 'PDF' | 'Markdown' | 'Schema' | 'Code';
  size: string;
  updatedAt: string;
  tags: string[];
}

export const KnowledgeWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<string>('All');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [items, setItems] = useState<KnowledgeItem[]>([
    {
      id: 'kn-1',
      title: 'ARTI AI Sovereign Operating Specification.pdf',
      space: 'System Core',
      fileType: 'PDF',
      size: '2.4 MB',
      updatedAt: 'Today',
      tags: ['Architecture', 'Specification', 'Security'],
    },
    {
      id: 'kn-2',
      title: 'DAG Task Engine Execution Schema.json',
      space: 'Projects',
      fileType: 'Schema',
      size: '142 KB',
      updatedAt: 'Yesterday',
      tags: ['DAG', 'JSONSchema', 'TaskEngine'],
    },
    {
      id: 'kn-3',
      title: 'Client Memory AES-256 Storage Implementation.ts',
      space: 'Security',
      fileType: 'Code',
      size: '48 KB',
      updatedAt: '3 days ago',
      tags: ['Cryptography', 'IndexedDB', 'ClientStore'],
    },
  ]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesSpace = selectedSpace === 'All' || item.space === selectedSpace;
    return matchesSearch && matchesSpace;
  });

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Knowledge Base Vault"
        description="Private vector memory, indexed documentation vaults, and encrypted project reference stores"
        icon={Database}
        badge="Encrypted Vault"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() => setIsImportOpen(true)}
            >
              <Upload size={14} />
              <span>Import Document</span>
            </button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="workspace-toolbar">
        <div className="toolbar-search-box">
          <Search size={14} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search indexed knowledge documents, tags, or schemas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filter-cluster">
          <div className="toolbar-select-wrap">
            <select
              className="toolbar-select"
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
            >
              <option value="All">All Spaces</option>
              <option value="System Core">System Core</option>
              <option value="Projects">Projects</option>
              <option value="Research">Research</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Knowledge Index Status Callout */}
      <div className="workspace-storage-callout">
        <HardDrive size={13} className="callout-icon" />
        <span>
          Vector Memory State: Client In-Memory Float32 Index Active (Zero WAN Egress).
        </span>
      </div>

      {/* Documents Table / Grid */}
      <div className="knowledge-items-grid">
        {filteredItems.map((doc) => (
          <div key={doc.id} className="knowledge-card">
            <div className="knowledge-card-header">
              <span className="knowledge-space-tag">{doc.space}</span>
              <span className="knowledge-type-tag">{doc.fileType}</span>
            </div>

            <h3 className="knowledge-card-title">{doc.title}</h3>

            <div className="knowledge-card-tags">
              {doc.tags.map((t) => (
                <span key={t} className="knowledge-tag">
                  #{t}
                </span>
              ))}
            </div>

            <div className="knowledge-card-footer">
              <span>{doc.size}</span>
              <span>&middot;</span>
              <span>{doc.updatedAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Import Modal */}
      <Dialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Knowledge Document"
        description="Embed local PDF, Markdown, or JSON specifications into client vault"
      >
        <div className="import-dropzone" onClick={() => showToast('Simulating file selection...', { type: 'info' })}>
          <Upload size={32} className="dropzone-icon" />
          <p className="dropzone-prompt">Drag &amp; drop files here, or click to browse</p>
          <span className="dropzone-meta">Supports PDF, Markdown, JSON, and TypeScript</span>
        </div>

        <div className="form-actions-row">
          <button
            type="button"
            className="gold-ghost-btn"
            onClick={() => setIsImportOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="gold-primary-btn"
            onClick={() => {
              setIsImportOpen(false);
              showToast('Document indexed into local client vector vault', { type: 'success' });
            }}
          >
            Complete Import
          </button>
        </div>
      </Dialog>
    </div>
  );
};
