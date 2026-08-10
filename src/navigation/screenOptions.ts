/** Explicit booleans — Android crashes if stack receives string "true"/"false" */
export const stackScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
  animationEnabled: true,
  // Detach previous screen so pull-to-refresh / overscroll cannot reveal screens behind.
  detachPreviousScreen: true,
} as const;
