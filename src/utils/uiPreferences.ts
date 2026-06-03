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

const SESSION_UI_STORAGE_KEYS = [
  UI_STORAGE_KEYS.DARK_MODE,
  UI_STORAGE_KEYS.GRAYSCALE,
  UI_STORAGE_KEYS.DYSLEXIA,
  UI_STORAGE_KEYS.FONT_SCALE,
  UI_STORAGE_KEYS.SPEECH_RATE,
  UI_STORAGE_KEYS.SPEECH_VOICE,
  UI_STORAGE_KEYS.PERFORMANCE,
];

const isUIPreferenceKey = (storedKey: string) =>
  SESSION_UI_STORAGE_KEYS.some(
    (preferenceKey) =>
      storedKey === preferenceKey || storedKey.startsWith(`${preferenceKey}-`),
  );

export const clearUIPreferences = () => {
  Object.keys(localStorage)
    .filter(isUIPreferenceKey)
    .forEach((key) => localStorage.removeItem(key));
};

export const resetAppliedUIPreferences = () => {
  const root = document.documentElement;

  root.classList.remove("dark", "dyslexic-mode", "perf-mode");
  root.style.filter = "";
  root.style.fontSize = "";
};

export const resetSessionUIPreferences = () => {
  clearUIPreferences();
  resetAppliedUIPreferences();
};