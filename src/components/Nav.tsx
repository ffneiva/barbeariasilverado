import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Menu, X } from 'lucide-react'
import { InstagramIcon } from './BrandIcons'
import { Logo } from './Logo'
import { Button } from './Button'
import { OpenBadge } from './OpenBadge'
import { BUSINESS } from '@/lib/business'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

const LINKS = [
  { id: 'manifesto', label: 'A casa' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'cortes', label: 'Cortes' },
  { id: 'agendar', label: 'Agendar' },
  { id: 'localizacao', label: 'Onde estamos' },
]

export function Nav({
  onSection,
  /** Rota atual. Só serve para religar o observer quando a página troca. */
  path,
}: {
  onSection: (id: string) => void
  path: string
}) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('inicio')

  // Numa rota sem as seções (a política de privacidade), nada deve ficar aceso.
  // Derivar isso do path é melhor do que zerar `active` dentro do efeito: o
  // estado antigo é preservado e volta sozinho quando o visitante retorna.
  const highlight = LINKS.some(({ id }) => id === active) && !path.startsWith('/politica')
  const overlayRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Fundo do header só aparece depois que a página sai do topo — sobre o Hero
  // ele atrapalharia a leitura do título.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 'top -80',
      onUpdate: (self) => setScrolled(self.scroll() > 80),
    })
    return () => trigger.kill()
  }, [])

  // Marca o link da seção visível. Um observer por seção é mais barato do que
  // recalcular posições a cada quadro de rolagem.
  //
  // O efeito depende de `path` porque as seções são desmontadas na página de
  // privacidade: sem religar o observer ao voltar para a home, ele fica sem
  // nenhum alvo e o menu congela no último item marcado — era por isso que
  // "Onde estamos" ficava aceso para sempre depois de visitar a política.
  useEffect(() => {
    const sections = LINKS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    )

    for (const el of sections) observer.observe(el)
    return () => observer.disconnect()
  }, [path])

  // Menu mobile: trava a rolagem de fundo e escalona a entrada dos links.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'

    const ctx = gsap.context(() => {
      if (reduced) return
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('[data-menu-panel]', { yPercent: -100 }, { yPercent: 0, duration: 0.7 })
        .fromTo('[data-menu-item]', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.6 }, '-=0.35')
    }, overlayRef)

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      ctx.revert()
    }
  }, [open, reduced])

  const go = (id: string) => {
    setOpen(false)
    // Um quadro de folga para o overlay sair antes de a página rolar.
    requestAnimationFrame(() => onSection(id))
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-100 transition-all duration-500 ease-[var(--ease-blade)]',
          scrolled
            ? 'border-b border-steel-900/80 bg-void/72 py-3 backdrop-blur-xl'
            : 'border-b border-transparent py-6',
        )}
      >
        <div className="container-x flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => go('inicio')}
            aria-label={`${BUSINESS.name} — ir para o topo`}
            className="shrink-0"
          >
            <Logo
              variant="wordmark"
              className={cn('transition-all duration-500 ease-[var(--ease-blade)]', scrolled ? 'w-28' : 'w-36')}
            />
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            {LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                className={cn(
                  'relative rounded-full px-4 py-2 font-mono text-[0.7rem] tracking-[0.16em] uppercase transition-colors duration-300',
                  highlight && active === link.id ? 'text-steel-50' : 'text-steel-500 hover:text-steel-200',
                )}
              >
                {link.label}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-4 -bottom-0.5 h-px origin-center bg-steel-300 transition-transform duration-400 ease-[var(--ease-blade)]',
                    highlight && active === link.id ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${BUSINESS.instagramHandle}`}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-steel-800 text-steel-400 transition-colors hover:border-steel-500 hover:text-steel-100 sm:flex"
            >
              <InstagramIcon />
            </a>

            <Button
              onClick={() => go('agendar')}
              external={false}
              className="hidden sm:inline-flex"
              magnetic={false}
            >
              Agendar
            </Button>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-steel-800 text-steel-200 transition-colors hover:border-steel-500 lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div ref={overlayRef} className="fixed inset-0 z-[150] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div data-menu-panel className="absolute inset-0 flex flex-col bg-void">
            <div className="container-x flex items-center justify-between py-6">
              <Logo variant="wordmark" className="w-32" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-steel-800 text-steel-200"
              >
                <X className="h-4.5 w-4.5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="container-x flex flex-1 flex-col justify-center gap-1" aria-label="Navegação principal">
              {LINKS.map((link, i) => (
                <button
                  key={link.id}
                  data-menu-item
                  type="button"
                  onClick={() => go(link.id)}
                  className="group flex items-baseline gap-5 border-b border-steel-900 py-5 text-left"
                >
                  <span className="font-mono text-[0.65rem] text-steel-700">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-4xl text-steel-200 uppercase transition-colors group-hover:text-white sm:text-5xl">
                    {link.label}
                  </span>
                </button>
              ))}
            </nav>

            <div data-menu-item className="container-x flex flex-col gap-5 py-8">
              <OpenBadge />
              <div className="flex items-center justify-between">
                <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className="label-mono hover:text-steel-200">
                  {BUSINESS.instagramHandle}
                </a>
                <a href={`tel:+${BUSINESS.whatsapp}`} className="label-mono hover:text-steel-200">
                  {BUSINESS.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
