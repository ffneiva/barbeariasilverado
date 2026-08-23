import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/**
 * As fontes self-hosted trocam depois do primeiro paint (`font-display: swap`).
 * Bebas Neue é bem mais estreita que o fallback do sistema, então todo título
 * muda de altura no momento da troca — e qualquer ScrollTrigger medido antes
 * disso passa a disparar no lugar errado. Um refresh após `fonts.ready` reancora
 * tudo de uma vez.
 */
function refreshAfterFonts() {
  if (!('fonts' in document)) return
  document.fonts.ready.then(() => ScrollTrigger.refresh())
}

/**
 * Scroll suave (Lenis) com o ScrollTrigger pendurado no mesmo relógio.
 *
 * Sem essa amarração, Lenis e ScrollTrigger leem posições em quadros diferentes
 * e as seções "pinadas" tremem meio pixel a cada rolagem. Colocar o `raf` do
 * Lenis dentro do ticker do GSAP faz os dois compartilharem um único loop.
 *
 * Quem pediu movimento reduzido no sistema fica com o scroll nativo do browser.
 */
export function useSmoothScroll() {
  useEffect(() => {
    refreshAfterFonts()

    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Em telas de toque o scroll nativo já é suave e tem inércia própria;
      // sequestrá-lo só atrapalha.
      syncTouch: false,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])
}

/** Rola até um id da página respeitando o Lenis (que ignora o hash nativo). */
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}
