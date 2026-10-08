import { Mail, Navigation, Phone } from 'lucide-react'
import { InstagramIcon } from '@/components/BrandIcons'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { Button } from '@/components/Button'
import { OpenBadge } from '@/components/OpenBadge'
import { BUSINESS, SCHEDULE } from '@/lib/business'
import { label, todayIndex } from '@/lib/hours'
import { cn } from '@/lib/utils'

/**
 * Onde fica, quando abre e como falar.
 *
 * O iframe do Google carrega junto com a seção, mas com `loading="lazy"`: o
 * navegador só busca o mapa quando ele chega perto da viewport, então quem
 * nunca rola até aqui não paga por ele. Como a seção fica no fim da página,
 * isso já mantém o mapa fora do carregamento inicial.
 */
export function Location() {
  const today = todayIndex()

  return (
    <Section id="localizacao">
      <div className="container-x">
        <SectionHeading
          eyebrow="08 — Onde estamos"
          title="Jardim América, Goiânia"
          lead="Na Avenida C-4, a poucos minutos do Setor Bueno e do Setor Oeste."
        />

        <div className="mt-10 grid gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* Mapa */}
          <Reveal className="relative min-h-[22rem] border border-steel-800 lg:min-h-[30rem]">
            <iframe
              title={`Mapa — ${BUSINESS.name}`}
              src={BUSINESS.mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              // Dessaturado e com mais contraste para o mapa não brigar com a
              // paleta monocromática do resto da página.
              className="absolute inset-0 h-full w-full grayscale-[0.4] contrast-[1.15] brightness-[0.92]"
            />
          </Reveal>

          {/* Ficha */}
          <div className="grid gap-4">
            <Reveal className="border border-steel-800 bg-white/[0.02] p-7 sm:p-8">
              <OpenBadge />

              <address className="mt-6 not-italic">
                <span className="block text-xl leading-snug text-steel-100">{BUSINESS.address.street}</span>
                <span className="mt-1 block text-steel-500">
                  {BUSINESS.address.district} · {BUSINESS.address.city}/{BUSINESS.address.state} ·{' '}
                  CEP {BUSINESS.address.zip}
                </span>
              </address>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={BUSINESS.mapsLink} magnetic={false}>
                  <Navigation className="h-4 w-4" strokeWidth={1.6} />
                  Traçar rota
                </Button>
                <Button href={`tel:+${BUSINESS.whatsapp}`} variant="outline" magnetic={false} external={false}>
                  <Phone className="h-4 w-4" strokeWidth={1.6} />
                  {BUSINESS.phoneDisplay}
                </Button>
              </div>

              <div className="mt-7 flex flex-col gap-3 border-t border-steel-900 pt-6 text-sm">
                <a
                  href={BUSINESS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-steel-400 transition-colors hover:text-steel-100"
                >
                  <InstagramIcon />
                  {BUSINESS.instagramHandle}
                </a>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="flex items-center gap-3 text-steel-400 transition-colors hover:text-steel-100"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.5} />
                  {BUSINESS.email}
                </a>
              </div>
            </Reveal>

            {/* Grade de horários com o dia de hoje destacado */}
            <Reveal delay={0.08} className="border border-steel-800 bg-white/[0.02] p-7 sm:p-8">
              <span className="label-mono">Horário de funcionamento</span>
              <ul className="mt-5 divide-y divide-steel-900">
                {SCHEDULE.map((day, i) => (
                  <li
                    key={day.label}
                    className={cn(
                      'flex items-baseline justify-between gap-4 py-2.5 text-sm',
                      i === today ? 'text-steel-100' : 'text-steel-500',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {i === today && <span aria-hidden className="h-1 w-1 rounded-full bg-steel-200" />}
                      {day.label}
                      {i === today && <span className="label-mono">Hoje</span>}
                    </span>
                    <span className="text-right font-mono text-xs">
                      {day.shifts.length === 0
                        ? 'Fechado'
                        : day.shifts.map((s) => `${label(s.open)}–${label(s.close)}`).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-steel-600">
                O intervalo no meio do dia é o horário de almoço.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  )
}
