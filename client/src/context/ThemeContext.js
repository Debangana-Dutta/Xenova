import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// tailwind.config.js is set to `darkMode: 'class'`, and every component in the
// app was already written with `dark:` variants. Nothing was ever adding the
// `dark` class to <html>, so all of that styling was inert. This provider is
// the switch that turns it on.
//
// Three preferences are supported: 'light', 'dark', and 'system'. 'system'
// tracks the OS setting live via matchMedia, so it updates without a reload.

const STORAGE_KEY = 'xenova:theme';
const VALID_PREFERENCES = ['light', 'dark', 'system'];

const ThemeContext = createContext(null);

const readStoredPreference = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return VALID_PREFERENCES.includes(stored) ? stored : 'system';
  } catch {
    // localStorage throws in some private-browsing modes. Fall back to system.
    return 'system';
  }
};

const readSystemPrefersDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(readStoredPreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(readSystemPrefersDark);

  // Keep the "System" option honest — react to OS theme changes while open.
  useEffect(() => {
    let query;
    try {
      query = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return undefined;
    }

    const handleChange = (event) => setSystemPrefersDark(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme =
    preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

  // The single line that activates every `dark:` class in the codebase.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    // Tells the browser to theme native controls (scrollbars, date pickers,
    // form autofill) to match, which our <input type="date"> fields need.
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((next) => {
    if (!VALID_PREFERENCES.includes(next)) return;
    setPreference(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — the theme still applies for this session.
    }
  }, []);

  // Used by the single-button toggle in the top nav. Always resolves to an
  // explicit light/dark choice rather than cycling back into 'system'.
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setTheme, toggleTheme }),
    [preference, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
