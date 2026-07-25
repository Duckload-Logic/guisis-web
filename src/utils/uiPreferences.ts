export const UI_STORAGE_KEYS = {
  SIDEBAR_EXPANDED: "sidebar_expanded",
  DARK_MODE: "theme",
  GRAYSCALE: "grayscale",
  DYSLEXIA: "dyslexia",
  FONT_SCALE: "fontScale",
  SPEECH_RATE: "speech_rate",
  SPEECH_VOICE: "speech_voice",
  PERFORMANCE: "performance_mode",
} as const;

// Theme is intentionally excluded. Dark/light mode is a persistent device
// preference and must remain applied when the authenticated session ends.
const SESSION_UI_STORAGE_KEYS = [
  UI_STORAGE_KEYS.GRAYSCALE,
  UI_STORAGE_KEYS.DYSLEXIA,
  UI_STORAGE_KEYS.FONT_SCALE,
  UI_STORAGE_KEYS.SPEECH_RATE,
  UI_STORAGE_KEYS.SPEECH_VOICE,
  UI_STORAGE_KEYS.PERFORMANCE,
];

const isSessionUIPreferenceKey = (storedKey: string) =>
  SESSION_UI_STORAGE_KEYS.some(
    (preferenceKey) =>
      storedKey === preferenceKey || storedKey.startsWith(`${preferenceKey}-`),
  );

export const clearUIPreferences = () => {
  Object.keys(localStorage)
    .filter(isSessionUIPreferenceKey)
    .forEach((key) => localStorage.removeItem(key));
};

export const resetAppliedUIPreferences = () => {
  const root = document.documentElement;

  // Do not remove the dark class here. The saved theme must remain active on
  // the login/logout redirect instead of briefly flashing back to light mode.
  root.classList.remove("dyslexic-mode", "perf-mode");
  root.style.filter = "";
  root.style.fontSize = "";
};

export const resetSessionUIPreferences = () => {
  clearUIPreferences();
  resetAppliedUIPreferences();
};
