import React from 'react';

// SVG Logo for Gleritas Token - updated design
const Logo: React.FC = () => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
    >
      {/* Circle background with gradient */}
      <circle cx="20" cy="20" r="20" fill="url(#glrGradient)" />
      
      {/* Letter G stylized */}
      <path
        d="M26 13.5C26 12.6716 25.3284 12 24.5 12H15.5C14.6716 12 14 12.6716 14 13.5V26.5C14 27.3284 14.6716 28 15.5 28H24.5C25.3284 28 26 27.3284 26 26.5V19H21V22H23V25H17V15H23V18H21V21H26V13.5Z"
        fill="white"
      />
      
      {/* Define the gradient */}
      <defs>
        <linearGradient id="glrGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
