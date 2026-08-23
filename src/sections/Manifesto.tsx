import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Section } from '@/components/SectionHeading'
import { Picture } from '@/components/Picture'
import { Reveal } from '@/components/Reveal'
import { Marquee } from '@/components/Marquee'
import { BladeIcon } from '@/components/Logo'
import { STATS, CUTS } from '@/lib/business'
import { useReducedMotion } from '@/hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

/**
 * Manifesto: um parágrafo longo em que cada palavra acende conforme o scroll,
 * uma foto da casa com parallax e a régua de números.
 *
 * A revelação palavra a palavra existe porque este é o único bloco de texto
 * "denso" do site — o movimento força o ritmo de leitura em vez de deixar o
 * visitante pular tudo.
 */
const MANIFESTO =
  'Uma barbearia não vive de máquina nova nem de cadeira bonita. Vive de barbeiro que ' +
  'escuta o que você quer antes de ligar qualquer máquina — e que entrega exatamente ' +
  'aquilo. É isso que a gente faz no Jardim América, um corte de cada vez.'

export function Manifesto() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // Cada palavra sai de 22% para 100% de opacidade dentro de uma janela de
      // scroll — o texto "acende" da esquerda para a direita.
      gsap.fromTo(
        '[data-manifesto-word]',
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.35,
          scrollTrigger: {
            trigger: '[data-manifesto-text]',
            start: 'top 78%',
            end: 'bottom 58%',
            scrub: 0.5,
          },
        },
      )

      gsap.fromTo(
        '[data-manifesto-photo] img',
        { yPercent: -8, scale: 1.14 },
        {
          yPercent: 8,
          scale: 1.14,
          ease: 'none',
          scrollTrigger: { trigger: '[data-manifesto-photo]', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )

      // Contadores: rodam uma vez, quando a régua entra na tela.
      for (const el of gsap.utils.toArray<HTMLElement>('[data-counter]')) {
        const target = Number(el.dataset.counter)
        const counter = { v: 0 }
        gsap.to(counter, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(counter.v))
          },
        })
      }
    }, rootRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div ref={rootRef}>
      <Section id="manifesto" className="pb-16 sm:pb-20 lg:pb-24">
        <div className="container-x">
          <Reveal>
            <div className="flex items-center gap-4">
              <BladeIcon className="h-6 w-9 text-steel-600" />
              <span className="label-mono">01 — A casa</span>
            </div>
          </Reveal>

          <p
            data-manifesto-text
            className="mt-10 max-w-5xl font-display text-[clamp(1.75rem,4.6vw,3.4rem)] leading-[1.12] text-steel-100 uppercase"
          >
            {MANIFESTO.split(' ').map((word, i) => (
              <span key={`${word}-${i}`} data-manifesto-word className="inline-block opacity-[0.16]">
                {word}
                &nbsp;
              </span>
            ))}
          </p>
        </div>
      </Section>

      {/* Faixa de cortes: nomeia o repertório da casa antes da galeria. */}
      <Marquee
        items={CUTS.map((c) => c.name)}
        duration={44}
        className="border-y border-steel-900 py-5 font-display text-2xl tracking-wide text-steel-700 uppercase sm:text-3xl"
        separator={<BladeIcon className="h-3 w-5 text-steel-800" />}
      />

      <Section id="numeros" className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-x grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20">
          <Reveal className="relative">
            <div data-manifesto-photo className="relative aspect-4/3 overflow-hidden">
              <Picture
                name="hero-shop"
                alt="Atendimento na cadeira da Barbearia Silverado"
                className="h-full w-full"
                sizes="(min-width: 1024px) 52vw, 100vw"
              />
              <div aria-hidden className="absolute inset-0 bg-linear-to-t from-void/70 via-transparent to-transparent" />
              <div aria-hidden className="absolute inset-0 ring-1 ring-steel-800/70 ring-inset" />
            </div>
            <span className="label-mono mt-4 block">Av. C-4, 73 · Jardim América · Goiânia</span>
          </Reveal>

          <div>
            <Reveal>
              <h2 className="text-[clamp(2.2rem,5.5vw,3.75rem)] text-steel-100">
                O corte é seu,
                <br />
                <span className="chrome">não do barbeiro</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl leading-relaxed text-steel-400">
                Tem barbeiro que ouve o pedido e faz do jeito que ele gosta. Aqui é o
                contrário: a referência que você trouxe é o combinado, e o corte só termina
                quando bate com ela. Se você não souber explicar, a gente sugere — mas quem
                decide é você.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-2">
              {STATS.map((stat, i) => (
                <Reveal key={stat.label} delay={0.06 * i}>
                  <div className="border-t border-steel-800 pt-4">
                    <div className="font-display text-4xl text-steel-100 sm:text-5xl">
                      {stat.prefix}
                      <span data-counter={stat.value}>0</span>
                      {stat.suffix}
                    </div>
                    <div className="label-mono mt-2 leading-relaxed normal-case">{stat.label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
