'use client';

import { useContext } from 'react';
import { TutorialContext, type TutorialContextType } from './TutorialProvider';

export function useTutorial(): TutorialContextType {
  return useContext(TutorialContext);
}
