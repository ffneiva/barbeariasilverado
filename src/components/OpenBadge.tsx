import { useEffect, useState } from 'react'
import { getOpenState } from '@/lib/hours'
import { cn } from '@/lib/utils'

/**
 * Selo "aberto agora".
 *
 * O estado é recalculado a cada minuto porque a página costuma ficar aberta em
 * segundo plano — sem isso, alguém que abriu o site às 11h58 continuaria vendo
 * "aberto" depois que a barbearia parou para o almoço.
 *
 * O cálculo roda no fuso de Goiânia (ver lib/hours), não no do visitante.
 */
export function OpenBadge({ className }: { className?: string }) {
  const [state, setState] = useState(getOpenState)

  useEffect(() => {
    const id = window.setInterval(() => setState(getOpenState()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5',
        'font-mono text-[0.65rem] tracking-[0.16em] uppercase',
        state.open
          ? 'border-steel-500/40 bg-steel-100/[0.06] text-steel-100'
          : 'border-steel-800 bg-white/[0.02] text-steel-500',
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {state.open && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-steel-100"
            style={{ animation: 'pulse-ring 2.4s var(--ease-blade) infinite' }}
          />
        )}
        <span className={cn('relative h-1.5 w-1.5 rounded-full', state.open ? 'bg-steel-100' : 'bg-steel-600')} />
      </span>
      {state.open ? 'Aberto agora' : 'Fechado'}
      <span className="text-steel-600">·</span>
      <span className={state.open ? 'text-steel-400' : 'text-steel-600'}>{state.detail}</span>
    </span>
  )
}
