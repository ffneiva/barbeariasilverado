import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { OpenBadge } from '@/components/OpenBadge'
import { whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'
import { scrollToSection } from '@/hooks/useSmoothScroll'
import { useReducedMotion } from '@/hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

/**
 * Último empurrão antes do rodapé.
 *
 * O logotipo cresce conforme a seção sobe — um encerramento que "assina" a
 * página, ecoando a abertura do preloader.
 */
export function FinalCta() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-cta-logo]',
        { scale: 0.82, autoAlpha: 0.35 },
        {
          scale: 1,
          autoAlpha: 1,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'center center', scrub: 0.7 },
        },
      )
    }, ref)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-steel-900 py-28 sm:py-36">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 100%, rgba(211,215,222,0.07), transparent 70%)' }}
      />

      <div className="container-x flex flex-col items-center gap-10 text-center">
        <div data-cta-logo className="w-64 sm:w-96">
          <Logo variant="wordmark" animated />
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
            Montar meu agendamento
          </Button>
        </div>
      </div>
    </section>
  )
}
