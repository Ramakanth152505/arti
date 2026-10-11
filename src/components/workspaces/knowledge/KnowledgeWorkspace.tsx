import React, { useRef, useState } from 'react';
import {
  Database,
  Search,
  Upload,
  HardDrive,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { EmptyState } from '../../common/EmptyState';
import { DemoDataNotice } from '../../common/DemoDataNotice';
import { useWorkspaceData } from '../../../hooks/useWorkspaceData';
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

const DEMO_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
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
    title: 'Local Storage Persistence Notes.ts',
    space: 'Security',
    fileType: 'Code',
    size: '48 KB',
    updatedAt: '3 days ago',
    tags: ['localStorage', 'ClientStore', 'Privacy'],
  },
];

export const KnowledgeWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<string>('All');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    isDemo,
    addItem,
    clear,
  } = useWorkspaceData<KnowledgeItem>('knowledge', () => DEMO_KNOWLEDGE_ITEMS);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added: KnowledgeItem[] = [];
    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const fileType: KnowledgeItem['fileType'] =
        ext === 'pdf' ? 'PDF'
        : ext === 'json' ? 'Schema'
        : ext === 'md' || ext === 'markdown' ? 'Markdown'
        : 'Code';
      const sizeKb = file.size / 1024;
      added.push({
        id: 'kn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        title: file.name,
        space: 'Projects',
        fileType,
        size: sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(sizeKb))} KB`,
        updatedAt: 'Just now',
        tags: ['Imported'],
      });
    });
    added.reverse().forEach((item) => addItem(item));
    setIsImportOpen(false);
    showToast(`Indexed ${added.length} local file reference${added.length > 1 ? 's' : ''}`, {
      type: 'success',
    });
  };

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
        title="Knowledge Base"
        description="Indexed documents and reference stores. Items you add are kept in this browser on this device."
        icon={Database}
        badge="Local-First"
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
            className="toolbar-search-input field-integrated"
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
          Local file reference index. Text extraction and semantic search require a configured provider.
        </span>
      </div>

      {isDemo && (
        <DemoDataNotice
          message="These example entries are placeholders and are not real indexed files."
          onClear={clear}
        />
      )}

      {/* Documents Table / Grid */}
      <div className="knowledge-items-grid">
        {filteredItems.length === 0 ? (
          <div className="demo-notice-span">
            <EmptyState
              icon={Database}
              title="No knowledge documents"
              description="Import a local file to add a reference to your knowledge vault, or adjust your search filters."
              actionLabel="Import Document"
              onAction={() => setIsImportOpen(true)}
            />
          </div>
        ) : (
        filteredItems.map((doc) => (
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
        ))
        )}
      </div>

      {/* Import Modal */}
      <Dialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Add Local File Reference"
        description="Register a local file in your knowledge index. The file stays on your device."
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <div
          className="import-dropzone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
        >
          <Upload size={32} className="dropzone-icon" />
          <p className="dropzone-prompt">Click to select files from your device</p>
          <span className="dropzone-meta">References PDF, Markdown, JSON, and code files by name and size</span>
        </div>

        <div className="form-actions-row">
          <button
            type="button"
            className="gold-ghost-btn"
            onClick={() => setIsImportOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Dialog>
    </div>
  );
};
