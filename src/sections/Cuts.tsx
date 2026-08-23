import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, X } from 'lucide-react'
import { Picture } from '@/components/Picture'
import { Reveal, SplitHeading } from '@/components/Reveal'
import { Button } from '@/components/Button'
import { CUTS, whatsappUrl, type Cut } from '@/lib/business'
import { cutMessage } from '@/lib/booking'
import { cn } from '@/lib/utils'
import { useIsDesktop, useReducedMotion } from '@/hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

/**
 * Galeria dos nove cortes.
 *
 * No desktop a seção é "pinada" e o scroll vertical vira deslocamento
 * horizontal: o visitante percorre o repertório inteiro com o mesmo gesto que
 * já estava fazendo, sem precisar descobrir um carrossel com setas.
 *
 * No celular isso seria hostil — sequestrar o scroll numa tela pequena confunde
 * mais do que encanta —, então lá vale a rolagem horizontal nativa com
 * `snap`, que já tem inércia e é familiar.
 */

function CutCard({ cut, index, onOpen }: { cut: Cut; index: number; onOpen: (cut: Cut) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(cut)}
      data-cut-card
      data-cursor="ver corte"
      className="group relative w-[78vw] shrink-0 snap-center overflow-hidden text-left sm:w-[52vw] lg:w-[30rem]"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-steel-900">
        <Picture
          name={cut.image}
          alt={`Corte ${cut.name} feito na Barbearia Silverado`}
          className="h-full w-full"
          imgClassName="transition-transform duration-[900ms] ease-[var(--ease-blade)] group-hover:scale-[1.06]"
          sizes="(min-width: 1024px) 30rem, 78vw"
        />

        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-void via-void/15 to-transparent" />
        <div aria-hidden className="absolute inset-0 ring-1 ring-steel-800/60 ring-inset" />

        {/* Fio de luz que corre pela borda inferior no hover — o "corte". */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-transparent via-steel-100 to-transparent transition-transform duration-700 ease-[var(--ease-blade)] group-hover:scale-x-100"
        />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          <span className="label-mono">
            {String(index + 1).padStart(2, '0')} · {cut.family}
          </span>
          <h3 className="mt-2 text-4xl text-steel-50 sm:text-5xl">{cut.name}</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-steel-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            {cut.blurb}
          </p>
        </div>
      </div>
    </button>
  )
}

function Lightbox({ cut, onClose }: { cut: Cut; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('[data-lightbox-bg]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
        .fromTo('[data-lightbox-panel]', { autoAlpha: 0, y: 40, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8 }, '-=0.2')
    }, ref)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      ctx.revert()
    }
  }, [onClose])

  return (
    <div ref={ref} className="fixed inset-0 z-[180] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`Corte ${cut.name}`}>
      <button
        data-lightbox-bg
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-void/92 backdrop-blur-md"
      />

      <div data-lightbox-panel className="relative grid max-h-[88vh] w-full max-w-5xl overflow-hidden border border-steel-800 bg-ink md:grid-cols-[1.05fr_1fr]">
        <div className="relative aspect-4/5 md:aspect-auto">
          <Picture
            name={cut.image}
            alt={`Corte ${cut.name} feito na Barbearia Silverado`}
            className="h-full w-full"
            sizes="(min-width: 768px) 45vw, 100vw"
            priority
          />
        </div>

        <div className="flex flex-col justify-center gap-6 p-8 sm:p-12">
          <div>
            <span className="label-mono">{cut.family}</span>
            <h3 className="mt-3 text-5xl text-steel-50 sm:text-6xl">{cut.name}</h3>
          </div>
          <p className="leading-relaxed text-steel-400">{cut.blurb}</p>
          <div className="hairline" />
          <Button href={whatsappUrl(cutMessage(cut.name))} size="lg" magnetic={false}>
            Quero este corte
            <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
          </Button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-steel-800 bg-void/70 text-steel-300 backdrop-blur transition-colors hover:border-steel-500 hover:text-white"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

export function Cuts() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Cut | null>(null)
  const isDesktop = useIsDesktop()
  const reduced = useReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track || !isDesktop || reduced) return

    const ctx = gsap.context(() => {
      // A distância a percorrer é recalculada em `end` (função) para sobreviver
      // a mudanças de largura sem precisar de um listener de resize próprio.
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 96)

      const horizontal = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })

      // Cada card ganha uma leve inclinação conforme cruza o centro da tela.
      gsap.utils.toArray<HTMLElement>('[data-cut-card]').forEach((card) => {
        gsap.fromTo(
          card,
          { rotateY: 7, scale: 0.965 },
          {
            rotateY: -7,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: horizontal, start: 'left right', end: 'right left', scrub: true },
          },
        )
      })
    }, section)

    return () => ctx.revert()
  }, [isDesktop, reduced])

  return (
    <>
      <section ref={sectionRef} id="cortes" className="relative overflow-hidden py-24 sm:py-28 lg:h-screen lg:py-0">
        <div className="lg:flex lg:h-full lg:flex-col lg:justify-center">
          <div className="container-x lg:pt-24">
            <Reveal>
              <span className="label-mono flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-steel-700" />
                03 — Repertório
              </span>
            </Reveal>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
              <h2 className="text-[clamp(2.4rem,6.5vw,4.75rem)] text-steel-100">
                <SplitHeading text="Nove cortes de assinatura" />
              </h2>
              <Reveal delay={0.15}>
                <p className="label-mono max-w-xs leading-relaxed normal-case">
                  {isDesktop ? 'Role para percorrer · clique para ampliar' : 'Arraste para o lado · toque para ampliar'}
                </p>
              </Reveal>
            </div>
          </div>

          <div
            ref={trackRef}
            className={cn(
              'mt-12 flex gap-4 px-5 sm:gap-6 sm:px-10 lg:mt-14 lg:px-14',
              // No mobile/tablet, rolagem nativa com encaixe.
              'snap-x snap-mandatory overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              // No desktop pinado, o GSAP move o track; o overflow precisa sair.
              'lg:overflow-visible lg:pb-0',
            )}
            style={{ perspective: '1400px' }}
          >
            {CUTS.map((cut, i) => (
              <CutCard key={cut.id} cut={cut} index={i} onOpen={setSelected} />
            ))}

            {/* Cartão final: converte quem chegou até o fim da galeria. */}
            <div className="flex w-[78vw] shrink-0 snap-center flex-col justify-center gap-6 border border-steel-800 bg-white/[0.02] p-8 sm:w-[52vw] sm:p-10 lg:w-[26rem]">
              <span className="label-mono">Não achou o seu?</span>
              <h3 className="text-4xl text-steel-100">Traz a foto que a gente faz</h3>
              <p className="text-sm leading-relaxed text-steel-400">
                Manda a referência no WhatsApp. A gente avalia se o corte funciona no seu tipo
                de cabelo e te responde antes de você sair de casa.
              </p>
              <Button href={whatsappUrl('Olá! Tenho uma foto de referência de corte. Consigo fazer na Silverado?')} magnetic={false}>
                Enviar referência
              </Button>
            </div>
          </div>
        </div>
      </section>

      {selected && <Lightbox cut={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
