import React from 'react';
import { useSettings } from '../context/SettingsContext';

export function GlobalBackground() {
  const { panelBackgroundImage, panelBackgroundBlur } = useSettings();
  
  // Use the uploaded image by default, or the panelBackgroundImage if set
  const bgImage = panelBackgroundImage || '/admin-bg.png';

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{ 
        backgroundImage: `url("${bgImage}")`,
        filter: `blur(${panelBackgroundBlur || 0}px)`,
        transform: 'scale(1.08)', // To prevent blurred edges from showing
      }}
    >
      <div className="absolute inset-0 bg-slate-950/20" /> {/* Lightened overlay so the background image is more visible */}
    </div>
  );
}

