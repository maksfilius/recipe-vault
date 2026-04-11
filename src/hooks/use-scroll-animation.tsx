"use client"

import { useEffect, useRef, useState } from "react";

export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentElement = ref.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    observer.observe(currentElement);

    return () => {
      observer.unobserve(currentElement);
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, isVisible };
};
