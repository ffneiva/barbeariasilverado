import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

/**
 * REGRA DESTE ARQUIVO: o estado escondido nunca mora no markup.
 *
 * A versão anterior marcava o elemento como invisível no JSX (classe
 * `invisible`, `transform` inline) e contava com o GSAP para revelá-lo. O modo
 * de falha disso é péssimo: se o ScrollTrigger não disparar, se um `revert()`
 * restaurar o estado inicial, se o JS quebrar — o conteúdo some para sempre, e
 * some silenciosamente.
 *
 * Aqui é o contrário: o HTML entrega tudo visível, e é o próprio efeito que
 * esconde (com `gsap.set`) um instante antes de animar. Qualquer caminho de
 * falha degrada para "aparece sem animação", que é um resultado aceitável.
 *
 * O custo é um quadro em que o elemento pode piscar visível antes do efeito
 * rodar. Na home isso acontece atrás da cortina do preloader; abaixo da dobra,
 * ninguém está olhando. É uma troca barata por não ter seção fantasma.
 */

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
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    gsap.set(el, { autoAlpha: 0, y })

    const anim = gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      delay,
      ease: 'power3.out',
      // Termina sem estilo inline nenhum: o elemento volta a ser governado
      // pelo CSS, e um revert posterior não tem o que esconder.
      clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })

    return () => {
      anim.scrollTrigger?.kill()
      anim.kill()
      gsap.set(el, { clearProps: 'all' })
    }
  }, [delay, y, reduced])

  return (
    // @ts-expect-error — a união de tags não estreita o tipo da ref, mas todas são HTMLElement
    <Tag ref={ref} className={className}>
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
    if (!words.length) return

    const anim = gsap.fromTo(
      words,
      { yPercent: 115 },
      {
        yPercent: 0,
        duration: 1.1,
        stagger,
        ease: 'expo.out',
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      },
    )

    return () => {
      anim.scrollTrigger?.kill()
      anim.kill()
      gsap.set(words, { clearProps: 'all' })
    }
  }, [stagger, reduced])

  return (
    <span ref={ref} className={cn('inline', className)}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span data-word className="inline-block">
            {word}
            {' '}
          </span>
        </span>
      ))}
    </span>
  )
}
