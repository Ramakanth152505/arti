import React from 'react';
import { Crown } from 'lucide-react';

export const HomeHero: React.FC = () => {
  return (
    <div className="hero-section">
      {/* Greeting */}
      <div className="hero-greeting">
        <Crown className="hero-crown-icon" size={14} />
        <span>Hello, Ramakanth</span>
      </div>

      {/* Main Hero Heading */}
      <h1 className="hero-heading">
        What would you like to <span className="gold-highlight">create</span> today?
      </h1>

      {/* Hero Subtitle */}
      <p className="hero-subtitle">
        Dream bigger. Build faster. Explore further.
      </p>
    </div>
  );
};
