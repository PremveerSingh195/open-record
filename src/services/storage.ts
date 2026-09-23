import { RecordingPreferences } from '../types/recording';

const STORAGE_KEY = 'screen_recorder_preferences';

const DEFAULT_PREFERENCES: RecordingPreferences = {
  recordingMode: 'screen',
  audioMode: 'microphone',
  preferredFormat: 'mp4',
  defaultFolder: '',
  alwaysPromptFolder: true,
};

/**
 * Loads saved user preferences from chrome.storage.local with localStorage fallback.
 */
export async function getStoredPreferences(): Promise<RecordingPreferences> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result && result[STORAGE_KEY]) {
        return {
          ...DEFAULT_PREFERENCES,
          ...result[STORAGE_KEY],
        };
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        return {
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(item),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load recording preferences:', err);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Persists user preferences to chrome.storage.local with localStorage fallback.
 */
export async function saveStoredPreferences(
  prefs: Partial<RecordingPreferences>
): Promise<void> {
  try {
    const current = await getStoredPreferences();
    const updated: RecordingPreferences = {
      ...current,
      ...prefs,
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    } else if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('Failed to save recording preferences:', err);
  }
}
