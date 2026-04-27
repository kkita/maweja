import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { fr } from "./translations/fr";
import { en } from "./translations/en";

export type Lang = "fr" | "en";
export type Translations = typeof fr;

const translations: Record<Lang, Translations> = { fr, en };

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  hasChosenLanguage: boolean;
  setHasChosenLanguage: (v: boolean) => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: "fr",
  setLang: () => {},
  t: fr,
  hasChosenLanguage: false,
  setHasChosenLanguage: () => {},
});

const LANG_KEY = "maweja_lang";
const LANG_CHOSEN_KEY = "maweja_lang_chosen";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return (saved === "en" || saved === "fr") ? saved : "fr";
  });
  const [hasChosenLanguage, setHasChosenLanguage] = useState(() => {
    return localStorage.getItem(LANG_CHOSEN_KEY) === "true";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  };

  const markChosen = (v: boolean) => {
    setHasChosenLanguage(v);
    if (v) localStorage.setItem(LANG_CHOSEN_KEY, "true");
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang], hasChosenLanguage, setHasChosenLanguage: markChosen }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
