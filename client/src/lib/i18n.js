import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
import { fr } from "./translations/fr";
import { en } from "./translations/en";
const translations = { fr, en };
const I18nContext = createContext({
    lang: "fr",
    setLang: () => { },
    t: fr,
    hasChosenLanguage: false,
    setHasChosenLanguage: () => { },
});
const LANG_KEY = "maweja_lang";
const LANG_CHOSEN_KEY = "maweja_lang_chosen";
export function I18nProvider({ children }) {
    const [lang, setLangState] = useState(() => {
        const saved = localStorage.getItem(LANG_KEY);
        return (saved === "en" || saved === "fr") ? saved : "fr";
    });
    const [hasChosenLanguage, setHasChosenLanguage] = useState(() => {
        return localStorage.getItem(LANG_CHOSEN_KEY) === "true";
    });
    const setLang = (l) => {
        setLangState(l);
        localStorage.setItem(LANG_KEY, l);
    };
    const markChosen = (v) => {
        setHasChosenLanguage(v);
        if (v)
            localStorage.setItem(LANG_CHOSEN_KEY, "true");
    };
    return (_jsx(I18nContext.Provider, { value: { lang, setLang, t: translations[lang], hasChosenLanguage, setHasChosenLanguage: markChosen }, children: children }));
}
export function useI18n() {
    return useContext(I18nContext);
}
//# sourceMappingURL=i18n.js.map