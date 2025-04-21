import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

interface ConfettiEffectProps {
  run: boolean;
  duration?: number;
  onComplete?: () => void;
}

export const ConfettiEffect = ({ 
  run, 
  duration = 3000, 
  onComplete 
}: ConfettiEffectProps) => {
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth,
    height: window.innerHeight 
  });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (run && !isActive) {
      setIsActive(true);
      
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [run, duration, isActive, onComplete]);

  if (!isActive) return null;

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={true}
      numberOfPieces={200}
      gravity={0.2}
      colors={['#e6b94d', '#0066cc', '#ffffff', '#4dabf7', '#ffd43b']}
    />
  );
};

export default ConfettiEffect;