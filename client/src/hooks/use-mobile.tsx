import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const mobileCheck = /iPhone|iPad|iPod|Android|BlackBerry|Windows Phone/i.test(
        navigator.userAgent
      );
      setIsMobile(mobileCheck);
    };

    // Initial check
    checkIfMobile();

    // Add resize event listener for window size changes
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
}