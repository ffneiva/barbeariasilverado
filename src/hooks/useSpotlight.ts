import { useEffect, useRef } from 'react'

/**
 * Halo de luz que segue o ponteiro dentro de um elemento.
 *
 * As coordenadas vão para as variáveis CSS `--spot-x` / `--spot-y`, e quem
 * desenha o brilho é um `radial-gradient` no próprio elemento. Escrever numa
 * custom property em vez de num estilo React evita um re-render por
 * `pointermove` — o browser só recompõe a camada do gradiente.
 *
 * Usado nos cards de serviço, para simular a luz da barbearia batendo no metal.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
      el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    return () => el.removeEventListener('pointermove', onMove)
  }, [])

  return ref
}
