'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TutorialTooltip } from './TutorialTooltip';
import type { TutorialStep } from './types';

interface SpotlightProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const SPOTLIGHT_RADIUS = 12;

export function TutorialSpotlight({ step, stepIndex, totalSteps }: SpotlightProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  const findAndMeasure = useCallback(() => {
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    });

    // Scroll element into view if needed
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step.targetSelector]);

  // Navigate if needed, then find element
  useEffect(() => {
    setVisible(false);
    const needsNav = step.navigateTo && pathname !== step.navigateTo;

    if (needsNav) {
      router.push(step.navigateTo!);
      // Wait for navigation and render
      const timer = setTimeout(() => {
        findAndMeasure();
        setVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // Small delay to allow DOM to settle
      const timer = setTimeout(() => {
        findAndMeasure();
        setVisible(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step, pathname, router, findAndMeasure]);

  // Reposition on resize/scroll
  useEffect(() => {
    const handleReposition = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(findAndMeasure);
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [findAndMeasure]);

  if (!visible) return null;

  // SVG overlay with cutout
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

  return (
    <div
      className="fixed inset-0 z-[9999] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      aria-live="polite"
      role="dialog"
      aria-label={`Tutorial step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
    >
      {/* SVG overlay with hole */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx={SPOTLIGHT_RADIUS}
                ry={SPOTLIGHT_RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tutorial-spotlight-mask)"
          className="pointer-events-auto"
        />
      </svg>

      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="absolute border-2 border-cranberry rounded-xl pointer-events-none animate-pulse"
          style={{
            zIndex: 2,
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <TutorialTooltip
        step={step}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        targetRect={targetRect}
      />
    </div>
  );
}
