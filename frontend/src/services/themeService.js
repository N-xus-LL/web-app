const THEME_STORAGE_KEY = "lendloop_theme";

const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const applyTheme = (theme) => {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", resolvedTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  } catch {
    // Ignore storage errors (private mode, etc.)
  }

  return resolvedTheme;
};

const toggleTheme = (currentTheme) => (currentTheme === "dark" ? "light" : "dark");

const themeService = {
  getStoredTheme,
  applyTheme,
  toggleTheme
};

export default themeService;
