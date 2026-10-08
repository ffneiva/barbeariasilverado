import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Reveal, SplitHeading } from './Reveal'

type Props = {
  /** Numeração/etiqueta em mono — dá ritmo editorial à página. */
  eyebrow: string
  title: string
  lead?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({ eyebrow, title, lead, align = 'left', className }: Props) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      <Reveal>
        <span className={cn('label-mono flex items-center gap-3', align === 'center' && 'justify-center')}>
          <span aria-hidden className="h-px w-8 bg-steel-700" />
          {eyebrow}
        </span>
      </Reveal>

      <h2 className="mt-5 text-[clamp(2.4rem,6.5vw,4.75rem)] text-steel-100">
        <SplitHeading text={title} />
      </h2>

      {lead && (
        <Reveal delay={0.12}>
          <p
            className={cn(
              'mt-5 text-[0.9375rem] leading-relaxed text-steel-400 sm:mt-6 sm:text-lg',
              align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl',
            )}
          >
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/** Envelope padrão de seção: respiro vertical e âncora para a navegação. */
export function Section({
  id,
  children,
  className,
}: {
  id: string
  children: ReactNode
  className?: string
}) {
  return (
    // py-16 no celular (era py-24): com nove seções, 8px a menos de cada lado
    // por seção economizam quase 600px de rolagem sem apertar a leitura.
    <section id={id} className={cn('relative py-16 sm:py-28 lg:py-40', className)}>
      {children}
    </section>
  )
}
