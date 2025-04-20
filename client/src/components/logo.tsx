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
      {/* Dark blue background circle (optional) */}
      <circle cx="50" cy="50" r="40" fill="#091f43" opacity="0" />
      
      {/* Left blue crescent */}
      <path
        d="M50 25C38 25 28 36 28 50C28 64 38 75 50 75C45 70 40 60 40 50C40 40 45 30 50 25Z"
        fill="url(#blueGradient1)"
      />
      
      {/* Right blue crescent */}
      <path
        d="M50 25C62 25 72 36 72 50C72 64 62 75 50 75C55 70 60 60 60 50C60 40 55 30 50 25Z"
        fill="url(#blueGradient2)"
      />
      
      {/* Gold connector elements - more accurate to logo */}
      <path
        d="M28 50C28 48 29 46 31 46H42C44 46 45 48 45 50C45 52 44 54 42 54H31C29 54 28 52 28 50Z"
        fill="#E6B980"
      />
      
      <path
        d="M72 50C72 48 71 46 69 46H58C56 46 55 48 55 50C55 52 56 54 58 54H69C71 54 72 52 72 50Z"
        fill="#E6B980"
      />
      
      {/* Central light effect */}
      <ellipse cx="50" cy="50" rx="5" ry="25" fill="#091f43" opacity="0.5" />
      
      {/* Define the gradients */}
      <defs>
        <linearGradient id="blueGradient1" x1="28" y1="25" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1341AD" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="blueGradient2" x1="72" y1="25" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1341AD" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
