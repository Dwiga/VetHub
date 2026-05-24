import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { en, type LangKeys } from '@/i18n/en'
import { id } from '@/i18n/id'

export type Lang = 'en' | 'id'

const translations: Record<Lang, Record<LangKeys, string>> = { en, id }

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: LangKeys) => string
}

const LangContext = createContext<LangContextValue>({
  lang: 'id',
  setLang: () => {},
  t: (key) => en[key],
})

const STORAGE_KEY = 'vetcare_lang'

export function LangProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe initial value; hydrate from localStorage after mount.
  const [lang, setLangState] = useState<Lang>('id')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'id') setLangState(stored)
    } catch {
      // ignore
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback(
    (key: LangKeys): string => translations[lang][key] ?? en[key],
    [lang],
  )

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
