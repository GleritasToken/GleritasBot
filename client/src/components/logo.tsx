import React from 'react';

// SVG Logo for Gleritas Token - based on provided logo
const Logo: React.FC = () => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
    >
      {/* Blue circular elements */}
      <path
        d="M50 30C40 30 25 40 25 50C25 60 40 70 50 70"
        stroke="url(#blueGradient1)"
        strokeWidth="10"
        fill="none"
      />
      <path
        d="M50 30C60 30 75 40 75 50C75 60 60 70 50 70"
        stroke="url(#blueGradient2)"
        strokeWidth="10"
        fill="none"
      />

      {/* Gold connector elements */}
      <circle cx="25" cy="50" r="5" fill="#E6B980" />
      <circle cx="75" cy="50" r="5" fill="#E6B980" />
      <rect x="25" y="47.5" width="50" height="5" fill="#E6B980" />
      
      {/* Define the gradients */}
      <defs>
        <linearGradient id="blueGradient1" x1="25" y1="30" x2="50" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="blueGradient2" x1="75" y1="30" x2="50" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
