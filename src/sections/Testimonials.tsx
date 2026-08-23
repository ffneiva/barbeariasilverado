import { ArrowUpRight, Quote, Star } from 'lucide-react'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { Button } from '@/components/Button'
import { BUSINESS, GOOGLE_PROFILE, GOOGLE_REVIEWS, TESTIMONIALS } from '@/lib/business'
import { cn } from '@/lib/utils'

/**
 * Prova social.
 *
 * A seção se adapta ao que existe: com avaliações reais em `TESTIMONIALS`, ela
 * mostra os cards; sem nenhuma, mostra o convite para avaliar no Google em vez
 * de um vazio — ou, pior, de elogio inventado.
 *
 * Quando houver volume de avaliações públicas, vale publicar `aggregateRating`
 * no JSON-LD (ver lib/seo). Nota agregada sem review verificável por trás é o
 * tipo de coisa que o Google penaliza.
 */
export function Testimonials() {
  const hasReviews = TESTIMONIALS.length > 0

  return (
    <Section id="depoimentos" className="overflow-hidden">
      <div className="container-x">
        <SectionHeading
          eyebrow="05 — Quem senta na cadeira"
          title={hasReviews ? 'O que dizem depois do espelho' : 'A régua é o espelho'}
          lead={
            hasReviews ? (
              <>
                {GOOGLE_REVIEWS.count} avaliações no{' '}
                <a
                  href={GOOGLE_PROFILE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-steel-200 underline decoration-steel-700 underline-offset-4 transition-colors hover:decoration-steel-300"
                >
                  perfil do Google
                </a>
                , todas com nota máxima. Estas são algumas — copiadas palavra por palavra.
              </>
            ) : (
              'A barbearia é nova e as avaliações estão sendo escritas agora — no Google, por quem já sentou na cadeira. Depois do seu corte, conte como foi.'
            )
          }
        />

        {hasReviews ? (
          <>
            <ul className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {TESTIMONIALS.map((item, i) => (
                <Reveal key={item.name} delay={0.06 * i} as="li" className="h-full">
                <figure
                  className={cn(
                    'flex h-full flex-col gap-6 border border-steel-900 bg-white/[0.015] p-7',
                    'transition-colors duration-500 hover:border-steel-700',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Quote className="h-5 w-5 text-steel-700" strokeWidth={1.4} />
                    <div className="flex gap-0.5" aria-label={`${item.rating} de 5`}>
                      {Array.from({ length: 5 }, (_, s) => (
                        <Star
                          key={s}
                          className={cn(
                            'h-3 w-3',
                            s < item.rating ? 'fill-steel-300 text-steel-300' : 'fill-steel-800 text-steel-800',
                          )}
                          strokeWidth={0}
                        />
                      ))}
                    </div>
                  </div>

                  <blockquote className="flex-1 text-sm leading-relaxed text-steel-300">
                    “{item.text}”
                  </blockquote>

                  <figcaption className="border-t border-steel-900 pt-4">
                    <span className="block text-steel-100">{item.name}</span>
                    <span className="label-mono mt-1 block normal-case">{item.handle}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
            </ul>

            <Reveal delay={0.2}>
              <a
                href={GOOGLE_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.18em] text-steel-500 uppercase transition-colors hover:text-steel-100"
              >
                Ver todas as avaliações no Google
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.6} />
              </a>
            </Reveal>
          </>
        ) : (
          <Reveal delay={0.1}>
            <div className="mt-14 flex flex-col items-start gap-7 border border-steel-800 bg-white/[0.02] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="flex gap-1" aria-hidden>
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star key={s} className="h-4 w-4 fill-steel-400 text-steel-400" strokeWidth={0} />
                  ))}
                </div>
                <h3 className="mt-5 text-3xl text-steel-100 sm:text-4xl">
                  Saiu satisfeito? Conte no Google
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-steel-400">
                  Avaliação de cliente é o que faz outra pessoa do bairro escolher a cadeira
                  certa. Leva um minuto e ajuda mais do que qualquer anúncio.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <Button href={GOOGLE_PROFILE} magnetic={false}>
                  Avaliar no Google
                </Button>
                <Button href={BUSINESS.instagram} variant="outline" magnetic={false}>
                  Ver o Instagram
                </Button>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  )
}
