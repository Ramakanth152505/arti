import React, { useState } from 'react';
import {
  FolderPlus,
  Search,
  Sparkles,
  Compass,
  MoreHorizontal,
  Image,
  Video,
  Music,
  LayoutGrid,
  Gamepad2,
  FileText,
  Bot,
  Wrench,
  Activity,
  GraduationCap,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Dialog } from '../common/Dialog';

export const QuickActions: React.FC = () => {
  const { navigate, setIsSearchOpen } = useWorkspace();
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  return (
    <>
      <div className="quick-actions-container" role="toolbar" aria-label="Home Quick Actions">
        {/* 1. Create Project */}
        <button
          type="button"
          className="quick-action-pill"
          onClick={() => navigate('projects', { create: 'true' })}
          aria-label="Create Project"
        >
          <FolderPlus className="quick-action-icon" size={13} />
          <span>Create Project</span>
        </button>

        {/* 2. Search */}
        <button
          type="button"
          className="quick-action-pill"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="quick-action-icon" size={13} />
          <span>Search</span>
        </button>

        {/* 3. Generate */}
        <button
          type="button"
          className="quick-action-pill"
          onClick={() => setIsGenerateModalOpen(true)}
          aria-label="Generate"
        >
          <Sparkles className="quick-action-icon" size={13} />
          <span>Generate</span>
        </button>

        {/* 4. Explore */}
        <button
          type="button"
          className="quick-action-pill"
          onClick={() => navigate('marketplace')}
          aria-label="Explore Marketplace"
        >
          <Compass className="quick-action-icon" size={13} />
          <span>Explore</span>
        </button>

        {/* 5. More */}
        <button
          type="button"
          className="quick-action-pill"
          onClick={() => setIsMoreModalOpen(true)}
          aria-label="More Quick Actions"
        >
          <MoreHorizontal className="quick-action-icon" size={13} />
          <span>More</span>
        </button>
      </div>

      {/* Generate Quick Selection Dialog */}
      <Dialog
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Universal Generation Studios"
        description="Select a dedicated generative studio to launch creative synthesis"
      >
        <div className="quick-modal-grid">
          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsGenerateModalOpen(false);
              navigate('images');
            }}
          >
            <div className="quick-card-icon"><Image size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Images Studio</span>
              <span className="quick-card-desc">Photorealistic &amp; cinematic visual generation</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsGenerateModalOpen(false);
              navigate('videos');
            }}
          >
            <div className="quick-card-icon"><Video size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Videos Studio</span>
              <span className="quick-card-desc">Cinematic storyboard &amp; motion synthesis</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsGenerateModalOpen(false);
              navigate('apps');
            }}
          >
            <div className="quick-card-icon"><LayoutGrid size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Apps Studio</span>
              <span className="quick-card-desc">Full-stack application code &amp; UI generator</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsGenerateModalOpen(false);
              navigate('games');
            }}
          >
            <div className="quick-card-icon"><Gamepad2 size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Games Studio</span>
              <span className="quick-card-desc">Interactive game mechanics &amp; asset pipeline</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsGenerateModalOpen(false);
              navigate('music');
            }}
          >
            <div className="quick-card-icon"><Music size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Music Studio</span>
              <span className="quick-card-desc">Algorithmic soundtrack &amp; audio composition</span>
            </div>
          </button>
        </div>
      </Dialog>

      {/* More Options Dialog */}
      <Dialog
        isOpen={isMoreModalOpen}
        onClose={() => setIsMoreModalOpen(false)}
        title="More ARTI Workspaces"
        description="Quick access to research, learning, agents, and system utilities"
      >
        <div className="quick-modal-grid">
          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsMoreModalOpen(false);
              navigate('research');
            }}
          >
            <div className="quick-card-icon"><Compass size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Research Laboratory</span>
              <span className="quick-card-desc">Academic synthesis with evidence provenance</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsMoreModalOpen(false);
              navigate('learning');
            }}
          >
            <div className="quick-card-icon"><GraduationCap size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Learning Academy</span>
              <span className="quick-card-desc">Structured cognitive study paths</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsMoreModalOpen(false);
              navigate('agents');
            }}
          >
            <div className="quick-card-icon"><Bot size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Agents Fleet</span>
              <span className="quick-card-desc">Autonomous specialist agent directory</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsMoreModalOpen(false);
              navigate('tools');
            }}
          >
            <div className="quick-card-icon"><Wrench size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Tools Catalog</span>
              <span className="quick-card-desc">Execution tools &amp; API connectors</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsMoreModalOpen(false);
              navigate('documents');
            }}
          >
            <div className="quick-card-icon"><FileText size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">Documents Studio</span>
              <span className="quick-card-desc">Executive whitepapers &amp; technical specs</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-modal-card"
            onClick={() => {
              setIsMoreModalOpen(false);
              navigate('system-status');
            }}
          >
            <div className="quick-card-icon"><Activity size={18} /></div>
            <div className="quick-card-info">
              <span className="quick-card-title">System Status</span>
              <span className="quick-card-desc">Diagnostic health &amp; telemetry</span>
            </div>
          </button>
        </div>
      </Dialog>
    </>
  );
};
