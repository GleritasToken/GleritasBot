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
  return (
    <div className="inline-block" style={{ width, height }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 240 200" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Blue curved segments - exact match to the provided logo */}
        <path 
          d="M120,20 
             C160,30 200,70 170,120 
             C140,160 100,160 70,120 
             C40,70 80,30 120,20 
             Z" 
          fill="none" 
          stroke="#0066cc" 
          strokeWidth="20" 
          strokeLinecap="round"
        />
        
        {/* Gold diamond shape in the middle */}
        <polygon 
          points="120,50 170,90 120,130 70,90" 
          fill="#e6b94d"
        />
        
        {/* Optional GLERITAS text at bottom */}
        {showText && (
          <text 
            x="120" 
            y="180" 
            fontFamily="Arial" 
            fontSize="24" 
            fontWeight="bold" 
            textAnchor="middle" 
            fill="#d9d9d9"
          >
            GLERITAS
          </text>
        )}
      </svg>
    </div>
  );
};

export default GleritasLogo;