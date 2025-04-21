import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium',
  textColor = 'white'
}) => {
  // Define sizes
  const sizeClasses = {
    small: {
      container: 'w-7 h-7',
      text: 'text-base'
    },
    medium: {
      container: 'w-10 h-10',
      text: 'text-xl'
    },
    large: {
      container: 'w-16 h-16',
      text: 'text-3xl'
    }
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className="bg-amber-500 rounded-full flex items-center justify-center shadow-md shadow-amber-900/20" 
      style={{ width: selectedSize.container.split(' ')[0], height: selectedSize.container.split(' ')[1] }}
    >
      <span className={`font-extrabold text-black ${selectedSize.text}`}>G</span>
    </div>
  );
};

export default Logo;