import { BUSINESS, SCHEDULE, SERVICES, type Service } from './business.ts'
import { fromMinutes, nowInShop, toMinutes } from './hours.ts'

/**
 * Agendamento sem servidor.
 *
 * O site não tem back-end (e não vai ter: o custo precisa ficar em zero), então
 * ele não consegue saber quais horários já estão ocupados. O que ele faz é o
 * trabalho chato por conta própria — calcular os dias e horários em que a
 * barbearia *poderia* atender, dada a duração do serviço — e entregar ao
 * WhatsApp uma mensagem pronta e específica. A confirmação continua sendo do
 * barbeiro; a UI deixa isso explícito em vez de fingir uma agenda em tempo real.
 */

export const SLOT_STEP_MINUTES = 30
/** Nenhum horário é oferecido com menos de 1h de antecedência. */
const MIN_LEAD_MINUTES = 60
/** Quantos dias à frente a grade mostra. */
export const BOOKING_HORIZON_DAYS = 14

export type BookingDay = {
  date: Date
  /** ISO curto (YYYY-MM-DD) usado como chave de seleção. */
  key: string
  weekdayShort: string
  dayNumber: string
  monthShort: string
  closed: boolean
  isToday: boolean
}

/**
 * Constrói o calendário do seletor. As datas nascem no fuso da barbearia para
 * que "hoje" nunca escorregue um dia por causa do relógio do visitante.
 */
export function buildDays(base = new Date()): BookingDay[] {
  const { day: todayWeekday } = nowInShop(base)
  const days: BookingDay[] = []

  for (let offset = 0; offset < BOOKING_HORIZON_DAYS; offset++) {
    const date = new Date(base)
    date.setDate(date.getDate() + offset)

    const weekday = (todayWeekday + offset) % 7
    const fmt = (opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...opts }).format(date)

    days.push({
      date,
      key: fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'),
      weekdayShort: SCHEDULE[weekday].short,
      dayNumber: fmt({ day: '2-digit' }),
      monthShort: fmt({ month: 'short' }).replace('.', ''),
      closed: SCHEDULE[weekday].shifts.length === 0,
      isToday: offset === 0,
    })
  }

  return days
}

/**
 * Horários possíveis para um dia, respeitando os dois turnos, a duração do
 * serviço (um corte de 70min não pode começar 14h50 se fecha 20h... pode; mas
 * não pode começar 19h40) e a antecedência mínima quando o dia é hoje.
 */
export function slotsFor(day: BookingDay, service: Service, base = new Date()): string[] {
  const { day: todayWeekday, minutes: nowMinutes } = nowInShop(base)
  const offset = Math.round((day.date.getTime() - base.getTime()) / 86_400_000)
  const weekday = (todayWeekday + Math.max(0, offset)) % 7
  const shifts = SCHEDULE[weekday].shifts
  const earliest = day.isToday ? nowMinutes + MIN_LEAD_MINUTES : 0

  const slots: string[] = []
  for (const shift of shifts) {
    const open = toMinutes(shift.open)
    const close = toMinutes(shift.close)
    // O primeiro horário do turno é arredondado para cima na grade de 30min.
    const start = Math.max(open, Math.ceil(earliest / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES)

    for (let t = start; t + service.minutes <= close; t += SLOT_STEP_MINUTES) {
      slots.push(fromMinutes(t))
    }
  }

  return slots
}

/**
 * Primeiro dia, a partir de `depoisDe`, em que o serviço cabe no expediente.
 *
 * Existe para o beco sem saída do passo 3: um combo de 70 minutos escolhido às
 * 19h não cabe em nenhum horário de hoje, e a tela dizia isso e parava ali —
 * deixando a pessoa adivinhar em qual dia tentar. Agora ela recebe o dia certo
 * num clique.
 */
export function nextDayWithSlots(
  days: BookingDay[],
  service: Service,
  depoisDe: string,
  base = new Date(),
): BookingDay | null {
  const partida = days.findIndex((d) => d.key === depoisDe)
  if (partida < 0) return null

  for (const day of days.slice(partida + 1)) {
    if (day.closed) continue
    if (slotsFor(day, service, base).length > 0) return day
  }
  return null
}

export type BookingDraft = {
  serviceId: string
  dayKey: string
  time: string
  name: string
  notes: string
}

export const EMPTY_DRAFT: BookingDraft = { serviceId: '', dayKey: '', time: '', name: '', notes: '' }

/** "2026-08-25" → "segunda-feira, 25 de agosto" */
export function humanDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(y, m - 1, d))
}

/**
 * Agora que os preços da tabela da parede estão no site, "a partir de" só
 * aparece onde a própria tabela diz isso (selagem e botox). Antes o rótulo era
 * "a partir de" para tudo — o que, com preço fechado, soa como se o valor
 * pudesse subir na hora de pagar.
 */
export function priceLabel(service: Service): string {
  if (service.price === null) return 'sob consulta'
  return service.fromPrice ? `a partir de R$ ${service.price}` : `R$ ${service.price}`
}

/**
 * Mensagem final. Nada de "Olá, gostaria de informações": o barbeiro recebe o
 * serviço, o dia, a hora e o nome já formatados e responde com um "confirmado".
 */
export function draftToMessage(draft: BookingDraft): string {
  const service = SERVICES.find((s) => s.id === draft.serviceId)
  const lines = [
    `Olá! Quero agendar um horário na ${BUSINESS.shortName}.`,
    '',
    `• Serviço: ${service ? service.name : 'a combinar'}${service ? ` (${service.minutes} min · ${priceLabel(service)})` : ''}`,
    `• Dia: ${draft.dayKey ? humanDate(draft.dayKey) : 'a combinar'}`,
    `• Horário: ${draft.time || 'a combinar'}`,
    `• Nome: ${draft.name.trim() || '—'}`,
  ]

  if (draft.notes.trim()) lines.push(`• Observação: ${draft.notes.trim()}`)

  lines.push('', 'Esse horário está livre?')
  return lines.join('\n')
}

/** Mensagem curta usada nos CTAs de um corte específico da galeria. */
export function cutMessage(cutName: string): string {
  return `Olá! Vi o corte "${cutName}" no site da ${BUSINESS.shortName} e queria agendar um horário para fazer esse modelo.`
}
