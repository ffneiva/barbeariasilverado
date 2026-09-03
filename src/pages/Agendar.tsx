import { ArrowRight, MapPin, MessageCircle, Phone } from 'lucide-react'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { Button } from '@/components/Button'
import { Booking } from '@/sections/Booking'
import { BUSINESS, SCHEDULE, whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'
import { label, todayIndex } from '@/lib/hours'
import { cn } from '@/lib/utils'

/**
 * Página dedicada de agendamento — o destino do anúncio do Google.
 *
 * O agendador é a primeira coisa depois do cabeçalho. Tudo que vem abaixo dele
 * existe para responder as duas perguntas que sobram na cabeça de quem vai
 * marcar ("abre a que horas?" e "onde fica?") sem obrigar a voltar para a home.
 *
 * O mesmo agendador continua na landing page: esta rota não é um fork, é a
 * mesma seção com outra moldura.
 */
export function Agendar({ onNavigate }: { onNavigate: (path: string) => void }) {
  const today = todayIndex()

  return (
    <main id="conteudo">
      <PageHero
        eyebrow="Barbearia Silverado · Jardim América, Goiânia"
        title="Agende seu horário"
        lead={
          <>
            Escolha o serviço, o dia e a hora. A mensagem chega pronta no WhatsApp do barbeiro —
            ele confirma e está fechado. Corte R$ 40, corte + barba R$ 70.
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)} size="lg" magnetic={false}>
            <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
            Falar direto no WhatsApp
          </Button>
          <Button
            href={`tel:+${BUSINESS.whatsapp}`}
            variant="outline"
            size="lg"
            magnetic={false}
            external={false}
          >
            <Phone className="h-4 w-4" strokeWidth={1.6} />
            {BUSINESS.phoneDisplay}
          </Button>
        </div>
      </PageHero>

      <Booking showHeading={false} />

      {/* As duas perguntas que sobram: quando abre e onde fica. */}
      <section className="pb-20 sm:pb-28">
        <div className="container-x grid gap-3 sm:gap-4 lg:grid-cols-2">
          <Reveal className="border border-steel-800 bg-white/[0.02] p-6 sm:p-8">
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

          <Reveal delay={0.08} className="flex flex-col border border-steel-800 bg-white/[0.02] p-6 sm:p-8">
            <span className="label-mono">Onde fica</span>
            <address className="mt-5 not-italic">
              <span className="block text-xl leading-snug text-steel-100">{BUSINESS.address.street}</span>
              <span className="mt-1 block text-steel-500">
                {BUSINESS.address.district} · {BUSINESS.address.city}/{BUSINESS.address.state} · CEP{' '}
                {BUSINESS.address.zip}
              </span>
            </address>

            <p className="mt-4 text-sm leading-relaxed text-steel-400">
              Na Avenida C-4, a poucos minutos do Setor Bueno e do Setor Oeste. Dá para chegar sem
              agendar e fazer o encaixe — mandar mensagem antes só evita que você espere.
            </p>

            <div className="mt-auto flex flex-wrap gap-3 pt-7">
              <Button href={BUSINESS.mapsLink} magnetic={false}>
                <MapPin className="h-4 w-4" strokeWidth={1.6} />
                Traçar rota
              </Button>
              <Button
                onClick={() => onNavigate('/')}
                variant="outline"
                magnetic={false}
                external={false}
              >
                Ver o site completo
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
