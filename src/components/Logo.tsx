import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export default function Logo({ className = '', iconSize = 28, textSize = 'text-2xl' }: LogoProps) {
  return (
    <div className={`select-none flex items-center gap-2.5 ${className}`}>
      {/* Logo mark */}
      <Image
        src="/applogo.jpg"
        alt="aurumcalculator logo"
        width={iconSize}
        height={iconSize}
        className="flex-shrink-0"
        priority
      />
      {/* Wordmark */}
      <span
        style={{
          fontFamily: 'Impact, sans-serif',
          letterSpacing: '0.08em'
        }}
        className={`text-zinc-950 font-normal ${textSize}`}
      >
        aurumcalculator.
      </span>
    </div>
  );
}
