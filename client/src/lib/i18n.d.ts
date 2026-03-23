import { type ReactNode } from "react";
import { fr } from "./translations/fr";
export type Lang = "fr" | "en";
type Translations = typeof fr;
interface I18nContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: Translations;
    hasChosenLanguage: boolean;
    setHasChosenLanguage: (v: boolean) => void;
}
export declare function I18nProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useI18n(): I18nContextType;
export {};
//# sourceMappingURL=i18n.d.ts.map