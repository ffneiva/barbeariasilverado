import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  items: string[]
  /** Segundos para percorrer um ciclo completo. Maior = mais lento. */
  duration?: number
  reverse?: boolean
  className?: string
  separator?: ReactNode
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
export function Marquee({ items, duration = 40, reverse = false, className, separator }: Props) {
  const track = [...items, ...items]

  return (
    <div
      className={cn(
        'group relative flex overflow-hidden',
        // Esmaece as pontas para a faixa "nascer" e "morrer" no escuro.
        '[mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
      aria-hidden
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
