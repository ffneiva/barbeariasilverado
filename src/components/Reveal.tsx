import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Entrada por scroll, sem GSAP.
 *
 * A versão anterior usava ScrollTrigger para o que é, no fundo, um
 * `IntersectionObserver` mais uma transição CSS. Trocar valeu 44 kB
 * comprimidos: o GSAP era carregado em TODA página, inclusive /agendar e
 * /loja, que são destino de anúncio pago e onde cada quilobyte antes do
 * primeiro paint sai do bolso do cliente.
 *
 * REGRA MANTIDA: o estado escondido nunca sobrevive a uma falha.
 *
 * Se `IntersectionObserver` não existir, o conteúdo nasce visível. Se o
 * elemento nunca entrar na viewport, ele continua escondido — o que está
 * correto, porque ninguém está olhando. E a transição roda no compositor
 * (opacity + transform), sem tocar no layout.
 */

const SUPORTA_IO = typeof window !== 'undefined' && 'IntersectionObserver' in window

/** Margem generosa: dispara um pouco antes de o elemento aparecer de fato. */
const MARGEM = '120px 0px -8% 0px'

function useEntrou(reduced: boolean) {
  const ref = useRef<HTMLElement>(null)
  const [entrou, setEntrou] = useState(false)

  // Derivado, não guardado em estado: sem suporte a IO ou com movimento
  // reduzido o conteúdo simplesmente já está visível, e `reduced` pode mudar
  // a qualquer momento se a pessoa trocar a preferência do sistema.
  const visivel = reduced || !SUPORTA_IO || entrou

  useEffect(() => {
    if (reduced || !SUPORTA_IO) return
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setEntrou(true)
          io.disconnect()
        }
      },
      { rootMargin: MARGEM },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return { ref, visivel }
}

type Props = {
  children: ReactNode
  className?: string
  /** Atraso em segundos — útil para escalonar irmãos. */
  delay?: number
  /** Deslocamento inicial em pixels. */
  y?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'footer'
}

export function Reveal({ children, className, delay = 0, y = 28, as: Tag = 'div' }: Props) {
  const reduced = useReducedMotion()
  const { ref, visivel } = useEntrou(reduced)

  return (
    <Tag
      // @ts-expect-error — a união de tags não estreita o tipo da ref, mas todas são HTMLElement
      ref={ref}
      className={cn('motion-safe:transition-[opacity,transform]', className)}
      style={
        reduced
          ? undefined
          : {
              opacity: visivel ? 1 : 0,
              transform: visivel ? 'none' : `translateY(${y}px)`,
              transitionDuration: '900ms',
              transitionTimingFunction: 'var(--ease-blade)',
              transitionDelay: visivel ? `${delay}s` : '0s',
              willChange: visivel ? 'auto' : 'opacity, transform',
            }
      }
    >
      {children}
    </Tag>
  )
}

type SplitProps = {
  text: string
  className?: string
  /** Intervalo entre palavras, em segundos. */
  stagger?: number
}

/**
 * Título que sobe palavra por palavra por trás de uma máscara.
 *
 * Quebrar em palavras via JSX (em vez do SplitText do GSAP) mantém o texto
 * acessível ao leitor de tela e ao Google como uma frase só.
 *
 * Dois detalhes de CSS que já custaram bug aqui:
 *
 * · o `padding-top` dá ar para o acento. `overflow-hidden` recorta na borda da
 *   caixa de padding e, em fonte display com line-height apertado, o acento de
 *   Á/Â/Ê passa da altura de caixa — sem o padding, "AMÉRICA" vira "AMERICA".
 *
 * · o espaço entre palavras fica FORA do inline-block. Dentro, o CSS descarta
 *   o espaço final da caixa e as palavras grudam ("JARDIMAMÉRICA").
 */
export function SplitHeading({ text, className, stagger = 0.07 }: SplitProps) {
  const reduced = useReducedMotion()
  const { ref, visivel } = useEntrou(reduced)
  const words = text.split(' ')

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={cn('inline', className)}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="inline-block -mt-[0.2em] overflow-hidden pt-[0.2em] align-bottom">
            <span
              className="inline-block"
              style={
                reduced
                  ? undefined
                  : {
                      transform: visivel ? 'none' : 'translateY(125%)',
                      transition: 'transform 1100ms cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: visivel ? `${i * stagger}s` : '0s',
                    }
              }
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  )
}
