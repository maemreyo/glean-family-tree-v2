import { parseAsString, createSearchParamsCache } from 'nuqs/server'

// Định nghĩa các parsers cho search params
export const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  tab: parseAsString.withDefault('tree'),
}

// Cache cho server components (nếu cần dùng trong page.tsx)
export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
