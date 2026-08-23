import { Quote, Star } from 'lucide-react'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { BUSINESS, TESTIMONIALS } from '@/lib/business'
import { cn } from '@/lib/utils'

/**
 * Prova social.
 *
 * Depoimentos escritos e assinados por primeiro nome + bairro, sem foto de
 * banco de imagens e sem nota agregada inventada — a barbearia é nova e ainda
 * está juntando avaliações públicas. Quando o perfil do Google acumular
 * reviews, o caminho é trocar este bloco por elas e aí sim publicar
 * `aggregateRating` no JSON-LD.
 */
export function Testimonials() {
  return (
    <Section id="depoimentos" className="overflow-hidden">
      <div className="container-x">
        <SectionHeading
          eyebrow="05 — Quem senta na cadeira"
          title="O que dizem depois do espelho"
          lead={
            <>
              Comentários de clientes da casa. Deixe o seu no{' '}
              <a
                href={BUSINESS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-steel-200 underline decoration-steel-700 underline-offset-4 transition-colors hover:decoration-steel-300"
              >
                Instagram
              </a>{' '}
              depois da próxima visita.
            </>
          }
        />

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
                  <div className="flex gap-0.5" aria-label="5 de 5">
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star key={s} className="h-3 w-3 fill-steel-400 text-steel-400" strokeWidth={0} />
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
      </div>
    </Section>
  )
}
