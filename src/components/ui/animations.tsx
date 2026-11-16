import React from "react";

/**
 * Reusable animation keyframes and utility classes
 * Used across the application for consistent animation patterns
 */

export const ANIMATION_KEYFRAMES = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes progress-indefinite {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0); }
    100% { transform: translateX(100%); }
  }

  @keyframes audio-bar {
    0%, 100% { height: 4px; }
    50% { height: 16px; }
  }

  .animate-progress-indefinite {
    animation: progress-indefinite 2s infinite linear;
  }

  .animate-audio-bar-1 {
    animation: audio-bar 0.6s infinite ease-in-out;
  }

  .animate-audio-bar-2 {
    animation: audio-bar 0.6s infinite ease-in-out 0.2s;
  }

  .animate-audio-bar-3 {
    animation: audio-bar 0.6s infinite ease-in-out 0.4s;
  }

  .reader-highlight {
    outline: 2px dashed #7bb0ffff !important;
    outline-offset: 4px;
    cursor: help !important;
    transition: outline 0.1s ease;
    border-radius: 4px;
  }

  .animate-fade-in-down {
    animation: fadeInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-fade-in-scale {
    animation: fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }

  .animate-slide-up {
    animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-slide-down {
    animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

/**
 * Animation delay utilities for staggered animations
 */
export const getAnimationDelay = (
  index: number,
  delayIncrement: number = 0.05,
) => {
  return `${0.2 + index * delayIncrement}s`;
};

/**
 * Legacy component wrapper for animation styles.
 * Keyframes are now consolidated in global.css.
 */
export const AnimationStyles = () => null;

/**
 * Helper function to create staggered animation classes
 * @param baseClass - Base animation class (e.g., 'animate-fade-in-scale')
 * @param index - Index for calculating delay
 * @param delayIncrement - Milliseconds between each stagger
 * @returns CSS class string with animation and delay
 */
export const createStaggerAnimation = (
  baseClass: string,
  index: number,
  delayIncrement: number = 0.05,
): string => {
  const delay = getAnimationDelay(index, delayIncrement);
  return `${baseClass}`;
};
