import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useFinePointer, useReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Cursor de lâmina.
 *
 * Um ponto sólido que segue o mouse na hora e um anel que chega atrasado — a
 * diferença de latência entre os dois é o que dá sensação de peso. Sobre
 * qualquer elemento marcado com `data-cursor="ver"`, o anel cresce e o rótulo
 * aparece, então o cursor vira parte da interface em vez de enfeite.
 *
 * O rótulo mora fora do anel de propósito: se ficasse dentro, o `scale` do anel
 * esticaria o texto e ele sairia borrado.
 *
 * Some em toque e para quem pediu movimento reduzido.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const label = labelRef.current
    if (!dot || !ring || !label || !fine || reduced) return

    document.documentElement.style.cursor = 'none'

    const follow = (el: HTMLElement, duration: number) => ({
      x: gsap.quickTo(el, 'x', { duration, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration, ease: 'power3.out' }),
    })
    const dotTo = follow(dot, 0.12)
    const ringTo = follow(ring, 0.55)
    const labelTo = follow(label, 0.55)

    // O rótulo é centrado via GSAP (xPercent/yPercent) e não por classe do
    // Tailwind: as duas coisas escrevem em `transform` e a última a rodar venceria.
    gsap.set(label, { xPercent: -50, yPercent: -50 })

    let visible = false

    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 })
      }
      dotTo.x(e.clientX)
      dotTo.y(e.clientY)
      ringTo.x(e.clientX)
      ringTo.y(e.clientY)
      labelTo.x(e.clientX)
      labelTo.y(e.clientY)
    }

    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      const tagged = el?.closest<HTMLElement>('[data-cursor]')
      const interactive = el?.closest('a, button, [role="button"], input, textarea, select')

      if (tagged?.dataset.cursor) {
        label.textContent = tagged.dataset.cursor
        gsap.to(ring, { scale: 3.6, borderColor: 'rgba(233,235,239,0.85)', duration: 0.45, ease: 'power3.out' })
        gsap.to(label, { autoAlpha: 1, duration: 0.28 })
        gsap.to(dot, { scale: 0, duration: 0.3 })
      } else if (interactive) {
        gsap.to(ring, { scale: 1.9, borderColor: 'rgba(233,235,239,0.6)', duration: 0.45, ease: 'power3.out' })
        gsap.to(label, { autoAlpha: 0, duration: 0.2 })
        gsap.to(dot, { scale: 0.4, duration: 0.3 })
      } else {
        gsap.to(ring, { scale: 1, borderColor: 'rgba(139,146,158,0.5)', duration: 0.45, ease: 'power3.out' })
        gsap.to(label, { autoAlpha: 0, duration: 0.2 })
        gsap.to(dot, { scale: 1, duration: 0.3 })
      }
    }

    const onDown = () => gsap.to(ring, { scale: '-=0.25', duration: 0.16 })
    const onUp = () => gsap.to(ring, { scale: '+=0.25', duration: 0.28 })
    const onLeaveWindow = () => {
      visible = false
      gsap.to([dot, ring, label], { autoAlpha: 0, duration: 0.25 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeaveWindow)

    return () => {
      document.documentElement.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeaveWindow)
    }
  }, [fine, reduced])

  if (!fine || reduced) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block">
      <div
        ref={ringRef}
        className="absolute -top-5 -left-5 h-10 w-10 rounded-full border border-steel-400/50 opacity-0 mix-blend-difference"
      />
      <div
        ref={labelRef}
        className="absolute top-0 left-0 font-mono text-[0.6rem] tracking-[0.2em] text-steel-100 uppercase opacity-0 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]"
      />
      <div ref={dotRef} className="absolute -top-[3px] -left-[3px] h-1.5 w-1.5 rounded-full bg-steel-100 opacity-0" />
    </div>
  )
}
