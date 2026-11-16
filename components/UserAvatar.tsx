'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  name: string;
  photoURL?: string;
  sizeClass?: string;
  emoji?: string;
}

export function UserAvatar({ name, photoURL, sizeClass = 'w-9 h-9 text-xs', emoji }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'FL';

  if (emoji) {
    return <div aria-label={`Avatar de ${name}`} className={`${sizeClass} rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 select-none ring-2 ring-amber-500/20`}>{emoji}</div>;
  }

  if (photoURL && !imgError) {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden ring-2 ring-blue-600/20 dark:ring-blue-400/20 shrink-0`}>
        <Image
          src={photoURL}
          alt={`Avatar de ${name}`}
          fill
          sizes="64px"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`Avatar de ${name}`}
      className={`${sizeClass} rounded-full bg-blue-600 dark:bg-blue-500 text-white font-semibold flex items-center justify-center shrink-0 select-none ring-2 ring-blue-600/15 dark:ring-blue-400/20`}
    >
      {initials}
    </div>
  );
}
