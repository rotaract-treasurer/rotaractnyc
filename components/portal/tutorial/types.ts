export interface TutorialStep {
  /** Unique ID for the step */
  id: string;
  /** CSS selector to find the target element to highlight */
  targetSelector: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description/body text */
  description: string;
  /** Which side of the target to show the tooltip */
  placement: 'top' | 'bottom' | 'left' | 'right';
  /** Optional: navigate to this path before showing the step */
  navigateTo?: string;
  /** Optional: only show for specific roles */
  roles?: string[];
}
