import React from 'react';

// SVG Logo for Gleritas Token
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
      <rect width="40" height="40" rx="20" fill="#3B82F6" />
      <path
        d="M12 14C12 12.8954 12.8954 12 14 12H26C27.1046 12 28 12.8954 28 14V26C28 27.1046 27.1046 28 26 28H14C12.8954 28 12 27.1046 12 26V14Z"
        fill="white"
      />
      <path
        d="M20 15L25 20L20 25L15 20L20 15Z"
        fill="#3B82F6"
      />
    </svg>
  );
};

export default Logo;
