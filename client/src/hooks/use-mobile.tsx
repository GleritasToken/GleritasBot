import { useState, useEffect } from 'react';

// Hook to detect if the current device is mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if the user agent string contains mobile device identifiers
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Regular expression to match common mobile device identifiers
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      setIsMobile(mobileRegex.test(userAgent));
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener to handle orientation changes
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
}