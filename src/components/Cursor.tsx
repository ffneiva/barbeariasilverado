import { useEffect, useRef } from 'react'
import { useFinePointer, useReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Cursor de lâmina.
 *
 * Um ponto sólido que segue o mouse quase na hora e um anel que chega
 * atrasado — a diferença de latência entre os dois é o que dá sensação de
 * peso. Sobre qualquer elemento marcado com `data-cursor="ver"`, o anel cresce
 * e o rótulo aparece, então o cursor vira parte da interface em vez de enfeite.
 *
 * Escrito com um único `requestAnimationFrame` em vez de `gsap.quickTo`. Era o
 * último uso de GSAP presente em todas as páginas, e ~30 linhas de
 * interpolação valem os 44 kB que a biblioteca custava antes do primeiro paint.
 *
 * O amortecimento é exponencial no tempo decorrido, não um passo fixo por
 * quadro: com passo fixo o cursor fica visivelmente mais rápido num monitor de
 * 144 Hz do que num de 60 Hz.
 *
 * Some em toque e para quem pediu movimento reduzido.
 */

/** Fração do caminho restante percorrida a cada quadro de 60 Hz. */
const VELOCIDADE_PONTO = 0.35
const VELOCIDADE_ANEL = 0.13

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

    const alvo = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ponto = { ...alvo }
    const anel = { ...alvo }
    let escalaAlvo = 1
    let escala = 1
    let visivel = false
    let frame = 0
    let ultimo = performance.now()

    const laco = (agora: number) => {
      const delta = Math.min(0.064, (agora - ultimo) / 1000)
      ultimo = agora

      const kPonto = 1 - Math.pow(1 - VELOCIDADE_PONTO, delta * 60)
      const kAnel = 1 - Math.pow(1 - VELOCIDADE_ANEL, delta * 60)

      ponto.x += (alvo.x - ponto.x) * kPonto
      ponto.y += (alvo.y - ponto.y) * kPonto
      anel.x += (alvo.x - anel.x) * kAnel
      anel.y += (alvo.y - anel.y) * kAnel
      escala += (escalaAlvo - escala) * kAnel

      dot.style.transform = `translate3d(${ponto.x}px, ${ponto.y}px, 0)`
      ring.style.transform = `translate3d(${anel.x}px, ${anel.y}px, 0) scale(${escala.toFixed(3)})`
      label.style.transform = `translate3d(${anel.x}px, ${anel.y}px, 0) translate(-50%, -50%)`

      frame = requestAnimationFrame(laco)
    }

    const onMove = (e: PointerEvent) => {
      alvo.x = e.clientX
      alvo.y = e.clientY
      if (!visivel) {
        visivel = true
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
    }

    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      const marcado = el?.closest<HTMLElement>('[data-cursor]')
      const interativo = el?.closest('a, button, [role="button"], input, textarea, select')

      if (marcado?.dataset.cursor) {
        label.textContent = marcado.dataset.cursor
        escalaAlvo = 3.6
        label.style.opacity = '1'
        dot.style.opacity = '0'
        ring.style.borderColor = 'rgba(233,235,239,0.85)'
      } else if (interativo) {
        escalaAlvo = 1.9
        label.style.opacity = '0'
        dot.style.opacity = visivel ? '0.5' : '0'
        ring.style.borderColor = 'rgba(233,235,239,0.6)'
      } else {
        escalaAlvo = 1
        label.style.opacity = '0'
        dot.style.opacity = visivel ? '1' : '0'
        ring.style.borderColor = 'rgba(139,146,158,0.5)'
      }
    }

    const onDown = () => {
      escalaAlvo *= 0.8
    }
    const onUp = () => {
      escalaAlvo /= 0.8
    }
    const onLeave = () => {
      visivel = false
      dot.style.opacity = '0'
      ring.style.opacity = '0'
      label.style.opacity = '0'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)
    frame = requestAnimationFrame(laco)

    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [fine, reduced])

  if (!fine || reduced) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block">
      <div
        ref={ringRef}
        className="absolute -top-5 -left-5 h-10 w-10 rounded-full border border-steel-400/50 opacity-0 mix-blend-difference transition-[opacity,border-color] duration-300"
      />
      <div
        ref={labelRef}
        className="absolute top-0 left-0 font-mono text-[0.6rem] tracking-[0.2em] text-steel-100 uppercase opacity-0 transition-opacity duration-300 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]"
      />
      <div
        ref={dotRef}
        className="absolute -top-[3px] -left-[3px] h-1.5 w-1.5 rounded-full bg-steel-100 opacity-0 transition-opacity duration-300"
      />
    </div>
  )
}
