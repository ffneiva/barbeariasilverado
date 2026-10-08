import { useCallback, useEffect, useState } from 'react'
import { Preloader } from '@/components/Preloader'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Cursor } from '@/components/Cursor'
import { Grain, ScrollProgress } from '@/components/Atmosphere'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { Hero } from '@/sections/Hero'
import { Manifesto } from '@/sections/Manifesto'
import { Services } from '@/sections/Services'
import { Cuts } from '@/sections/Cuts'
import { Booking } from '@/sections/Booking'
import { Testimonials } from '@/sections/Testimonials'
import { Products } from '@/sections/Products'
import { Location } from '@/sections/Location'
import { Faq } from '@/sections/Faq'
import { FinalCta } from '@/sections/FinalCta'
import { Privacy } from '@/pages/Privacy'
import { NaoEncontrada } from '@/pages/NaoEncontrada'
import { Agendar } from '@/pages/Agendar'
import { Loja } from '@/pages/Loja'
import { routeFor } from '@/lib/routes'
import { useRouteMeta } from '@/hooks/useRouteMeta'
import { useRouteAnnounce } from '@/hooks/useRouteAnnounce'
import { scrollToSection, useSmoothScroll } from '@/hooks/useSmoothScroll'

/**
 * Roteador de ~30 linhas.
 *
 * São quatro telas — a landing, /agendar, /loja e a política de privacidade —,
 * o que ainda não justifica os ~15 kB do react-router. A History API resolve.
 *
 * As rotas e seus metadados vivem em lib/routes.ts, que também é lido pelo
 * build para gerar um HTML estático por rota: assim /agendar e /loja chegam ao
 * robô do Google Ads e ao leitor de link do WhatsApp já com título e descrição
 * próprios, sem depender de a aplicação rodar.
 */
function usePath() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: string) => {
    if (next === window.location.pathname) return
    window.history.pushState({}, '', next)
    setPath(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return { path, navigate }
}

export default function App() {
  const { path, navigate } = usePath()
  const route = routeFor(path)
  const isHome = route.path === '/'

  useRouteMeta(route)
  useSmoothScroll()
  const { alvoRef, aviso } = useRouteAnnounce(route)

  /**
   * O preloader só existe para a primeira visita à home.
   *
   * A decisão é congelada no estado inicial (avaliado uma única vez) e não
   * derivada de `path`: quem cai direto em /agendar vindo de um anúncio não
   * pode esperar uma cortina antes de ver o agendamento, e quem navega entre
   * as rotas depois não vê a abertura de novo.
   */
  const [showPreloader] = useState(() => routeFor(window.location.pathname).path === '/')

  // `ready` libera a coreografia de entrada do Hero. Sem preloader não há o que
  // esperar — e sem isto o <h1> ficaria preso no translateY inicial, invisível.
  const [ready, setReady] = useState(!showPreloader)
  const onDone = useCallback(() => setReady(true), [])

  /**
   * Leva a uma seção da home a partir de qualquer rota.
   *
   * Fora da home as seções não estão montadas, então rolar até elas é
   * impossível: primeiro volta-se para "/" e só depois — com o React já tendo
   * pintado a home — é que a rolagem acontece. Os dois `requestAnimationFrame`
   * aninhados garantem esse "depois" sem `setTimeout` chutado.
   */
  const goToSection = useCallback(
    (id: string) => {
      if (document.getElementById(id)) {
        scrollToSection(id)
        return
      }
      navigate('/')
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(id)))
    },
    [navigate],
  )

  return (
    <>
      {showPreloader && <Preloader onDone={onDone} />}

      <Cursor />
      <Grain />
      <ScrollProgress />

      <a
        href="#conteudo"
        className="sr-only rounded-full bg-steel-100 px-5 py-2 font-mono text-xs text-void focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300]"
      >
        Pular para o conteúdo
      </a>

      {/* Região viva: só existe para o leitor de tela saber que a rota mudou. */}
      <p aria-live="polite" role="status" className="sr-only">
        {aviso}
      </p>

      <Nav onSection={goToSection} path={path} />

      {/* Recebe o foco a cada troca de rota (ver useRouteAnnounce), para a
          navegação por teclado recomeçar do início do conteúdo novo. */}
      <div ref={alvoRef} tabIndex={-1} className="outline-none">
      {route.path === '/agendar' && <Agendar onNavigate={navigate} />}
      {route.path === '/loja' && <Loja onNavigate={navigate} />}
      {route.path === '/politica-de-privacidade' && <Privacy onBack={() => navigate('/')} />}
      {route.path === '/404' && <NaoEncontrada onNavigate={navigate} />}

      {isHome && (
        <main id="conteudo">
          <Hero ready={ready} />
          <Manifesto />
          <Services />
          <Booking />
          <Cuts />
          <Testimonials />
          <Products />
          <Faq />
          <Location />
          <FinalCta />
        </main>
      )}
      </div>

      <Footer onNavigate={navigate} onSection={goToSection} />
      <WhatsAppFab />
    </>
  )
}
