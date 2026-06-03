import { AuthContext } from "@/context/AuthContext";
import { UI_STORAGE_KEYS } from "@/utils/uiPreferences";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

export interface PageMetadata {
  title: string;
  description?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerStats?: React.ReactNode;
  showDate?: boolean;
  isLoading?: boolean;
  showSubHeader?: boolean;
}

interface UIContextType {
  sidebarPinned: boolean;
  setSidebarPinned: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebarPinned: () => void;
  sidebarHovered: boolean;
  setSidebarHovered: (value: boolean) => void;
  pageMetadata: PageMetadata;
  setPageMetadata: React.Dispatch<React.SetStateAction<PageMetadata>>;
  // UI Preferences
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  grayscale: boolean;
  setGrayscale: (value: boolean) => void;
  dyslexiaMode: boolean;
  setDyslexiaMode: (value: boolean) => void;
  fontScale: number;
  setFontScale: (value: number) => void;
  // Audio Settings
  voices: SpeechSynthesisVoice[];
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speechVoice: string;
  setSpeechVoice: (voice: string) => void;
  // Performance
  performanceMode: boolean;
  setPerformanceMode: (value: boolean) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

const STORAGE_KEYS = UI_STORAGE_KEYS;

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const isLoading = authContext?.isLoading;
  const userId = user?.id;

  const [sidebarPinned, setSidebarPinnedInternal] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [darkMode, setDarkModeInternal] = useState(false);
  const [grayscale, setGrayscaleInternal] = useState(false);
  const [dyslexiaMode, setDyslexiaModeInternal] = useState(false);
  const [fontScale, setFontScaleInternal] = useState(100);
  const [performanceMode, setPerformanceModeInternal] = useState(true);
  const [speechRate, setSpeechRateState] = useState(1);
  const [speechVoice, setSpeechVoiceState] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setVoices(v);
        return true;
      }
      return false;
    };

    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    updateVoices();

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  const [pageMetadata, setPageMetadata] = useState<PageMetadata>({
    title: "",
  });

  useEffect(() => {
    if (!isLoading) {
      const getPref = (key: string, def: string) => {
        if (userId) {
          const userPref = localStorage.getItem(`${key}-${userId}`);
          if (userPref !== null) return userPref;
        }
        return localStorage.getItem(key) || def;
      };

      setSidebarPinnedInternal(
        getPref(STORAGE_KEYS.SIDEBAR_EXPANDED, "false") === "true",
      );
      setDarkModeInternal(getPref(STORAGE_KEYS.DARK_MODE, "light") === "dark");
      setGrayscaleInternal(getPref(STORAGE_KEYS.GRAYSCALE, "false") === "true");
      setDyslexiaModeInternal(
        getPref(STORAGE_KEYS.DYSLEXIA, "false") === "true",
      );
      setFontScaleInternal(
        parseInt(getPref(STORAGE_KEYS.FONT_SCALE, "100"), 10),
      );
      setPerformanceModeInternal(
         getPref(STORAGE_KEYS.PERFORMANCE, "true") === "true",
      );
      setSpeechRateState(parseFloat(getPref(STORAGE_KEYS.SPEECH_RATE, "1")));
      setSpeechVoiceState(getPref(STORAGE_KEYS.SPEECH_VOICE, ""));
    }
  }, [isLoading, userId]);

  const setSidebarPinned = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setSidebarPinnedInternal((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (userId) {
          localStorage.setItem(
            `${STORAGE_KEYS.SIDEBAR_EXPANDED}-${userId}`,
            String(next),
          );
        }
        return next;
      });
    },
    [userId],
  );

  const setDarkMode = useCallback(
    (value: boolean) => {
      setDarkModeInternal(value);
      const val = value ? "dark" : "light";
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, val);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEYS.DARK_MODE}-${userId}`, val);
      }
    },
    [userId],
  );

  const setGrayscale = useCallback(
    (value: boolean) => {
      setGrayscaleInternal(value);
      const val = String(value);
      localStorage.setItem(STORAGE_KEYS.GRAYSCALE, val);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEYS.GRAYSCALE}-${userId}`, val);
      }
    },
    [userId],
  );

  const setDyslexiaMode = useCallback(
    (value: boolean) => {
      setDyslexiaModeInternal(value);
      const val = String(value);
      localStorage.setItem(STORAGE_KEYS.DYSLEXIA, val);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEYS.DYSLEXIA}-${userId}`, val);
      }
    },
    [userId],
  );

  const setFontScale = useCallback(
    (value: number) => {
      setFontScaleInternal(value);
      const val = String(value);
      localStorage.setItem(STORAGE_KEYS.FONT_SCALE, val);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEYS.FONT_SCALE}-${userId}`, val);
      }
    },
    [userId],
  );

  const setPerformanceMode = useCallback(
    (value: boolean) => {
      setPerformanceModeInternal(value);
      const val = String(value);
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE, val);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEYS.PERFORMANCE}-${userId}`, val);
      }
    },
    [userId],
  );

  const setSpeechRate = useCallback(
    (rate: number) => {
      setSpeechRateState(rate);
      const val = String(rate);
      localStorage.setItem(STORAGE_KEYS.SPEECH_RATE, val);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEYS.SPEECH_RATE}-${userId}`, val);
      }
    },
    [userId],
  );

  const setSpeechVoice = useCallback(
    (voice: string) => {
      setSpeechVoiceState(voice);
      localStorage.setItem(STORAGE_KEYS.SPEECH_VOICE, voice);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEYS.SPEECH_VOICE}-${userId}`, voice);
      }
    },
    [userId],
  );

  const toggleSidebarPinned = useCallback(() => {
    setSidebarPinned((prev) => !prev);
  }, [setSidebarPinned]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");

    if (grayscale) root.style.filter = "grayscale(100%)";
    else root.style.filter = "";

    if (dyslexiaMode) root.classList.add("dyslexic-mode");
    else root.classList.remove("dyslexic-mode");

    root.style.fontSize = `${(fontScale / 100) * 16}px`;

    if (performanceMode) root.classList.add("perf-mode");
    else root.classList.remove("perf-mode");
  }, [darkMode, grayscale, dyslexiaMode, fontScale, performanceMode]);

  const contextValue = useMemo(
    () => ({
      sidebarPinned,
      setSidebarPinned,
      toggleSidebarPinned,
      sidebarHovered,
      setSidebarHovered,
      darkMode,
      setDarkMode,
      grayscale,
      setGrayscale,
      dyslexiaMode,
      setDyslexiaMode,
      fontScale,
      setFontScale,
      performanceMode,
      setPerformanceMode,
      pageMetadata,
      setPageMetadata,
      voices,
      speechRate,
      setSpeechRate,
      speechVoice,
      setSpeechVoice,
    }),
    [
      sidebarPinned,
      setSidebarPinned,
      toggleSidebarPinned,
      sidebarHovered,
      setSidebarHovered,
      darkMode,
      setDarkMode,
      grayscale,
      setGrayscale,
      dyslexiaMode,
      setDyslexiaMode,
      fontScale,
      setFontScale,
      performanceMode,
      setPerformanceMode,
      pageMetadata,
      setPageMetadata,
      voices,
      speechRate,
      setSpeechRate,
      speechVoice,
      setSpeechVoice,
    ],
  );

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};
