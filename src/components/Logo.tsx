import React from 'react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export default function Logo({ className = '', textSize = 'text-2xl' }: LogoProps) {
  return (
    <div className={`select-none ${className}`}>
      {/* Wordmark (Impact Font, all black, wide letter gaps) */}
      <span 
        style={{ 
          fontFamily: 'Impact, sans-serif',
          letterSpacing: '0.08em'
        }}
        className={`text-zinc-950 font-normal ${textSize}`}
      >
        aurumtrack.
      </span>
    </div>
  );
}
