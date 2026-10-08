import { useEffect, useRef, useState } from 'react'
import { Logo } from './Logo'
import { useReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Abertura da página: contador subindo enquanto o logotipo cromado se revela e,
 * no fim, um corte de navalha que abre a cortina ao meio.
 *
 * A coreografia inteira é CSS. Antes era um timeline do GSAP — mas isto é uma
 * sequência de atrasos fixos, exatamente o que `animation-delay` faz, e manter
 * o GSAP só por causa dela obrigava toda página a baixar a biblioteca.
 *
 * Duas regras que impedem isso de virar um pedágio:
 *   1. um `setTimeout` de `DURACAO_MS` libera a página, aconteça o que
 *      acontecer com as animações;
 *   2. quem pediu movimento reduzido nunca vê a tela.
 *
 * O `onDone` libera as animações de entrada do Hero — elas só começam quando a
 * cortina já saiu, senão a coreografia toda acontece atrás de um painel preto.
 */

/** Precisa bater com o fim da última animação em `preloader-*` no index.css. */
const DURACAO_MS = 2400

export function Preloader({ onDone }: { onDone: () => void }) {
  const counterRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const [gone, setGone] = useState(reduced)

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }

    document.body.style.overflow = 'hidden'

    // O contador é a única parte que não dá para fazer em CSS: é texto mudando.
    let frame = 0
    const inicio = performance.now()
    const contar = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / 1150)
      // Mesma curva do resto da abertura, para o número não destoar do ritmo.
      const eased = 1 - Math.pow(1 - t, 3)
      if (counterRef.current) {
        counterRef.current.textContent = String(Math.round(eased * 100)).padStart(3, '0')
      }
      if (t < 1) frame = requestAnimationFrame(contar)
    }
    frame = requestAnimationFrame(contar)

    const fim = window.setTimeout(() => {
      document.body.style.overflow = ''
      setGone(true)
      onDone()
    }, DURACAO_MS)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(fim)
      document.body.style.overflow = ''
    }
  }, [onDone, reduced])

  if (gone) return null

  return (
    <div className="fixed inset-0 z-[200]" aria-hidden>
      {/* Duas metades que se afastam — a "cortina" cortada pela navalha. */}
      <div className="preloader-top absolute inset-x-0 top-0 h-1/2 bg-void" />
      <div className="preloader-bottom absolute inset-x-0 bottom-0 h-1/2 bg-void" />

      <div
        className="preloader-blade absolute top-1/2 left-0 h-px w-full bg-linear-to-r from-transparent via-steel-50 to-transparent"
        style={{ boxShadow: '0 0 24px 2px rgba(233,235,239,0.7)' }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        <div className="preloader-fade w-56 md:w-72">
          <Logo variant="wordmark" animated />
        </div>
        <div className="preloader-fade flex items-center gap-4 font-mono text-[0.65rem] tracking-[0.32em] text-steel-600 uppercase">
          <span ref={counterRef}>000</span>
          <span className="h-px w-10 bg-steel-800" />
          <span>Jardim América · GYN</span>
        </div>
      </div>
    </div>
  )
}
