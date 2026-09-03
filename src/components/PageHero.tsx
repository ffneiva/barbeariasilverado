import type { ReactNode } from 'react'
import { Reveal, SplitHeading } from './Reveal'
import { OpenBadge } from './OpenBadge'

/**
 * Cabeçalho das páginas dedicadas (/agendar e /loja).
 *
 * Deliberadamente mais curto que o Hero da home: estas páginas são destino de
 * anúncio pago, e quem clica num anúncio de "agendar" quer ver o agendamento —
 * não uma navalha girando por dois segundos. Sem preloader, sem WebGL, sem
 * altura de tela cheia. A primeira coisa útil aparece acima da dobra.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  showStatus = true,
}: {
  eyebrow: string
  title: string
  lead: ReactNode
  children?: ReactNode
  showStatus?: boolean
}) {
  return (
    <header className="relative overflow-hidden pt-32 pb-10 sm:pt-40 sm:pb-14">
      {/* Mesma textura do Hero, bem mais discreta: identidade sem competir
          com o conteúdo que vem logo abaixo. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <img src="/images/leather.jpg" alt="" className="h-full w-full object-cover opacity-[0.18]" />
        <div className="absolute inset-0 bg-linear-to-b from-void/70 via-void/85 to-void" />
      </div>

      <div className="container-x">
        <Reveal>
          <span className="label-mono flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-steel-700" />
            {eyebrow}
          </span>
        </Reveal>

        <h1 className="mt-5 max-w-4xl text-[clamp(2.5rem,7.5vw,5.25rem)] text-steel-100">
          <SplitHeading text={title} />
        </h1>

        <Reveal delay={0.12}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-steel-400 sm:text-lg">{lead}</p>
        </Reveal>

        {showStatus && (
          <Reveal delay={0.18}>
            <div className="mt-7">
              <OpenBadge />
            </div>
          </Reveal>
        )}

        {children && (
          <Reveal delay={0.22}>
            <div className="mt-8">{children}</div>
          </Reveal>
        )}
      </div>
    </header>
  )
}
