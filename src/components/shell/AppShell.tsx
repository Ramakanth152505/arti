import React, { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Sidebar } from '../sidebar/Sidebar';
import { TopBar } from '../topbar/TopBar';
import { HomePage } from '../home/HomePage';
import { CommandSearchModal } from '../common/CommandSearchModal';
import { NotificationsDrawer } from '../common/NotificationsDrawer';
import { ToastContainer } from '../common/ToastContainer';
import { ExecutionTimeline } from '../common/ExecutionTimeline';
import { AiCoreBackdrop } from './AiCoreHost';
import { AppBootSequence } from './AppBootSequence';
import { PageTransition } from '../../motion/primitives';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useIsMobileNav } from '../../hooks/useMediaQuery';

// Workspaces
import { ChatsWorkspace } from '../workspaces/chats/ChatsWorkspace';
import { ConversationWorkspace } from '../workspaces/conversation/ConversationWorkspace';
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
import { CreateSoftwareWorkspace } from '../workspaces/createSoftware/CreateSoftwareWorkspace';
import { KnowledgeWorkspace } from '../workspaces/knowledge/KnowledgeWorkspace';
import { MarketplaceWorkspace } from '../workspaces/marketplace/MarketplaceWorkspace';
import { TaskControlWorkspace } from '../workspaces/taskControl/TaskControlWorkspace';
import { SystemStatusWorkspace } from '../workspaces/systemStatus/SystemStatusWorkspace';
import { CommandCenterWorkspace } from '../workspaces/commandCenter/CommandCenterWorkspace';
import { SettingsWorkspace } from '../workspaces/settings/SettingsWorkspace';
import { HelpWorkspace } from '../workspaces/help/HelpWorkspace';
import { MagicModeWorkspace } from '../workspaces/magicMode/MagicModeWorkspace';

/**
 * `AppBootSequence` plays once per page load. It is intentionally module-scoped
 * (not component state) so a client-side route change — or a React StrictMode
 * remount in development — can never replay the ignition sequence.
 */
let bootPlayed = false;

export const AppShell: React.FC = () => {
  const { currentRoute, navigate, isSidebarCollapsed, toggleSidebar, isFocusMode, isFocusChromeRevealed } =
    useWorkspace();
  const isMobileNav = useIsMobileNav();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [wasMobileNav, setWasMobileNav] = useState(isMobileNav);
  const [booting, setBooting] = useState(() => !bootPlayed);

  const finishBoot = useCallback(() => {
    bootPlayed = true;
    setBooting(false);
  }, []);

  // Reset the drawer whenever the layout crosses the drawer breakpoint. Adjusted
  // during render (not in an effect) so there is no extra commit.
  if (wasMobileNav !== isMobileNav) {
    setWasMobileNav(isMobileNav);
    setIsMobileNavOpen(false);
  }

  const closeMobileNav = React.useCallback(() => setIsMobileNavOpen(false), []);

  const renderActiveWorkspace = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage />;
      case 'conversation':
        return <ConversationWorkspace />;
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
      case 'create-software':
        return <CreateSoftwareWorkspace />;
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

  // Distraction-free conversation mode: the navigation rail (and the workspace's
  // own panels) recede while a conversation is in progress, and return as soon
  // as the user moves the mouse, focuses the workspace, or uses the toggle.
  const focusActive = isFocusMode && !isFocusChromeRevealed;

  return (
    <div
      className={`app-shell route-${currentRoute} ${focusActive ? 'focus-mode' : ''}`}
    >
      {/* Left Navigation Sidebar (rail on desktop, overlay drawer on small screens) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        activeItemId={currentRoute}
        onSelectItem={(id) => navigate(id)}
        isMobileNav={isMobileNav}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={closeMobileNav}
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
          <>
            <div className="workspace-ambient-backdrop" />
            {/* Real Three.js signature scene. Background layer only: it never
                receives pointer events and never overlaps the composer. */}
            <AiCoreBackdrop />
          </>
        )}

        {/* Top Navigation & Search Bar */}
        <TopBar isSidebarCollapsed={isSidebarCollapsed} onOpenMobileNav={() => setIsMobileNavOpen(true)} />

        {/* Live execution timeline (real operations only) */}
        {currentRoute !== 'home' && <ExecutionTimeline />}

        {/* Dedicated Active Workspace, with a route-level transition */}
        <div className="active-workspace-mount">
          <PageTransition routeKey={currentRoute}>{renderActiveWorkspace()}</PageTransition>
        </div>
      </div>

      {/* Global Interactive Modals & Drawers */}
      <CommandSearchModal />
      <NotificationsDrawer />
      <ToastContainer />

      {/* One-time ignition sequence, on top of everything until it settles. */}
      <AnimatePresence>
        {booting && <AppBootSequence key="boot" onDone={finishBoot} />}
      </AnimatePresence>
    </div>
  );
};
