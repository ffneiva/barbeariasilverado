import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { ArrowDown, MapPin, MessageCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { OpenBadge } from '@/components/OpenBadge'
import { Picture } from '@/components/Picture'
import { BUSINESS, whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'
import { useIsDesktop, useReducedMotion } from '@/hooks/useMediaQuery'
import { scrollToSection } from '@/hooks/useSmoothScroll'
import { cn } from '@/lib/utils'

// O bundle do three.js é o maior do site. Mantê-lo atrás de um lazy import faz
// o texto do Hero pintar sem esperar o WebGL — a navalha entra depois, por cima.
const BladeScene = lazy(() => import('@/components/BladeScene'))

export function Hero({ ready }: { ready: boolean }) {
  const rootRef = useRef<HTMLElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
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

  // A entrada e o parallax do Hero são CSS (ver index.css). O React só decide
  // QUANDO liberar: `hero-armed` esconde os elementos enquanto o preloader
  // cobre a tela, e `hero-ready` dispara a coreografia quando ele sai.
  //
  // A ordem importa e já custou um bug: se o estado escondido morasse no
  // markup sem depender de `hero-armed`, uma falha em liberar deixaria o <h1>
  // invisível para sempre. Sem a classe, nada é escondido.
  const heroClasses = reduced ? '' : ready ? 'hero-armed hero-ready' : 'hero-armed'

  // Parallax de saída: o conteúdo sobe mais devagar que a página e desvanece,
  // o que faz a próxima seção parecer passar "por trás" do Hero.
  useEffect(() => {
    if (reduced) return
    const el = parallaxRef.current
    const section = rootRef.current
    if (!el || !section) return

    let agendado = false
    const atualizar = () => {
      agendado = false
      const altura = section.offsetHeight || 1
      const p = Math.min(1, Math.max(0, window.scrollY / altura))
      el.style.transform = `translateY(${(-14 * p).toFixed(2)}%)`
      el.style.opacity = String(1 - p * 0.85)
    }
    const onScroll = () => {
      if (agendado) return
      agendado = true
      requestAnimationFrame(atualizar)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    atualizar()
    return () => {
      window.removeEventListener('scroll', onScroll)
      el.style.transform = ''
      el.style.opacity = ''
    }
  }, [reduced])

  return (
    <section
      ref={rootRef}
      id="inicio"
      className={cn(
        'relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden pt-28 pb-8',
        heroClasses,
      )}
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

      <div ref={parallaxRef} className="container-x relative flex flex-1 flex-col justify-center">
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
