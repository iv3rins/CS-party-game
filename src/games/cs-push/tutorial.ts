export const TUTORIAL_STORAGE_KEY = 'cspa:tutorial:cs-push:v1';

const storage = () => typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage : null;

export const hasSeenTutorial = () => {
  try {
    return storage()?.getItem(TUTORIAL_STORAGE_KEY) === 'seen';
  } catch {
    return false;
  }
};

export const markTutorialSeen = () => {
  try {
    storage()?.setItem(TUTORIAL_STORAGE_KEY, 'seen');
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
};

export const resetTutorial = () => {
  try {
    storage()?.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {
    // Keep reset safe for settings screens running without browser storage.
  }
};
