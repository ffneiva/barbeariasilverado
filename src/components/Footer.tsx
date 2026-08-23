import { Mail, MapPin } from 'lucide-react'
import { InstagramIcon } from './BrandIcons'
import { Logo } from './Logo'
import { BUSINESS, SCHEDULE_SUMMARY } from '@/lib/business'

const NAV = [
  { id: 'manifesto', label: 'A casa' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'cortes', label: 'Cortes' },
  { id: 'agendar', label: 'Agendar' },
  { id: 'depoimentos', label: 'Depoimentos' },
  { id: 'duvidas', label: 'Dúvidas' },
  { id: 'localizacao', label: 'Onde estamos' },
]

export function Footer({
  onNavigate,
  onSection,
}: {
  onNavigate: (path: string) => void
  onSection: (id: string) => void
}) {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-steel-900 bg-ink">
      <div className="container-x py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          <div>
            <Logo variant="wordmark" className="w-40" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-steel-500">
              {BUSINESS.tagline}. Barbearia no Jardim América, em Goiânia — corte, barba e
              acabamento na lâmina, com hora marcada.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={BUSINESS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${BUSINESS.instagramHandle}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-steel-800 text-steel-400 transition-colors hover:border-steel-500 hover:text-steel-100"
              >
                <InstagramIcon />
              </a>
              <a
                href={`mailto:${BUSINESS.email}`}
                aria-label={`E-mail ${BUSINESS.email}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-steel-800 text-steel-400 transition-colors hover:border-steel-500 hover:text-steel-100"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <nav aria-label="Rodapé">
            <span className="label-mono">Navegar</span>
            <ul className="mt-5 space-y-2.5">
              {NAV.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSection(item.id)}
                    className="text-sm text-steel-400 transition-colors hover:text-steel-100"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <span className="label-mono">Horários</span>
            <ul className="mt-5 space-y-3 text-sm">
              {SCHEDULE_SUMMARY.map((row) => (
                <li key={row.days}>
                  <span className="block text-steel-300">{row.days}</span>
                  <span className="block text-steel-600">
                    {row.hours}
                    {row.lunch && ` · ${row.lunch}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="label-mono">Endereço</span>
            <a
              href={BUSINESS.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-start gap-2.5 text-sm text-steel-400 transition-colors hover:text-steel-100"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>
                {BUSINESS.address.street}
                <br />
                {BUSINESS.address.district}
                <br />
                {BUSINESS.address.city}/{BUSINESS.address.state} · {BUSINESS.address.zip}
              </span>
            </a>
            <a
              href={`tel:+${BUSINESS.whatsapp}`}
              className="mt-4 block font-mono text-sm text-steel-300 transition-colors hover:text-white"
            >
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>

        <div className="hairline my-12" />

        {/* Rodapé legal — MEI exige a identificação do prestador. */}
        <div className="flex flex-col gap-5 text-xs text-steel-600 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-2xl leading-relaxed">
            © {year} {BUSINESS.name}. {BUSINESS.legal.razaoSocial} · CNPJ {BUSINESS.legal.cnpj} ·{' '}
            {BUSINESS.legal.regime}. Todos os direitos reservados.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => onNavigate('/politica-de-privacidade')}
              className="transition-colors hover:text-steel-300"
            >
              Política de privacidade
            </button>
            <a
              href="https://github.com/ffneiva/barbeariasilverado"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-steel-300"
            >
              Código-fonte
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
