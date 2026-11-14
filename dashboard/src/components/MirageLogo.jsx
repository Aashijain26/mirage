import React from "react";

export function MirageLogo({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Left coral/red facet */}
      <path d="M4 32L17 4L21 32H4Z" fill="url(#mir-red-grad)" />
      <path d="M13 32L17 4L21 32H13Z" fill="#000000" opacity="0.25" />
      
      {/* Right mint/green facet */}
      <path d="M21 32L25 4L38 32H21Z" fill="url(#mir-green-grad)" />
      <path d="M21 32L25 4L27 32H21Z" fill="#ffffff" opacity="0.18" />
      
      <defs>
        <linearGradient id="mir-red-grad" x1="4" y1="4" x2="21" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="mir-green-grad" x1="21" y1="4" x2="38" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}
