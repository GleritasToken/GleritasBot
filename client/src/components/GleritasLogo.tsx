import React from 'react';

interface GleritasLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
}

export const GleritasLogo: React.FC<GleritasLogoProps> = ({ 
  width = 120, 
  height = 80,
  showText = true
}) => {
  // Use the exact PNG image from the attached assets
  return (
    <div className="inline-block" style={{ width, height }}>
      <img 
        src="/gleritas-logo-exact.png" 
        alt="Gleritas Logo"
        width={width}
        height={height}
        style={{ 
          objectFit: 'contain',
          // If showText is false, we crop the image to show only the logo part
          maxHeight: showText ? '100%' : '75%',
          marginTop: showText ? '0' : '-10px'
        }}
      />
    </div>
  );
};

export default GleritasLogo;