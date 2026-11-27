// Web and Electron have one thread to sample, which the probe's rAF loop covers.
// React Native resolves ui-frames.native.ts instead.

export const hasUiFrames = () => false;
export const startUiFrames = () => {};
export const stopUiFrames = (): number[] => [];
