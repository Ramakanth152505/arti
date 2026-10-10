import React, { useState } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { TopBar } from '../topbar/TopBar';
import { HomePage } from '../home/HomePage';

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItemId, setActiveItemId] = useState('home');

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleSelectItem = (id: string) => {
    setActiveItemId(id);
  };

  return (
    <div className="app-shell">
      {/* Left Navigation Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        activeItemId={activeItemId}
        onSelectItem={handleSelectItem}
      />

      {/* Main Home Canvas */}
      <div className="main-canvas">
        {/* Cinematic Fantasy/Futuristic Environment Background */}
        <img
          src="/assets/arti_cinematic_bg.jpg"
          alt="ARTI AI Cinematic Environment"
          className="cinematic-bg"
        />

        {/* Shading Overlays for Text Legibility & Depth */}
        <div className="cinematic-overlay-vignette" />
        <div className="cinematic-overlay-gradient" />

        {/* Top Navigation & Search Bar */}
        <TopBar isSidebarCollapsed={isSidebarCollapsed} />

        {/* Central Home Hero & Actions Canvas */}
        <HomePage />
      </div>
    </div>
  );
};
