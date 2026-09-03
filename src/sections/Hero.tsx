import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, MapPin, MessageCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { OpenBadge } from '@/components/OpenBadge'
import { Picture } from '@/components/Picture'
import { BUSINESS, whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'
import { useIsDesktop, useReducedMotion } from '@/hooks/useMediaQuery'
import { scrollToSection } from '@/hooks/useSmoothScroll'

gsap.registerPlugin(ScrollTrigger)

// O bundle do three.js é o maior do site. Mantê-lo atrás de um lazy import faz
// o texto do Hero pintar sem esperar o WebGL — a navalha entra depois, por cima.
const BladeScene = lazy(() => import('@/components/BladeScene'))

export function Hero({ ready }: { ready: boolean }) {
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const isDesktop = useIsDesktop()
  const [showScene, setShowScene] = useState(false)

  // A cena 3D só é buscada quando a thread principal fica ociosa — assim ela
  // nunca disputa CPU com a animação de entrada do próprio Hero.
  useEffect(() => {
    if (!ready || reduced) return
    const show = () => setShowScene(true)

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(show, { timeout: 1500 })
      return () => window.cancelIdleCallback(handle)
    }

    const handle = window.setTimeout(show, 600) // Safari < 17
    return () => window.clearTimeout(handle)
  }, [ready, reduced])

  // Entrada coreografada, disparada só quando a cortina do preloader saiu.
  //
  // Cada tween termina com `clearProps`, devolvendo o elemento ao CSS. Isso
  // importa mais do que parece: sem isso, o estado "escondido" fica gravado
  // inline e um revert do contexto — ou qualquer re-execução do efeito —
  // deixaria o título permanentemente fora da tela.
  useEffect(() => {
    if (!ready || reduced) return

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out', duration: 1.2 } })
        .fromTo(
          '[data-hero-line] > span',
          { yPercent: 130 },
          { yPercent: 0, stagger: 0.09, clearProps: 'transform' },
        )
        .fromTo(
          '[data-hero-fade]',
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, stagger: 0.08, clearProps: 'transform,opacity,visibility' },
          '-=0.75',
        )
        .fromTo(
          '[data-hero-rule]',
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, clearProps: 'transform' },
          '-=1',
        )
    }, rootRef)

    return () => ctx.revert()
  }, [ready, reduced])

  // Parallax de saída: o conteúdo sobe mais devagar que a página e desvanece,
  // o que faz a próxima seção parecer passar "por trás" do Hero.
  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.to('[data-hero-parallax]', {
        yPercent: -14,
        autoAlpha: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={rootRef}
      id="inicio"
      className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden pt-28 pb-8"
    >
      {/* Fundo: couro escurecido + vinheta.
          Via <Picture> para sair em AVIF — a versão .jpg crua pesava 268 kB,
          dez vezes mais, para um resultado idêntico a 28% de opacidade. */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Picture
          name="leather"
          alt=""
          className="h-full w-full opacity-[0.28]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-void via-void/70 to-void" />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 42%, transparent, #030304 78%)' }}
        />
      </div>

      {/* Navalha em WebGL, centrada atrás do título. */}
      {showScene && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Suspense fallback={null}>
            <div className="h-full w-full opacity-0 [animation:fade-in_1.4s_var(--ease-blade)_forwards]">
              <BladeScene />
            </div>
          </Suspense>
        </div>
      )}

      <div data-hero-parallax className="container-x relative flex flex-1 flex-col justify-center">
        <div className="max-w-4xl">
          <div data-hero-fade className="mb-7 flex flex-wrap items-center gap-4">
            <OpenBadge />
            <span className="label-mono hidden sm:inline">Barbearia · Jardim América, Goiânia</span>
          </div>

          {/* Sem transform inline: o título nasce visível e é o GSAP que o
              esconde para animar. Se a animação não rodar, o pior caso é um
              título estático — nunca um título invisível. */}
          <h1 className="text-[clamp(3.2rem,12.5vw,10.5rem)] leading-[0.85]">
            {['Do jeito', 'que você pediu'].map((line, i) => (
              <span key={line} data-hero-line className="-mt-[0.18em] block overflow-hidden pt-[0.18em] pb-[0.06em]">
                <span className={i === 0 ? 'chrome inline-block' : 'chrome animate-sheen inline-block'}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <div data-hero-rule className="hairline mt-9 max-w-lg origin-left" />

          <p data-hero-fade className="mt-7 max-w-xl text-base leading-relaxed text-steel-400 sm:text-lg">
            Degradê, fade, barba e sobrancelha no Jardim América. Você chega com a
            referência na cabeça — ou só com uma ideia — e sai com o corte que pediu.
          </p>

          <div data-hero-fade className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button size="lg" onClick={() => scrollToSection('agendar')} magnetic={isDesktop} external={false}>
              Marcar meu horário
            </Button>
            <Button
              size="lg"
              variant="outline"
              href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)}
              magnetic={isDesktop}
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
              Chamar no WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Rodapé do Hero: endereço, logotipo e a seta de rolagem. */}
      <div data-hero-fade className="container-x relative">
        <div className="hairline mb-6" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <a
            href={BUSINESS.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 text-sm text-steel-500 transition-colors hover:text-steel-200"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              {BUSINESS.address.street}
              <br />
              <span className="text-steel-600 group-hover:text-steel-400">
                {BUSINESS.address.district}, {BUSINESS.address.city}/{BUSINESS.address.state}
              </span>
            </span>
          </a>

          <Logo variant="wordmark" className="hidden w-32 opacity-40 lg:block" />

          <button
            type="button"
            onClick={() => scrollToSection('manifesto')}
            className="flex items-center gap-3 self-start font-mono text-[0.65rem] tracking-[0.28em] text-steel-600 uppercase transition-colors hover:text-steel-200 sm:self-auto"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-steel-800">
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" strokeWidth={1.5} />
            </span>
            Role
          </button>
        </div>
      </div>
    </section>
  )
}
