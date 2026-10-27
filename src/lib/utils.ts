/** Junta classes ignorando falsy — versão mínima do clsx, sem dependência. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Desliga um efeito pela URL, para medir o custo de cada um isolado:
 * `?sem=marca,lenis,portal`. Ferramenta de diagnóstico; não muda nada para
 * quem não usa o parâmetro.
 */
export function sem(efeito: string): boolean {
  if (typeof window === 'undefined') return false
  return (new URLSearchParams(window.location.search).get('sem') ?? '').split(',').includes(efeito)
}
