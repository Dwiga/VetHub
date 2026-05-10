import { createContext, useContext, useState, useCallback } from "react";
import { en, type LangKeys } from "@/i18n/en";
import { id } from "@/i18n/id";

export type Lang = "en" | "id";

const translations: Record<Lang, Record<LangKeys, string>> = { en, id };

function loadLang(): Lang {
  try {
    const stored = localStorage.getItem("vetcare_lang");
    if (stored === "en" || stored === "id") return stored;
  } catch {}
  return "id";
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: LangKeys) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "id",
  setLang: () => {},
  t: (key) => en[key],
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("vetcare_lang", l); } catch {}
  }, []);

  const t = useCallback((key: LangKeys): string => {
    return translations[lang][key] ?? en[key];
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
