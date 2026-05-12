'use client';

import Image, { type StaticImageData } from 'next/image';
import { useEffect, useState } from 'react';

type ThemeLogoProps = {
  alt: string;
  className: string;
  darkSrc: StaticImageData;
  lightSrc: StaticImageData;
  priority?: boolean;
};

export default function ThemeLogo({
  alt,
  className,
  darkSrc,
  lightSrc,
  priority = false,
}: ThemeLogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains('dark'));

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return <Image src={isDark ? darkSrc : lightSrc} alt={alt} className={className} priority={priority} />;
}
