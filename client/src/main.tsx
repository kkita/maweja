import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const capSplash = "@capac" + "itor/splash-screen";
import(/* @vite-ignore */ capSplash).then((m: any) => {
  m.SplashScreen?.hide({ fadeOutDuration: 0 });
}).catch(() => {});

createRoot(document.getElementById("root")!).render(<App />);
