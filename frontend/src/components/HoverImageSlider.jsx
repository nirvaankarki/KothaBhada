import React, { useEffect, useMemo, useRef, useState } from 'react';

const TRANSITION_MS = 700;
const STEP_INTERVAL_MS = 2000;

const HoverImageSlider = ({
  images,
  altBase,
  autoPlay = false,
  stepIntervalMs = STEP_INTERVAL_MS,
  transitionMs = TRANSITION_MS,
  resetOnMouseLeave = true,
  pauseOnHover = false,
  animationType = 'slide',
  hoverActive,
}) => {
  const normalizedImages = useMemo(() => {
    const cleaned = Array.isArray(images)
      ? images.map((item) => String(item || '').trim()).filter(Boolean)
      : [];

    return cleaned.length
      ? cleaned
      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000'];
  }, [images]);

  const hasMultipleImages = normalizedImages.length > 1;
  const renderImages = hasMultipleImages
    ? [...normalizedImages, normalizedImages[0]]
    : normalizedImages;

  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const resetTimeoutRef = useRef(null);
  const hasExternalHoverControl = typeof hoverActive === 'boolean';
  const effectiveHover = hasExternalHoverControl ? hoverActive : isHovered;

  const autoPlayActive = autoPlay && (!pauseOnHover || !effectiveHover);
  const shouldAutoSlide = hasMultipleImages && (autoPlayActive || (!autoPlay && effectiveHover));

  useEffect(() => {
    if (!shouldAutoSlide) return undefined;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, stepIntervalMs);

    return () => clearInterval(intervalId);
  }, [shouldAutoSlide, stepIntervalMs]);

  useEffect(() => {
    if (!hasMultipleImages) return undefined;
    if (currentIndex !== normalizedImages.length) return undefined;

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    resetTimeoutRef.current = setTimeout(() => {
      setTransitionEnabled(false);
      setCurrentIndex(0);
    }, transitionMs);

    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, [currentIndex, hasMultipleImages, normalizedImages.length, transitionMs]);

  useEffect(() => {
    if (transitionEnabled) return undefined;

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [transitionEnabled]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (!hasMultipleImages) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    if (autoPlay) return;
    if (resetOnMouseLeave && !autoPlay) {
      setTransitionEnabled(false);
      setCurrentIndex(0);
    }
  };

  const usingSlideAnimation = animationType === 'slide';
  const translatePercent = currentIndex * (100 / renderImages.length);
  const trackStyle = {
    width: `${renderImages.length * 100}%`,
    transform: `translateX(-${translatePercent}%)`,
    transition: transitionEnabled && usingSlideAnimation
      ? `transform ${transitionMs}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
      : 'none',
  };
  const slideStyle = {
    width: `${100 / renderImages.length}%`,
  };

  return (
    <div className="absolute inset-0 overflow-hidden" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="flex h-full" style={trackStyle}>
        {renderImages.map((imageSrc, index) => {
          const displayIndex = index % normalizedImages.length;
          return (
        <img
          key={`${imageSrc}-${index}`}
          src={imageSrc}
          alt={`${altBase || 'Room image'} ${displayIndex + 1}`}
          className="h-full shrink-0 object-cover"
          style={slideStyle}
          loading="lazy"
          decoding="async"
        />
          );
        })}
      </div>
    </div>
  );
};

export default HoverImageSlider;
