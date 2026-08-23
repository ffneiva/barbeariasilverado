import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Logo } from './Logo'
import { useReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Abertura da página: contador subindo enquanto o logotipo cromado se revela e,
 * no fim, um corte de navalha que abre a cortina ao meio.
 *
 * Duas regras que impedem isso de virar um pedágio:
 *   1. o timeline inteiro dura ~2,2s e um `setTimeout` de segurança o empurra
 *      para o fim em `MAX_MS`, aconteça o que acontecer;
 *   2. quem pediu movimento reduzido nunca vê a tela.
 *
 * O `onDone` libera as animações de entrada do Hero — elas só começam quando a
 * cortina já saiu, senão a coreografia toda acontece atrás de um painel preto.
 */

const MAX_MS = 2600

export function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const bladeRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [gone, setGone] = useState(reduced)

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }

    document.body.style.overflow = 'hidden'
    const counter = { value: 0 }

    const finish = () => {
      document.body.style.overflow = ''
      setGone(true)
      onDone()
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: finish })

    tl.to(counter, {
      value: 100,
      duration: 1.15,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0')
        }
      },
    })
      .fromTo('[data-preloader-logo]', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.9 }, 0.1)
      // A lâmina cruza a tela: é ela que "corta" a cortina.
      .fromTo(bladeRef.current, { xPercent: -120, opacity: 0 }, { xPercent: 120, opacity: 1, duration: 0.55, ease: 'power2.in' }, '-=0.15')
      .to('[data-preloader-logo], [data-preloader-meta]', { opacity: 0, duration: 0.3 }, '-=0.4')
      .to(topRef.current, { yPercent: -101, duration: 0.85 }, '-=0.15')
      .to(bottomRef.current, { yPercent: 101, duration: 0.85 }, '<')

    // Rede de segurança: se algo travar o timeline (aba em segundo plano, asset
    // pendurado), empurra tudo para o fim em vez de deixar a cortina fechada.
    const hardStop = window.setTimeout(() => {
      if (tl.isActive()) tl.progress(1)
    }, MAX_MS)

    return () => {
      window.clearTimeout(hardStop)
      tl.kill()
      document.body.style.overflow = ''
    }
  }, [onDone, reduced])

  if (gone) return null

  return (
    <div ref={rootRef} className="fixed inset-0 z-[200]" aria-hidden>
      {/* Duas metades que se afastam — a "cortina" cortada pela navalha. */}
      <div ref={topRef} className="absolute inset-x-0 top-0 h-1/2 bg-void" />
      <div ref={bottomRef} className="absolute inset-x-0 bottom-0 h-1/2 bg-void" />

      <div
        ref={bladeRef}
        className="absolute top-1/2 left-0 h-px w-full bg-linear-to-r from-transparent via-steel-50 to-transparent opacity-0"
        style={{ boxShadow: '0 0 24px 2px rgba(233,235,239,0.7)' }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        <div data-preloader-logo className="w-56 opacity-0 md:w-72">
          <Logo variant="wordmark" animated />
        </div>
        <div data-preloader-meta className="flex items-center gap-4 font-mono text-[0.65rem] tracking-[0.32em] text-steel-600 uppercase">
          <span ref={counterRef}>000</span>
          <span className="h-px w-10 bg-steel-800" />
          <span>Jardim América · GYN</span>
        </div>
      </div>
    </div>
  )
}
