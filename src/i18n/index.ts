import { useAtlas } from '@/store/useAtlas'
import type { L10n } from '@/data/types'
import { STRINGS, type Strings } from './strings'

/** UI strings for the active language. */
export function useT(): Strings {
  const lang = useAtlas((s) => s.lang)
  return STRINGS[lang] as Strings
}

/** Resolve a bilingual catalogue field. */
export function useL() {
  const lang = useAtlas((s) => s.lang)
  return (text: L10n | undefined) => (text ? text[lang] : '')
}
