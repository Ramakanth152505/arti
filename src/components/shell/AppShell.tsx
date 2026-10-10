import React from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { TopBar } from '../topbar/TopBar';
import { HomePage } from '../home/HomePage';
import { CommandSearchModal } from '../common/CommandSearchModal';
import { NotificationsDrawer } from '../common/NotificationsDrawer';
import { ToastContainer } from '../common/ToastContainer';
import { useWorkspace } from '../../context/WorkspaceContext';

// Workspaces
import { ChatsWorkspace } from '../workspaces/chats/ChatsWorkspace';
import { ProjectsWorkspace } from '../workspaces/projects/ProjectsWorkspace';
import { WebsitesWorkspace } from '../workspaces/websites/WebsitesWorkspace';
import { AppsWorkspace } from '../workspaces/apps/AppsWorkspace';
import { GamesWorkspace } from '../workspaces/games/GamesWorkspace';
import { ImagesWorkspace } from '../workspaces/images/ImagesWorkspace';
import { VideosWorkspace } from '../workspaces/videos/VideosWorkspace';
import { MusicWorkspace } from '../workspaces/music/MusicWorkspace';
import { DocumentsWorkspace } from '../workspaces/documents/DocumentsWorkspace';
import { ResearchWorkspace } from '../workspaces/research/ResearchWorkspace';
import { LearningWorkspace } from '../workspaces/learning/LearningWorkspace';
import { AgentsWorkspace } from '../workspaces/agents/AgentsWorkspace';
import { ToolsWorkspace } from '../workspaces/tools/ToolsWorkspace';
import { KnowledgeWorkspace } from '../workspaces/knowledge/KnowledgeWorkspace';
import { MarketplaceWorkspace } from '../workspaces/marketplace/MarketplaceWorkspace';
import { TaskControlWorkspace } from '../workspaces/taskControl/TaskControlWorkspace';
import { SystemStatusWorkspace } from '../workspaces/systemStatus/SystemStatusWorkspace';
import { CommandCenterWorkspace } from '../workspaces/commandCenter/CommandCenterWorkspace';
import { SettingsWorkspace } from '../workspaces/settings/SettingsWorkspace';
import { HelpWorkspace } from '../workspaces/help/HelpWorkspace';
import { MagicModeWorkspace } from '../workspaces/magicMode/MagicModeWorkspace';

export const AppShell: React.FC = () => {
  const { currentRoute, navigate, isSidebarCollapsed, toggleSidebar } = useWorkspace();

  const renderActiveWorkspace = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage />;
      case 'chats':
        return <ChatsWorkspace />;
      case 'projects':
        return <ProjectsWorkspace />;
      case 'websites':
        return <WebsitesWorkspace />;
      case 'apps':
        return <AppsWorkspace />;
      case 'games':
        return <GamesWorkspace />;
      case 'images':
        return <ImagesWorkspace />;
      case 'videos':
        return <VideosWorkspace />;
      case 'music':
        return <MusicWorkspace />;
      case 'documents':
        return <DocumentsWorkspace />;
      case 'research':
        return <ResearchWorkspace />;
      case 'learning':
        return <LearningWorkspace />;
      case 'agents':
        return <AgentsWorkspace />;
      case 'tools':
        return <ToolsWorkspace />;
      case 'knowledge-base':
        return <KnowledgeWorkspace />;
      case 'marketplace':
        return <MarketplaceWorkspace />;
      case 'task-control-center':
        return <TaskControlWorkspace />;
      case 'system-status':
        return <SystemStatusWorkspace />;
      case 'ai-command-center':
        return <CommandCenterWorkspace />;
      case 'settings':
        return <SettingsWorkspace />;
      case 'help-support':
        return <HelpWorkspace />;
      case 'magic-mode':
        return <MagicModeWorkspace />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`app-shell route-${currentRoute}`}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        activeItemId={currentRoute}
        onSelectItem={(id) => navigate(id)}
      />

      {/* Main Canvas */}
      <div className={`main-canvas ${currentRoute !== 'home' ? 'workspace-canvas-mode' : ''}`}>
        {/* Cinematic Fantasy/Futuristic Environment Background (Always present on Home, subtle ambient on others) */}
        {currentRoute === 'home' ? (
          <>
            <img
              src="/assets/arti_cinematic_bg.jpg"
              alt="ARTI AI Cinematic Environment"
              className="cinematic-bg"
            />
            <div className="cinematic-overlay-vignette" />
            <div className="cinematic-overlay-gradient" />
          </>
        ) : (
          <div className="workspace-ambient-backdrop" />
        )}

        {/* Top Navigation & Search Bar */}
        <TopBar isSidebarCollapsed={isSidebarCollapsed} />

        {/* Dedicated Active Workspace */}
        <div className="active-workspace-mount" key={currentRoute}>
          {renderActiveWorkspace()}
        </div>
      </div>

      {/* Global Interactive Modals & Drawers */}
      <CommandSearchModal />
      <NotificationsDrawer />
      <ToastContainer />
    </div>
  );
};
