import { useSyncExternalStore } from 'react'

/**
 * Media query reativa via useSyncExternalStore — sem estado duplicado e sem o
 * flash de "valor errado no primeiro render" típico do par useState/useEffect.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false, // SSR/pré-render: assume o caso conservador
  )
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
export const useFinePointer = () => useMediaQuery('(pointer: fine)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
