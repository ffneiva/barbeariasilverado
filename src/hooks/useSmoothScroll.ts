import { useEffect } from 'react'
import type Lenis from 'lenis'
import { prefersReducedMotion } from '@/lib/utils'

/**
 * Scroll suave, com a biblioteca carregada sob demanda.
 *
 * Duas decisões de carregamento:
 *
 * · **Lenis por import dinâmico.** São ~5 kB comprimidos que só fazem
 *   diferença em desktop com roda de mouse. Quem abre no celular (a maioria de
 *   quem chega por anúncio) e quem pediu movimento reduzido nunca baixam esse
 *   código. Como a decisão depende de `matchMedia`, ela só pode ser tomada no
 *   navegador — que é onde o import dinâmico acontece.
 *
 * · **Sem GSAP aqui.** A versão anterior pendurava o Lenis no `gsap.ticker`
 *   para compartilhar um loop com o ScrollTrigger. Só que isso arrastava o
 *   GSAP inteiro para /agendar e /loja, onde não existe uma única animação de
 *   scroll. Agora o Lenis roda no próprio `requestAnimationFrame`, e quem
 *   precisa do ScrollTrigger se pendura nele depois (ver `conectarAoLenis`).
 */

/**
 * Instância viva do Lenis, exposta para o ScrollTrigger se conectar.
 *
 * Um módulo com estado costuma ser cheiro de problema; aqui é a alternativa
 * honesta a um contexto do React que existiria só para transportar um objeto
 * imperativo entre um hook e outro, sem nunca causar re-render.
 */
let instancia: Lenis | null = null
const inscritos = new Set<() => void>()

/**
 * Liga uma função ao scroll do Lenis (na prática, o `ScrollTrigger.update`).
 *
 * Sem isso os dois leem posições em quadros diferentes e as seções "pinadas"
 * tremem meio pixel a cada rolagem. Funciona mesmo se o Lenis ainda não tiver
 * carregado: a inscrição fica guardada e é aplicada quando ele chegar.
 */
export function conectarAoLenis(update: () => void): () => void {
  inscritos.add(update)
  instancia?.on('scroll', update)
  return () => {
    inscritos.delete(update)
    instancia?.off('scroll', update)
  }
}

export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    // Sem roda de mouse não há o que suavizar: o scroll por toque já tem
    // inércia nativa, e sequestrá-lo só piora.
    if (!window.matchMedia('(pointer: fine)').matches) return

    let cancelado = false
    let destruir: (() => void) | undefined

    import('lenis').then(({ default: LenisCtor }) => {
      if (cancelado) return

      const lenis = new LenisCtor({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
      })

      instancia = lenis
      for (const update of inscritos) lenis.on('scroll', update)

      let frame = 0
      const raf = (time: number) => {
        lenis.raf(time)
        frame = requestAnimationFrame(raf)
      }
      frame = requestAnimationFrame(raf)

      destruir = () => {
        cancelAnimationFrame(frame)
        lenis.destroy()
        instancia = null
      }
    })

    return () => {
      cancelado = true
      destruir?.()
    }
  }, [])
}

/** Rola até um id da página respeitando o Lenis (que ignora o hash nativo). */
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}
