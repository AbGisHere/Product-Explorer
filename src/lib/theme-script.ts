// Shared by the server layout (inline <head> script) and the client toggle.
export const THEME_KEY = "product-explorer:theme";

/**
 * Runs in <head> before paint: applies the saved theme so there's no flash.
 * No saved choice -> no attribute -> CSS follows prefers-color-scheme.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
