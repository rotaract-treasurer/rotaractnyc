'use client';

import { createContext, useCallback, useState, useEffect, type ReactNode } from 'react';
import { TutorialSpotlight } from './TutorialSpotlight';
import { memberTutorialSteps } from './memberTutorialSteps';
import { adminTutorialSteps } from './adminTutorialSteps';
import type { TutorialStep } from './types';

export interface TutorialContextType {
  activeTutorial: 'member' | 'admin' | null;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  totalSteps: number;
  isActive: boolean;
  start: (track: 'member' | 'admin') => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  restart: (track: 'member' | 'admin') => void;
  isMemberComplete: boolean;
  isAdminComplete: boolean;
}

export const TutorialContext = createContext<TutorialContextType>({
  activeTutorial: null,
  currentStepIndex: 0,
  currentStep: null,
  totalSteps: 0,
  isActive: false,
  start: () => {},
  next: () => {},
  back: () => {},
  skip: () => {},
  restart: () => {},
  isMemberComplete: false,
  isAdminComplete: false,
});

const MEMBER_KEY = 'rotaract_tutorial_member_complete';
const ADMIN_KEY = 'rotaract_tutorial_admin_complete';

function getSteps(track: 'member' | 'admin'): TutorialStep[] {
  return track === 'member' ? memberTutorialSteps : adminTutorialSteps;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [activeTutorial, setActiveTutorial] = useState<'member' | 'admin' | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMemberComplete, setIsMemberComplete] = useState(true); // default true to prevent flash
  const [isAdminComplete, setIsAdminComplete] = useState(true);

  // Hydrate from localStorage
  useEffect(() => {
    setIsMemberComplete(localStorage.getItem(MEMBER_KEY) === 'true');
    setIsAdminComplete(localStorage.getItem(ADMIN_KEY) === 'true');
  }, []);

  const steps = activeTutorial ? getSteps(activeTutorial) : [];
  const currentStep = activeTutorial ? steps[currentStepIndex] ?? null : null;

  const markComplete = useCallback((track: 'member' | 'admin') => {
    const key = track === 'member' ? MEMBER_KEY : ADMIN_KEY;
    localStorage.setItem(key, 'true');
    if (track === 'member') setIsMemberComplete(true);
    else setIsAdminComplete(true);
  }, []);

  const start = useCallback((track: 'member' | 'admin') => {
    setActiveTutorial(track);
    setCurrentStepIndex(0);
  }, []);

  const next = useCallback(() => {
    if (!activeTutorial) return;
    const total = getSteps(activeTutorial).length;
    if (currentStepIndex + 1 >= total) {
      // Tutorial complete
      markComplete(activeTutorial);
      setActiveTutorial(null);
      setCurrentStepIndex(0);
    } else {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [activeTutorial, currentStepIndex, markComplete]);

  const back = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    if (activeTutorial) {
      markComplete(activeTutorial);
      setActiveTutorial(null);
      setCurrentStepIndex(0);
    }
  }, [activeTutorial, markComplete]);

  const restart = useCallback((track: 'member' | 'admin') => {
    const key = track === 'member' ? MEMBER_KEY : ADMIN_KEY;
    localStorage.removeItem(key);
    if (track === 'member') setIsMemberComplete(false);
    else setIsAdminComplete(false);
    setActiveTutorial(track);
    setCurrentStepIndex(0);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        activeTutorial,
        currentStepIndex,
        currentStep,
        totalSteps: steps.length,
        isActive: activeTutorial !== null,
        start,
        next,
        back,
        skip,
        restart,
        isMemberComplete,
        isAdminComplete,
      }}
    >
      {children}
      {activeTutorial && currentStep && (
        <TutorialSpotlight
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={steps.length}
        />
      )}
    </TutorialContext.Provider>
  );
}
