import { type ReactNode, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  items: string[]
  /** Segundos para percorrer um ciclo completo. Maior = mais lento. */
  duration?: number
  reverse?: boolean
  className?: string
  separator?: ReactNode
  /** Entorta a faixa conforme a velocidade da rolagem (só perto da tela). */
  entorta?: boolean
}

/**
 * Inclinação pela velocidade da rolagem: escreve só o transform do próprio
 * elemento, e só enquanto a faixa está perto da tela. Parada, volta a zero.
 */
function useEntortar(ligado: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!ligado || !el || !('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let perto = false
    let ultimoY = window.scrollY
    let alvo = 0
    let atual = 0
    let raf = 0
    const passo = () => {
      raf = 0
      atual += (alvo - atual) * 0.14
      alvo *= 0.88
      el.style.transform = `skewX(${atual.toFixed(2)}deg)`
      if (Math.abs(atual) > 0.02 || Math.abs(alvo) > 0.02) raf = requestAnimationFrame(passo)
      else el.style.transform = ''
    }
    const aoRolar = () => {
      const y = window.scrollY
      const v = y - ultimoY
      ultimoY = y
      if (!perto) return
      alvo = Math.max(-9, Math.min(9, -v * 0.22))
      if (!raf) raf = requestAnimationFrame(passo)
    }
    const io = new IntersectionObserver(([e]) => (perto = e.isIntersecting), { rootMargin: '200px 0px' })
    io.observe(el)
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', aoRolar)
    }
  }, [ligado])
  return ref
}

/**
 * Faixa infinita em CSS puro.
 *
 * O truque é duplicar a lista e animar `translateX(-50%)`: quando a primeira
 * cópia sai de cena, a segunda está exatamente onde a primeira começou, e o
 * loop reinicia sem salto. Sem JS, sem `requestAnimationFrame` rodando o tempo
 * todo — o compositor do browser resolve sozinho, mesmo com a aba em segundo
 * plano.
 */
export function Marquee({ items, duration = 40, reverse = false, className, separator, entorta = false }: Props) {
  const track = [...items, ...items]
  const ref = useEntortar(entorta)

  return (
    <div
      className={cn(
        'group relative flex overflow-hidden',
        // Esmaece as pontas para a faixa "nascer" e "morrer" no escuro.
        '[mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
      aria-hidden
      ref={ref}
    >
      <div
        className="flex w-max shrink-0 items-center will-change-transform group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-x ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {track.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center">
            <span className="px-6 whitespace-nowrap">{item}</span>
            <span className="text-steel-700 select-none">{separator ?? '·'}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
