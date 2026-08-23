/** Junta classes ignorando falsy — versão mínima do clsx, sem dependência. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Limita um número ao intervalo [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Interpolação linear. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Aponta para true em telas com ponteiro fino (mouse) — usado por cursor e magnetismo. */
export function hasFinePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}
