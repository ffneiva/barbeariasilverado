import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { OpenBadge } from '@/components/OpenBadge'
import { whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'
import { scrollToSection } from '@/hooks/useSmoothScroll'

/**
 * Último empurrão antes do rodapé.
 *
 * A navalha 3D que acompanhou a página se monta aqui, no pouso acima do
 * título: o encerramento "assina" a página (ver components/MarcaFixa).
 */
export function FinalCta() {

  return (
    <section id="fecho" className="relative overflow-hidden border-t border-steel-900 py-28 sm:py-36">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 100%, rgba(211,215,222,0.07), transparent 70%)' }}
      />

      <div className="container-x flex flex-col items-center gap-10 text-center">
        {/* Pouso da navalha 3D: ela vem rolando pela página e se monta aqui.
            Sem WebGL, fica a marca em 2D no mesmo lugar. */}
        <div data-cta-logo className="flex flex-col items-center gap-6">
          <div data-marca-alvo="fecho" className="aspect-[0.955] h-40 sm:h-56">
            <Logo variant="mark" animated className="h-full [.marca-3d_&]:invisible" />
          </div>
          <Logo variant="wordmark" className="w-52 opacity-80 sm:w-72" />
        </div>

        <h2 className="max-w-3xl text-[clamp(2.2rem,6vw,4.25rem)] text-steel-100">
          Seu próximo <span className="chrome">corte</span> está a
          <br className="hidden sm:block" /> uma mensagem de distância
        </h2>

        <OpenBadge />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)}>
            <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
            Chamar no WhatsApp
          </Button>
          <Button size="lg" variant="outline" onClick={() => scrollToSection('agendar')} external={false}>
            Escolher dia e horário
          </Button>
        </div>
      </div>
    </section>
  )
}
