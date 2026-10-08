import { ArrowUpRight, Clock, Clock3, Eye, Sparkles } from 'lucide-react'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { useSpotlight } from '@/hooks/useSpotlight'
import { SERVICES, PILLARS, whatsappUrl, type Service } from '@/lib/business'
import { BladeIcon } from '@/components/Logo'
import { cn } from '@/lib/utils'

const PILLAR_ICONS = {
  blade: BladeIcon,
  clock: Clock3,
  eye: Eye,
  sparkles: Sparkles,
} as const

/**
 * O card muda de forma no celular.
 *
 * Com nove serviços, a versão em card cheio empilhava quase 1.800 px de
 * rolagem só nesta seção. A saída NÃO foi virar carrossel: preço é informação
 * de consulta, a pessoa varre a lista procurando o item dela, e o que sai da
 * tela num carrossel horizontal simplesmente não é encontrado.
 *
 * Em vez disso, o mesmo card vira uma linha densa até `sm` — nome e preço na
 * mesma altura, descrição em duas linhas — e volta a ser card a partir daí.
 * Nada é escondido; só fica mais apertado onde a tela é estreita.
 */
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useSpotlight<HTMLAnchorElement>()

  return (
    <Reveal delay={0.04 * index} as="li">
      <a
        ref={ref}
        href={whatsappUrl(
          `Olá! Gostaria de agendar um horário para ${service.name.toLowerCase()} na Silverado.`,
        )}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="agendar"
        className={cn(
          'group relative flex h-full items-start gap-4 overflow-hidden rounded-sm border p-4',
          'transition-colors duration-500 sm:flex-col sm:gap-0 sm:p-8',
          service.highlight
            ? 'border-steel-700/80 bg-white/[0.035]'
            : 'border-steel-900 bg-white/[0.015] hover:border-steel-700',
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(211,215,222,0.09), transparent 62%)',
          }}
        />

        <div className="relative min-w-0 flex-1">
          {service.tag && (
            <span className="mb-2 hidden rounded-full border border-steel-700/70 px-2.5 py-1 font-mono text-[0.6rem] tracking-[0.16em] text-steel-400 uppercase sm:inline-block">
              {service.tag}
            </span>
          )}

          <h3 className="text-xl leading-tight text-steel-100 sm:text-4xl">{service.name}</h3>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-steel-500 sm:mt-4 sm:line-clamp-none sm:text-sm sm:text-steel-400">
            {service.description}
          </p>

          <span className="mt-2 flex items-center gap-1.5 font-mono text-[0.6rem] tracking-[0.14em] text-steel-600 uppercase sm:hidden">
            <Clock className="h-3 w-3" strokeWidth={1.5} />
            {service.minutes} min
          </span>
        </div>

        {/* Preço: à direita no celular, na base do card no desktop. */}
        <div className="relative flex shrink-0 flex-col items-end sm:mt-8 sm:w-full sm:flex-row sm:items-end sm:justify-between sm:border-t sm:border-steel-900 sm:pt-5">
          <span className="chrome font-display text-2xl whitespace-nowrap sm:text-3xl">
            {service.fromPrice && (
              <span className="mr-1 font-mono text-[0.55rem] tracking-[0.12em] text-steel-500 uppercase">
                a partir de
              </span>
            )}
            R$ {service.price}
          </span>
          <span className="hidden items-center gap-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-steel-600 uppercase sm:flex">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
            {service.minutes} min
          </span>
        </div>

        <ArrowUpRight
          className="absolute top-4 right-4 hidden h-5 w-5 text-steel-700 transition-all duration-400 ease-[var(--ease-blade)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-steel-200 sm:block"
          strokeWidth={1.5}
        />
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
              Preço fechado, igual ao da tabela na parede. Só selagem, progressiva e botox
              variam com o comprimento — e nesses o valor é combinado{' '}
              <em className="text-steel-200 not-italic">antes</em> de começar.
            </>
          }
        />

        <ul className="mt-10 grid gap-2.5 sm:mt-16 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
        <div className="mt-16 sm:mt-24">
          <Reveal>
            <span className="label-mono flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-steel-700" />
              Por que aqui
            </span>
          </Reveal>

          <ul className="mt-6 grid border-t border-l border-steel-900 sm:mt-8 sm:grid-cols-2">
            {PILLARS.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.icon as keyof typeof PILLAR_ICONS]
              return (
                <Reveal key={pillar.title} delay={0.06 * i} as="li">
                  <div className="group flex h-full flex-col gap-3 border-r border-b border-steel-900 bg-white/[0.012] p-5 transition-colors duration-500 hover:bg-white/[0.03] sm:gap-4 sm:p-9">
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
