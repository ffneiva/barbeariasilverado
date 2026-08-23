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
              'mt-6 text-base leading-relaxed text-steel-400 sm:text-lg',
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
    <section id={id} className={cn('relative py-24 sm:py-32 lg:py-40', className)}>
      {children}
    </section>
  )
}
