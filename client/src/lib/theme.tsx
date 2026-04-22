import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "auto",
  setTheme: () => {},
  resolvedTheme: "light",
});

/**
 * Met à jour la balise <meta name="theme-color"> qui contrôle la couleur
 * de la barre d'URL Chrome / Safari mobile et la status bar PWA.
 */
export function setMetaThemeColor(color: string) {
  if (typeof document === "undefined") return;
  let tag = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "theme-color";
    document.head.appendChild(tag);
  }
  tag.content = color;
  // PWA iOS — barre haut Safari fullscreen
  let appleTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
  if (appleTag) {
    appleTag.content = color === "#EC0000" ? "black-translucent" : "default";
  }
}

/**
 * Applique une couleur de fond globale au <body>, <html> et #root
 * pour que les zones safe-area (encoche iOS, geste home, etc.)
 * affichent la bonne couleur en harmonie avec le thème actif.
 */
export function setRootBackground(color: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.background = color;
  document.body.style.background = color;
  const root = document.getElementById("root");
  if (root) root.style.background = color;
}

/**
 * Synchronise les system bars natives (Android + iOS) avec le thème actif.
 * Utilise @capacitor/status-bar uniquement sur les plateformes natives
 * (Capacitor.isNativePlatform() = true), sans impact sur le web desktop.
 *
 * Note Capacitor : Style.Dark = icônes claires (fond sombre) ;
 *                  Style.Light = icônes foncées (fond clair).
 */
export async function syncNativeStatusBar(resolved: "light" | "dark") {
  // 1. Couleur web (PWA + Chrome) toujours synchronisée
  const bg = resolved === "dark" ? "#111111" : "#FFFFFF";
  setMetaThemeColor(bg);
  setRootBackground(bg);

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { StatusBar, Style } = await import("@capacitor/status-bar");

    // Web view rend sa propre couleur sous la barre native
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    if (resolved === "dark") {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#111111" });
    } else {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
    }

    // Barre de navigation Android (geste/boutons en bas) — plugin optionnel
    try {
      const modName = "@capacitor-community/navigation-bar";
      const navBar: any = await import(/* @vite-ignore */ modName).catch(() => null);
      if (navBar?.NavigationBar?.setColor) {
        await navBar.NavigationBar.setColor({ color: bg, darkButtons: resolved === "light" });
      }
    } catch {}
  } catch {
    // Plugin non disponible — silencieux
  }
}

/**
 * Force toutes les barres système en rouge MAWEJA pendant le splash screen.
 * Appelée au montage de <SplashScreen/>, restaurée par syncNativeStatusBar()
 * dès que l'app prend le contrôle.
 */
export async function applySplashBars() {
  const RED = "#EC0000";
  setMetaThemeColor(RED);
  setRootBackground(RED);

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    await StatusBar.setStyle({ style: Style.Dark });          // icônes blanches
    await StatusBar.setBackgroundColor({ color: RED });

    try {
      const modName = "@capacitor-community/navigation-bar";
      const navBar: any = await import(/* @vite-ignore */ modName).catch(() => null);
      if (navBar?.NavigationBar?.setColor) {
        await navBar.NavigationBar.setColor({ color: RED, darkButtons: false });
      }
    } catch {}
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("maweja_theme") as ThemeMode) || "auto";
  });

  const getResolved = (t: ThemeMode): "light" | "dark" => {
    if (t === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
  };

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => getResolved(theme));

  useEffect(() => {
    const apply = (t: ThemeMode) => {
      const resolved = getResolved(t);
      setResolvedTheme(resolved);

      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      syncNativeStatusBar(resolved);
    };

    apply(theme);

    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    localStorage.setItem("maweja_theme", t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
