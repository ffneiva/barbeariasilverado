import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  children: ReactNode
  className?: string
  /** Atraso em segundos — útil para escalonar irmãos. */
  delay?: number
  /** Deslocamento inicial em pixels. */
  y?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'footer'
}

/**
 * Entrada por scroll. Um único ScrollTrigger por elemento, disparado uma vez
 * ("once") — a página tem dezenas destes e triggers que reavaliam a cada
 * rolagem custam caro no celular.
 */
export function Reveal({ children, className, delay = 0, y = 28, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    const anim = gsap.fromTo(
      el,
      { autoAlpha: 0, y },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    )

    return () => {
      anim.scrollTrigger?.kill()
      anim.kill()
      gsap.set(el, { clearProps: 'all' })
    }
  }, [delay, y, reduced])

  return (
    // @ts-expect-error — a união de tags não estreita o tipo da ref, mas todas são HTMLElement
    <Tag ref={ref} className={cn(reduced ? undefined : 'invisible', className)}>
      {children}
    </Tag>
  )
}

type SplitProps = {
  text: string
  className?: string
  /** Anima palavra a palavra em vez de linha inteira. */
  stagger?: number
}

/**
 * Título que sobe palavra por palavra por trás de uma máscara.
 *
 * Evita o SplitText do GSAP de propósito: quebrar em palavras via JSX mantém o
 * texto acessível ao leitor de tela e ao Google como uma frase só, sem os spans
 * por caractere que o SplitText injeta.
 */
export function SplitHeading({ text, className, stagger = 0.07 }: SplitProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    const words = el.querySelectorAll<HTMLElement>('[data-word]')
    const anim = gsap.fromTo(
      words,
      { yPercent: 115 },
      {
        yPercent: 0,
        duration: 1.1,
        stagger,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      },
    )

    return () => {
      anim.scrollTrigger?.kill()
      anim.kill()
    }
  }, [stagger, reduced])

  return (
    <span ref={ref} className={cn('inline', className)}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span data-word className="inline-block" style={reduced ? undefined : { transform: 'translateY(115%)' }}>
            {word}
            {' '}
          </span>
        </span>
      ))}
    </span>
  )
}
