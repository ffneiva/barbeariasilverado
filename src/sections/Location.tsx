import { useState } from 'react'
import { Mail, MapPin, Navigation, Phone } from 'lucide-react'
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
 * O mapa entra por *facade*: enquanto ninguém clica, o que existe é um bloco
 * estático. O iframe do Google — que sozinho traz centenas de kB de script de
 * terceiro e um cookie de rastreamento — só é criado sob demanda. Quem quer o
 * mapa clica; quem só quer o endereço não paga por ele.
 */
export function Location() {
  const [mapLoaded, setMapLoaded] = useState(false)
  const today = todayIndex()

  return (
    <Section id="localizacao">
      <div className="container-x">
        <SectionHeading
          eyebrow="07 — Onde estamos"
          title="Jardim América, Goiânia"
          lead="Avenida C-4, a poucos minutos do Setor Bueno e do Setor Oeste. Estacionamento na rua."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* Mapa */}
          <Reveal className="relative min-h-[22rem] border border-steel-800 lg:min-h-[30rem]">
            {mapLoaded ? (
              <iframe
                title={`Mapa — ${BUSINESS.name}`}
                src={BUSINESS.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 h-full w-full grayscale-[0.35] contrast-[1.1]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setMapLoaded(true)}
                className="group absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden bg-leather"
              >
                {/* Malha viária estilizada — só CSS, nenhum tile baixado. */}
                <span
                  aria-hidden
                  className="absolute inset-0 opacity-[0.16]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(211,215,222,0.35) 1px, transparent 1px),' +
                      'linear-gradient(90deg, rgba(211,215,222,0.35) 1px, transparent 1px),' +
                      'linear-gradient(115deg, rgba(211,215,222,0.6) 2px, transparent 2px)',
                    backgroundSize: '54px 54px, 54px 54px, 100% 100%',
                  }}
                />
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent, #030304 82%)' }}
                />

                <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-steel-600 bg-void/70 transition-colors group-hover:border-steel-300">
                  <MapPin className="h-5 w-5 text-steel-200" strokeWidth={1.5} />
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-steel-500"
                    style={{ animation: 'pulse-ring 2.8s var(--ease-blade) infinite' }}
                  />
                </span>
                <span className="relative font-mono text-[0.65rem] tracking-[0.22em] text-steel-400 uppercase transition-colors group-hover:text-steel-100">
                  Carregar mapa
                </span>
                <span className="relative max-w-xs px-6 text-center text-xs leading-relaxed text-steel-600">
                  O mapa é carregado só quando você pede — assim a página abre mais rápido e
                  o Google não é chamado sem necessidade.
                </span>
              </button>
            )}
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
                O intervalo no meio do dia é o almoço da equipe. Fora dele, a agenda roda cheia.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  )
}
