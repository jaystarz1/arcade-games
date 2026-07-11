// Singleton AudioContext manager
let audioContext: AudioContext | null = null;
let isResumed = false;

export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const resumeAudioContext = async (): Promise<void> => {
  const ctx = getAudioContext();

  console.log('[AudioContext] Current state:', ctx.state, 'Attempting resume...');

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      isResumed = true;
      console.log('[AudioContext] Resume SUCCESS - new state:', ctx.state);
    } catch (error) {
      console.error('[AudioContext] Resume FAILED:', error);
    }
  } else {
    isResumed = true;
    console.log('[AudioContext] Already in state:', ctx.state);
  }
};

export const isAudioContextResumed = (): boolean => {
  return isResumed;
};
