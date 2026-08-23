import { SCHEDULE, type Shift } from './business'

/**
 * Tudo que envolve horário é resolvido no fuso da barbearia, não no do visitante.
 * Um cliente vendo o site de Portugal precisa saber se a loja em Goiânia está
 * aberta *agora em Goiânia* — não às 3h da manhã dele.
 */
const TZ = 'America/Sao_Paulo'

/** Minutos desde a meia-noite, a partir de "HH:MM". */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "Agora" convertido para a parede do relógio de Goiânia. */
export function nowInShop(base = new Date()): { day: number; minutes: number; date: Date } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(base)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  // Intl devolve "24" à meia-noite em hourCycle h23/h24 dependendo do runtime.
  const hour = Number(get('hour')) % 24

  return { day: weekdayIndex, minutes: hour * 60 + Number(get('minute')), date: base }
}

export type OpenState = {
  open: boolean
  /** Texto curto para o selo do topo: "Aberto até 20h" / "Abre às 14h". */
  detail: string
  /** Turno corrente, quando aberto. */
  shift: Shift | null
}

export function getOpenState(base = new Date()): OpenState {
  const { day, minutes } = nowInShop(base)
  const today = SCHEDULE[day]

  const current = today.shifts.find((s) => minutes >= toMinutes(s.open) && minutes < toMinutes(s.close))
  if (current) {
    return { open: true, detail: `Aberto até ${label(current.close)}`, shift: current }
  }

  const next = today.shifts.find((s) => minutes < toMinutes(s.open))
  if (next) {
    const isLunch = today.shifts.some((s) => toMinutes(s.close) <= minutes)
    return {
      open: false,
      detail: isLunch ? `Volta do almoço às ${label(next.open)}` : `Abre às ${label(next.open)}`,
      shift: null,
    }
  }

  // Já fechou hoje (ou hoje é domingo): procura o próximo dia com expediente.
  for (let step = 1; step <= 7; step++) {
    const candidate = SCHEDULE[(day + step) % 7]
    const first = candidate.shifts[0]
    if (!first) continue
    const when = step === 1 ? 'amanhã' : candidate.label.toLowerCase().replace('-feira', '')
    return { open: false, detail: `Abre ${when} às ${label(first.open)}`, shift: null }
  }

  return { open: false, detail: 'Fechado', shift: null }
}

/** "09:00" → "9h" · "14:30" → "14h30" */
export function label(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

export function todayIndex(base = new Date()): number {
  return nowInShop(base).day
}
