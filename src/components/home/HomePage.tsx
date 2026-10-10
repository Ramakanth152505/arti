import React from 'react';
import { HomeHero } from './HomeHero';
import { PromptBox } from './PromptBox';
import { QuickActions } from './QuickActions';
import { Footer } from './Footer';

export const HomePage: React.FC = () => {
  return (
    <main className="home-page" role="main">
      {/* Central hero, prompt, and actions */}
      <div className="home-center-group">
        <HomeHero />
        <PromptBox />
        <QuickActions />
      </div>

      {/* Subtle luxury micro-copy footer */}
      <Footer />
    </main>
  );
};
