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
import { Location } from '@/sections/Location'
import { Faq } from '@/sections/Faq'
import { FinalCta } from '@/sections/FinalCta'
import { Privacy } from '@/pages/Privacy'
import { scrollToSection, useSmoothScroll } from '@/hooks/useSmoothScroll'

/**
 * Roteador de 20 linhas.
 *
 * O site tem exatamente duas telas — a landing e a política de privacidade —,
 * o que não justifica os ~15 kB do react-router. A History API resolve, e o
 * CloudFront já está configurado para devolver o index.html em qualquer 404,
 * então `/politica-de-privacidade` funciona também quando digitado direto.
 */
function usePath() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: string) => {
    window.history.pushState({}, '', next)
    setPath(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return { path, navigate }
}

export default function App() {
  const { path, navigate } = usePath()
  const isPrivacy = path.startsWith('/politica-de-privacidade')

  /**
   * O preloader só existe para a primeira visita à home.
   *
   * A decisão é congelada no estado inicial (avaliado uma única vez) e não
   * derivada de `path`: assim quem entra direto na política de privacidade não
   * assiste a uma cortina que não faz sentido ali, e quem navega entre as duas
   * rotas não vê a abertura de novo — o componente segue montado, com o próprio
   * estado interno lembrando que já terminou.
   */
  const [showPreloader] = useState(
    () => !window.location.pathname.startsWith('/politica-de-privacidade'),
  )

  // `ready` libera a coreografia de entrada do Hero. Sem preloader não há o que
  // esperar — e sem isto o <h1> ficaria preso no translateY inicial, invisível,
  // para quem chegasse à home vindo da política de privacidade.
  const [ready, setReady] = useState(!showPreloader)

  useSmoothScroll()

  const onDone = useCallback(() => setReady(true), [])

  /**
   * Leva a uma seção da home a partir de qualquer rota.
   *
   * Na página de privacidade as seções não estão montadas, então rolar até elas
   * é impossível: primeiro volta-se para "/" e só depois — com o React já tendo
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

  // O título acompanha a rota — importante para histórico e compartilhamento.
  useEffect(() => {
    document.title = isPrivacy
      ? 'Política de privacidade · Barbearia Silverado'
      : 'Barbearia Silverado · Barbearia no Jardim América, Goiânia'
  }, [isPrivacy])

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

      <Nav onSection={goToSection} />

      {isPrivacy ? (
        <Privacy onBack={() => navigate('/')} />
      ) : (
        <main id="conteudo">
          <Hero ready={ready} />
          <Manifesto />
          <Services />
          <Cuts />
          <Booking />
          <Testimonials />
          <Location />
          <Faq />
          <FinalCta />
        </main>
      )}

      <Footer onNavigate={navigate} onSection={goToSection} />
      <WhatsAppFab />
    </>
  )
}
