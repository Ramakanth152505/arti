import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Filter,
  Code,
  Database,
  Film,
  Globe,
  Shield,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface ToolDef {
  id: string;
  name: string;
  category: 'Code & Dev' | 'Data & Storage' | 'Media Processing' | 'Search & Web' | 'Security';
  description: string;
  status: 'Available Locally' | 'Configured' | 'Configuration Required' | 'Planned';
  executionModel: 'Synchronous Client' | 'Async Worker' | 'Remote API';
  permissions: string;
}

const TOOL_CATALOG: ToolDef[] = [
  {
    id: 'tool-1',
    name: 'Topological DAG Planner',
    category: 'Code & Dev',
    description: 'Computes dependency order, node in-degree, and cycle detection for multi-agent tasks.',
    status: 'Available Locally',
    executionModel: 'Synchronous Client',
    permissions: 'Local Memory Only',
  },
  {
    id: 'tool-2',
    name: 'Client IndexedDB Vault',
    category: 'Data & Storage',
    description: 'High-capacity private browser persistence for artifacts, code files, and projects.',
    status: 'Available Locally',
    executionModel: 'Async Worker',
    permissions: 'Client Storage',
  },
  {
    id: 'tool-3',
    name: 'AES-256 GCM Session Cipher',
    category: 'Security',
    description: 'Client-side symmetric cryptography engine for zero-telemetry private workspaces.',
    status: 'Available Locally',
    executionModel: 'Synchronous Client',
    permissions: 'Cryptographic Subsystem',
  },
  {
    id: 'tool-4',
    name: 'WebGPU Shader Previewer',
    category: 'Media Processing',
    description: 'Real-time 60fps canvas shader simulation for visual materials and terrain.',
    status: 'Available Locally',
    executionModel: 'Async Worker',
    permissions: 'GPU Canvas Viewport',
  },
  {
    id: 'tool-5',
    name: 'Remote LLM Inference Connector',
    category: 'Code & Dev',
    description: 'Secure streaming API bridge for OpenAI, Anthropic, Gemini, or local Ollama endpoints.',
    status: 'Configuration Required',
    executionModel: 'Remote API',
    permissions: 'Network Egress (Authorized Endpoints)',
  },
  {
    id: 'tool-6',
    name: 'HNSW Vector Embedding Index',
    category: 'Data & Storage',
    description: 'Vector cosine similarity search across local documents and conversation memory.',
    status: 'Planned',
    executionModel: 'Async Worker',
    permissions: 'In-Memory Float32 Vectors',
  },
];

export const ToolsWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);

  const filteredTools = TOOL_CATALOG.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || t.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Tools &amp; Capabilities Directory"
        description="Modular execution tools, sandboxed system utilities, and verified capability adapters"
        icon={Wrench}
        badge={`${TOOL_CATALOG.length} Tools Cataloged`}
      />

      {/* Toolbar */}
      <div className="workspace-toolbar">
        <div className="toolbar-search-box">
          <Search size={14} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search tools, permissions, or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filter-cluster">
          <div className="toolbar-select-wrap">
            <Filter size={13} className="select-icon" />
            <select
              className="toolbar-select"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Code & Dev">Code &amp; Dev</option>
              <option value="Data & Storage">Data &amp; Storage</option>
              <option value="Media Processing">Media Processing</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="tools-catalog-grid">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="tool-card"
            onClick={() => setSelectedTool(tool)}
          >
            <div className="tool-card-header">
              <span className="tool-cat-tag">{tool.category}</span>
              <span className={`tool-status-pill status-${tool.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {tool.status}
              </span>
            </div>

            <h3 className="tool-card-title">{tool.name}</h3>
            <p className="tool-card-desc">{tool.description}</p>

            <div className="tool-card-footer">
              <div className="tool-runtime-meta">
                <Cpu size={12} />
                <span>{tool.executionModel}</span>
              </div>
              <div className="tool-perm-meta">
                <Shield size={12} />
                <span>{tool.permissions}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tool Details Modal */}
      {selectedTool && (
        <Dialog
          isOpen={Boolean(selectedTool)}
          onClose={() => setSelectedTool(null)}
          title={selectedTool.name}
          description={selectedTool.description}
        >
          <div className="tool-detail-dialog-body">
            <div className="detail-specs-grid">
              <div className="spec-card">
                <span className="spec-label">Category</span>
                <span className="spec-val">{selectedTool.category}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Integration Status</span>
                <span className="spec-val">{selectedTool.status}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Execution Model</span>
                <span className="spec-val">{selectedTool.executionModel}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Permissions</span>
                <span className="spec-val">{selectedTool.permissions}</span>
              </div>
            </div>

            {selectedTool.status === 'Configuration Required' && (
              <div className="service-status-banner warning">
                <AlertCircle size={15} />
                <div className="status-banner-text">
                  <strong>Configuration Required</strong>
                  <p>Configure API credentials in Settings &gt; Connected Services to unlock this tool.</p>
                </div>
              </div>
            )}

            <div className="form-actions-row">
              <button
                type="button"
                className="gold-ghost-btn"
                onClick={() => setSelectedTool(null)}
              >
                Close
              </button>
              {selectedTool.status === 'Configuration Required' && (
                <button
                  type="button"
                  className="gold-primary-btn"
                  onClick={() => {
                    setSelectedTool(null);
                    navigate('settings');
                  }}
                >
                  Go to Settings
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
