import { useEffect, useState } from 'react'
import { BUSINESS, whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'
import { getOpenState } from '@/lib/hours'
import { cn } from '@/lib/utils'
import { useScrolledPast } from '@/hooks/useScroll'
import { WhatsAppIcon } from './BrandIcons'

/**
 * Botão flutuante do WhatsApp.
 *
 * Aparece só depois que o visitante passa do Hero — no topo ele competiria com
 * os dois CTAs que já estão na tela. O rótulo se abre no hover em vez de ficar
 * permanentemente expandido, para não tapar conteúdo no celular.
 *
 * O glifo do WhatsApp vem de components/BrandIcons — a lucide-react não traz
 * ícones de marca desde a v1.
 */
export function WhatsAppFab() {
  // Aparece depois de ~85% da primeira tela — no topo ele competiria com os
  // dois CTAs que já estão visíveis.
  const visible = useScrolledPast(typeof window === 'undefined' ? 600 : window.innerHeight * 0.85)
  const [open, setOpen] = useState(() => getOpenState().open)

  useEffect(() => {
    const id = window.setInterval(() => setOpen(getOpenState().open), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <a
      href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Falar com a ${BUSINESS.name} no WhatsApp`}
      className={cn(
        'group fixed right-5 bottom-5 z-90 flex items-center gap-0 overflow-hidden rounded-full',
        'border border-steel-700/70 bg-void/85 py-3 pr-3 pl-3 backdrop-blur-xl',
        'transition-all duration-500 ease-[var(--ease-blade)] hover:border-steel-300 hover:pr-5 sm:right-8 sm:bottom-8',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
      )}
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        {open && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-steel-400"
            style={{ animation: 'pulse-ring 2.6s var(--ease-blade) infinite' }}
          />
        )}
        <WhatsAppIcon className="h-5 w-5 text-steel-100" />
      </span>

      {/* Rótulo com largura 0 → auto: cresce a partir do ícone, sem "pular". */}
      <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-500 ease-[var(--ease-blade)] group-hover:grid-cols-[1fr]">
        <span className="overflow-hidden">
          <span className="block pl-3 font-mono text-[0.65rem] tracking-[0.18em] whitespace-nowrap text-steel-200 uppercase">
            {open ? 'Aberto · chamar' : 'Deixar mensagem'}
          </span>
        </span>
      </span>
    </a>
  )
}
