import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);

// As soon as React owns the page, defuse the HTML safety timer.
// React's own SplashScreen will handle the visual transition.
const w = window as any;
if (w.__MAWEJA_SPLASH_TIMER__) {
  clearTimeout(w.__MAWEJA_SPLASH_TIMER__);
  w.__MAWEJA_SPLASH_TIMER__ = null;
}
// Reset the safety net to a longer window now that React is mounted —
// it will only fire if React fails to render anything within 6s.
w.__MAWEJA_SPLASH_TIMER__ = setTimeout(() => {
  if (rootEl.children.length === 0 && w.__mawejaKillSplash) w.__mawejaKillSplash();
}, 6000);
