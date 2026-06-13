import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  large?: boolean;
  useAltLogo?: boolean;
}

export default function Logo({ className = '', iconSize = 28, textSize = 'text-2xl', large = false, useAltLogo = true }: LogoProps) {
  const logoSrc = useAltLogo ? "/websitecomplemented.png" : "/applogo.jpg";
  return (
    <div className={`select-none flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Logo mark */}
      <Image
        src={logoSrc}
        alt="aurumcalculator logo"
        width={iconSize}
        height={iconSize}
        className={`flex-shrink-0 ${large ? 'w-12 h-12 sm:w-18 sm:h-18' : 'w-7 h-7 sm:w-9 sm:h-9'}`}
        priority
      />
      {/* Wordmark */}
      <span
        style={{
          fontFamily: 'Impact, sans-serif',
          letterSpacing: '0.06em'
        }}
        className={`text-zinc-950 dark:text-zinc-50 font-normal tracking-wide transition-colors ${textSize}`}
      >
        aurumcalculator.
      </span>
    </div>
  );
}

