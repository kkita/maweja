import { useEffect } from "react";
import { useLocation } from "wouter";

type FaviconTheme = "original" | "black" | "red";

function getThemeFromPath(path: string): FaviconTheme {
  if (path.startsWith("/admin")) return "red";
  if (path.startsWith("/driver")) return "black";
  return "original";
}

function applyTintedFavicon(theme: FaviconTheme) {
  const img = new Image();
  img.src = "/maweja-icon.png";
  img.onload = () => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, size, size);

    if (theme !== "original") {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = theme === "red" ? "#dc2626" : "#000000";
      ctx.fillRect(0, 0, size, size);
    }

    const dataUrl = canvas.toDataURL("image/png");

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }
    link.href = dataUrl;
  };
}

export function useDynamicFavicon() {
  const [location] = useLocation();

  useEffect(() => {
    const theme = getThemeFromPath(location);
    applyTintedFavicon(theme);
  }, [location]);
}
