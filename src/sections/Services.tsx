import { ArrowUpRight, Clock, Clock3, Eye, Sparkles } from 'lucide-react'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { useSpotlight } from '@/hooks/useSpotlight'
import { SERVICES, PILLARS, whatsappUrl, type Service } from '@/lib/business'
import { priceLabel } from '@/lib/booking'
import { BladeIcon } from '@/components/Logo'
import { cn } from '@/lib/utils'

const PILLAR_ICONS = {
  blade: BladeIcon,
  clock: Clock3,
  eye: Eye,
  sparkles: Sparkles,
} as const

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useSpotlight<HTMLAnchorElement>()

  return (
    <Reveal delay={0.05 * index} as="li">
      <a
        ref={ref}
        href={whatsappUrl(
          `Olá! Gostaria de agendar um horário para ${service.name.toLowerCase()} na Silverado.`,
        )}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="agendar"
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-sm border p-7 transition-colors duration-500 sm:p-8',
          service.highlight
            ? 'border-steel-700/80 bg-white/[0.035]'
            : 'border-steel-900 bg-white/[0.015] hover:border-steel-700',
        )}
      >
        {/* Holofote que segue o ponteiro — variáveis alimentadas por useSpotlight. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(211,215,222,0.09), transparent 62%)',
          }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            {service.tag && (
              <span className="mb-3 inline-block rounded-full border border-steel-700/70 px-2.5 py-1 font-mono text-[0.6rem] tracking-[0.16em] text-steel-400 uppercase">
                {service.tag}
              </span>
            )}
            <h3 className="text-3xl text-steel-100 sm:text-4xl">{service.name}</h3>
          </div>
          <ArrowUpRight
            className="mt-1 h-5 w-5 shrink-0 text-steel-700 transition-all duration-400 ease-[var(--ease-blade)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-steel-200"
            strokeWidth={1.5}
          />
        </div>

        <p className="relative mt-4 flex-1 text-sm leading-relaxed text-steel-400">{service.description}</p>

        <div className="relative mt-8 flex items-end justify-between gap-4 border-t border-steel-900 pt-5">
          <span
            className={cn(
              'font-display text-3xl',
              service.price === null ? 'text-steel-500' : 'chrome',
            )}
          >
            {service.price === null ? 'Sob consulta' : `R$ ${service.price}`}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-steel-600 uppercase">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
            {service.minutes} min
          </span>
        </div>

        {service.price !== null && (
          <span className="sr-only">{priceLabel(service)}</span>
        )}
      </a>
    </Reveal>
  )
}

export function Services() {
  return (
    <Section id="servicos">
      <div className="container-x">
        <SectionHeading
          eyebrow="02 — Serviços"
          title="O que a gente faz"
          lead={
            <>
              Os preços são a partir de: o valor final depende do comprimento e do tipo de
              cabelo, e é combinado <em className="text-steel-200 not-italic">antes</em> de a
              máquina ligar. Nada de surpresa na hora de pagar.
            </>
          }
        />

        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </ul>

        {/*
          Pilares.

          A versão anterior era uma fileira de quatro colunas soltas, sem moldura
          e sem hierarquia — flutuava no meio da página. Agora é uma grade com
          bordas, no mesmo vocabulário visual dos cards de serviço logo acima:
          índice em mono, ícone, título e uma frase concreta.
        */}
        <div className="mt-24">
          <Reveal>
            <span className="label-mono flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-steel-700" />
              Por que aqui
            </span>
          </Reveal>

          <ul className="mt-8 grid border-t border-l border-steel-900 sm:grid-cols-2">
            {PILLARS.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.icon as keyof typeof PILLAR_ICONS]
              return (
                <Reveal key={pillar.title} delay={0.06 * i} as="li">
                  <div className="group flex h-full flex-col gap-4 border-r border-b border-steel-900 bg-white/[0.012] p-7 transition-colors duration-500 hover:bg-white/[0.03] sm:p-9">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[0.65rem] tracking-[0.22em] text-steel-700">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <Icon
                        className="h-5 w-7 text-steel-600 transition-colors duration-500 group-hover:text-steel-300"
                        strokeWidth={1.5}
                      />
                    </div>

                    <h3 className="mt-2 text-2xl leading-tight text-steel-100 sm:text-[1.75rem]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-steel-500">{pillar.text}</p>
                  </div>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </div>
    </Section>
  )
}
