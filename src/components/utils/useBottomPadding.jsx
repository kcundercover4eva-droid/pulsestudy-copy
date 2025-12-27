import { useEffect, useState } from 'react';

/**
 * Custom hook that dynamically calculates bottom padding to prevent content cutoff
 * Accounts for navigation bar height and safe areas across all device sizes
 */
export function useBottomPadding() {
  const [bottomPadding, setBottomPadding] = useState(160);

  useEffect(() => {
    const calculatePadding = () => {
      // Get the navigation bar element
      const nav = document.querySelector('nav');
      if (!nav) return;

      // Get actual rendered height of navigation
      const navHeight = nav.offsetHeight;
      
      // Get safe area inset (for notched devices)
      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--sab') || '0'
      );

      // Add buffer for comfortable spacing
      const buffer = 25;
      
      // Calculate total padding needed
      const totalPadding = navHeight + safeAreaBottom + buffer;
      
      setBottomPadding(totalPadding);
      
      // Update CSS custom property for global use
      document.documentElement.style.setProperty(
        '--dynamic-bottom-padding',
        `${totalPadding}px`
      );
    };

    // Calculate on mount
    calculatePadding();

    // Recalculate on window resize
    window.addEventListener('resize', calculatePadding);
    
    // Recalculate on orientation change
    window.addEventListener('orientationchange', calculatePadding);

    return () => {
      window.removeEventListener('resize', calculatePadding);
      window.removeEventListener('orientationchange', calculatePadding);
    };
  }, []);

  return bottomPadding;
}