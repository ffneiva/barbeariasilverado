import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, MessageCircle } from 'lucide-react'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { Button } from '@/components/Button'
import { SERVICES, whatsappUrl } from '@/lib/business'
import {
  EMPTY_DRAFT,
  buildDays,
  draftToMessage,
  humanDate,
  priceLabel,
  slotsFor,
  type BookingDay,
  type BookingDraft,
} from '@/lib/booking'
import { cn } from '@/lib/utils'

/**
 * Agendamento em quatro passos que termina no WhatsApp.
 *
 * A honestidade aqui é deliberada: o site **não** tem back-end e portanto não
 * sabe quais horários já foram vendidos. Em vez de simular uma agenda em tempo
 * real (e depois desmarcar gente), ele mostra apenas os horários em que a loja
 * *poderia* atender — respeitando os dois turnos, a duração real do serviço e
 * uma hora de antecedência mínima — e diz na tela que a confirmação vem do
 * barbeiro.
 *
 * O ganho concreto: em vez de um "oi" solto, o WhatsApp recebe serviço, dia,
 * hora e nome já escritos. Isso encurta a conversa de dez mensagens para uma.
 */

const STEPS = ['Serviço', 'Dia', 'Horário', 'Confirmar'] as const

export function Booking() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT)

  // Recalculado a cada minuto para que "hoje" e a antecedência mínima não
  // envelheçam numa aba deixada aberta.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const days = useMemo(() => buildDays(now), [now])
  const service = SERVICES.find((s) => s.id === draft.serviceId) ?? null
  const day = days.find((d) => d.key === draft.dayKey) ?? null

  const slots = useMemo(
    () => (day && service ? slotsFor(day, service, now) : []),
    [day, service, now],
  )

  const canAdvance = [Boolean(draft.serviceId), Boolean(draft.dayKey), Boolean(draft.time), true][step]

  const select = (patch: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    // Avança sozinho depois de escolher — um clique a menos por passo.
    if (step < 3) setStep((s) => s + 1)
  }

  return (
    <Section id="agendar" className="relative">
      {/* Leve clareamento de fundo para destacar o bloco de conversão. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(211,215,222,0.05), transparent 70%)' }}
      />

      <div className="container-x">
        <SectionHeading
          eyebrow="04 — Agendamento"
          title="Escolha e mande no WhatsApp"
          lead="Monte o pedido aqui e a mensagem chega pronta no WhatsApp do barbeiro. Ele confirma o horário e está fechado."
          align="center"
        />

        <Reveal delay={0.1}>
          <div className="mx-auto mt-14 max-w-3xl border border-steel-800 bg-white/[0.02]">
            {/* Trilho de passos */}
            <ol className="flex border-b border-steel-900">
              {STEPS.map((label, i) => (
                <li key={label} className="flex-1">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={cn(
                      'relative flex w-full items-center justify-center gap-2 px-2 py-4 font-mono text-[0.6rem] tracking-[0.16em] uppercase transition-colors sm:text-[0.65rem]',
                      i === step && 'text-steel-50',
                      i < step && 'cursor-pointer text-steel-400 hover:text-steel-100',
                      i > step && 'cursor-not-allowed text-steel-700',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border text-[0.55rem]',
                        i < step ? 'border-steel-400 text-steel-200' : i === step ? 'border-steel-300 text-steel-50' : 'border-steel-800',
                      )}
                    >
                      {i < step ? <Check className="h-3 w-3" strokeWidth={2.4} /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                    {i === step && (
                      <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-steel-300" />
                    )}
                  </button>
                </li>
              ))}
            </ol>

            <div className="p-6 sm:p-8">
              {step === 0 && (
                <fieldset>
                  <legend className="label-mono mb-5">Qual serviço?</legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {SERVICES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => select({ serviceId: s.id, time: '' })}
                        className={cn(
                          'group flex items-center justify-between gap-4 border p-4 text-left transition-colors duration-300',
                          draft.serviceId === s.id
                            ? 'border-steel-400 bg-steel-100/[0.06]'
                            : 'border-steel-900 hover:border-steel-600',
                        )}
                      >
                        <span>
                          <span className="block text-lg text-steel-100">{s.name}</span>
                          <span className="mt-0.5 block font-mono text-[0.65rem] tracking-[0.1em] text-steel-500 uppercase">
                            {s.minutes} min · {priceLabel(s)}
                          </span>
                        </span>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-steel-700 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-steel-300"
                          strokeWidth={1.6}
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <fieldset>
                  <legend className="label-mono mb-5">Que dia?</legend>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {days.map((d) => (
                      <DayCell
                        key={d.key}
                        day={d}
                        selected={draft.dayKey === d.key}
                        onSelect={() => select({ dayKey: d.key, time: '' })}
                      />
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset>
                  <legend className="label-mono mb-5">
                    {day ? `Horários de ${humanDate(day.key)}` : 'Horários'}
                  </legend>

                  {slots.length === 0 ? (
                    <p className="rounded-sm border border-steel-900 p-5 text-sm leading-relaxed text-steel-400">
                      Não sobra janela para <strong className="text-steel-200">{service?.name}</strong> nesse
                      dia — o serviço leva {service?.minutes} minutos e não cabe no que resta do expediente.
                      Escolha outro dia ou fale direto com o barbeiro.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => select({ time: slot })}
                          className={cn(
                            'border py-3 font-mono text-sm transition-colors duration-300',
                            draft.time === slot
                              ? 'border-steel-300 bg-steel-100/[0.08] text-steel-50'
                              : 'border-steel-900 text-steel-300 hover:border-steel-600 hover:text-steel-100',
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="mt-5 text-xs leading-relaxed text-steel-600">
                    Estes são os horários em que a barbearia atende. Quem confirma se o
                    horário está livre é o barbeiro, na resposta do WhatsApp.
                  </p>
                </fieldset>
              )}

              {step === 3 && (
                <div className="grid gap-6">
                  <div>
                    <label htmlFor="booking-name" className="label-mono mb-2 block">
                      Seu nome
                    </label>
                    <input
                      id="booking-name"
                      value={draft.name}
                      onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Como o barbeiro te chama"
                      autoComplete="given-name"
                      className="w-full border border-steel-800 bg-void px-4 py-3 text-steel-100 transition-colors placeholder:text-steel-700 focus:border-steel-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="booking-notes" className="label-mono mb-2 block">
                      Observação <span className="normal-case">(opcional)</span>
                    </label>
                    <textarea
                      id="booking-notes"
                      rows={2}
                      value={draft.notes}
                      onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Ex.: quero o degradê mais baixo que da última vez"
                      className="w-full resize-none border border-steel-800 bg-void px-4 py-3 text-steel-100 transition-colors placeholder:text-steel-700 focus:border-steel-400 focus:outline-none"
                    />
                  </div>

                  <dl className="grid gap-3 border border-steel-900 bg-void/60 p-5 text-sm">
                    <Row label="Serviço" value={service ? `${service.name} · ${service.minutes} min` : '—'} />
                    <Row label="Dia" value={draft.dayKey ? humanDate(draft.dayKey) : '—'} />
                    <Row label="Horário" value={draft.time || '—'} />
                    <Row label="Valor" value={service ? priceLabel(service) : '—'} />
                  </dl>

                  <Button
                    href={whatsappUrl(draftToMessage(draft))}
                    size="lg"
                    className="w-full"
                    magnetic={false}
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
                    Enviar pedido no WhatsApp
                  </Button>
                </div>
              )}
            </div>

            {/* Navegação */}
            <div className="flex items-center justify-between border-t border-steel-900 px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] text-steel-500 uppercase transition-colors hover:text-steel-200 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
                Voltar
              </button>

              {step < 3 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(3, s + 1))}
                  disabled={!canAdvance}
                  className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.18em] text-steel-300 uppercase transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  Avançar
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="label-mono">{label}</dt>
      <dd className="text-right text-steel-200">{value}</dd>
    </div>
  )
}

function DayCell({ day, selected, onSelect }: { day: BookingDay; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={day.closed}
      aria-label={`${day.weekdayShort} ${day.dayNumber} de ${day.monthShort}${day.closed ? ' — fechado' : ''}`}
      className={cn(
        'flex flex-col items-center gap-1 border py-3 transition-colors duration-300',
        day.closed && 'cursor-not-allowed border-steel-900/60 text-steel-800',
        !day.closed && selected && 'border-steel-300 bg-steel-100/[0.08] text-steel-50',
        !day.closed && !selected && 'border-steel-900 text-steel-300 hover:border-steel-600 hover:text-steel-100',
      )}
    >
      <span className="font-mono text-[0.55rem] tracking-[0.14em] uppercase opacity-70">
        {day.isToday ? 'Hoje' : day.weekdayShort}
      </span>
      <span className="font-display text-2xl leading-none">{day.dayNumber}</span>
      <span className="font-mono text-[0.55rem] tracking-[0.1em] uppercase opacity-50">{day.monthShort}</span>
    </button>
  )
}
