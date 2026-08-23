/**
 * Verificação da lógica de horário e agendamento.
 *
 * Este é o único lugar do site onde um bug silencioso custa dinheiro de
 * verdade: um cálculo errado manda o cliente para uma barbearia fechada, ou
 * oferece um horário que não cabe no expediente. O resto da página é layout —
 * se quebrar, aparece na tela.
 *
 * Roda sem framework de teste e sem dependência nova: o Node 22 remove os tipos
 * do TypeScript sozinho.
 *
 *   npm run check
 *
 * As datas são fixas e em UTC. Goiânia é UTC−3 o ano inteiro (o horário de
 * verão acabou em 2019), então a conversão é constante e os casos abaixo
 * continuam válidos em qualquer máquina, em qualquer fuso.
 */
import { getOpenState, label, nowInShop } from '../src/lib/hours.ts'
import { buildDays, draftToMessage, humanDate, slotsFor } from '../src/lib/booking.ts'
import { SERVICES } from '../src/lib/business.ts'

let fails = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) fails++
  console.log(`${ok ? '  ok ' : 'FALHA'}  ${name}`)
  if (!ok) console.log(`         esperado ${JSON.stringify(expected)}, veio ${JSON.stringify(actual)}`)
}

const at = (iso: string) => new Date(iso)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── hours.ts ─────────────────────────────────────────────')

// Segunda, 24/08/2026 · 13:00 UTC = 10:00 em Goiânia → primeiro turno
check('seg 10h — aberto', getOpenState(at('2026-08-24T13:00:00Z')).open, true)
check('seg 10h — fecha ao meio-dia', getOpenState(at('2026-08-24T13:00:00Z')).detail, 'Aberto até 12h')

// 15:30 UTC = 12:30 → intervalo de almoço
check('seg 12h30 — fechado', getOpenState(at('2026-08-24T15:30:00Z')).open, false)
check('seg 12h30 — volta do almoço', getOpenState(at('2026-08-24T15:30:00Z')).detail, 'Volta do almoço às 14h')

// 20:00 UTC = 17:00 → segundo turno
check('seg 17h — aberto até 20h', getOpenState(at('2026-08-24T20:00:00Z')).detail, 'Aberto até 20h')

// 23:30 UTC = 20:30 → expediente encerrado
check('seg 20h30 — fechado', getOpenState(at('2026-08-24T23:30:00Z')).open, false)
check('seg 20h30 — abre amanhã', getOpenState(at('2026-08-24T23:30:00Z')).detail, 'Abre amanhã às 9h')

// Domingo 23/08 · 15:00 UTC = 12:00 → fechado o dia inteiro
check('domingo — fechado', getOpenState(at('2026-08-23T15:00:00Z')).open, false)
check('domingo — abre amanhã', getOpenState(at('2026-08-23T15:00:00Z')).detail, 'Abre amanhã às 9h')

// Sábado 29/08 · 21:00 UTC = 18:00 → sábado fecha mais cedo
check('sábado 18h — aberto até 19h', getOpenState(at('2026-08-29T21:00:00Z')).detail, 'Aberto até 19h')

// 25/08 02:00 UTC ainda é 24/08 (segunda) em Goiânia — o dia vem do fuso da loja
check('vira-noite respeita o fuso da loja', nowInShop(at('2026-08-25T02:00:00Z')).day, 1)

check('label 09:00 → 9h', label('09:00'), '9h')
check('label 14:30 → 14h30', label('14:30'), '14h30')

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── booking.ts ───────────────────────────────────────────')

const base = at('2026-08-24T13:00:00Z') // segunda, 10h em Goiânia
const days = buildDays(base)

check('horizonte de 14 dias', days.length, 14)
check('primeiro dia é hoje', days[0].isToday, true)
check('chave ISO do primeiro dia', days[0].key, '2026-08-24')
check('primeiro dia é segunda', days[0].weekdayShort, 'Seg')
check('todo domingo vem fechado', days.filter((d) => d.weekdayShort === 'Dom').every((d) => d.closed), true)
check('domingos no horizonte', days.filter((d) => d.closed).length, 2)

const corte = SERVICES.find((s) => s.id === 'corte')!       // 40 min
const combo = SERVICES.find((s) => s.id === 'corte-barba')! // 70 min

// Os preços vêm da tabela da parede — se alguém mexer sem querer, o teste acusa.
check('corte custa R$ 40', corte.price, 40)
check('combo custa R$ 70', combo.price, 70)
check('selagem é "a partir de"', SERVICES.find((s) => s.id === 'selagem')!.fromPrice, true)
check('corte NÃO é "a partir de"', corte.fromPrice, undefined)

const hojeCorte = slotsFor(days[0], corte, base)
check('hoje/corte — respeita 1h de antecedência', hojeCorte[0], '11:00')
check('hoje/corte — nada durante o almoço', hojeCorte.some((t) => t >= '12:00' && t < '14:00'), false)
check('hoje/corte — último cabe antes de fechar', hojeCorte.at(-1), '19:00')

const hojeCombo = slotsFor(days[0], combo, base)
check('hoje/combo 70min — não cabe na manhã', hojeCombo.some((t) => t < '12:00'), false)
check('hoje/combo 70min — último é 18h30', hojeCombo.at(-1), '18:30')

const amanhaCorte = slotsFor(days[1], corte, base)
check('amanhã/corte — começa às 9h', amanhaCorte[0], '09:00')
check('amanhã/corte — manhã termina às 11h', amanhaCorte.filter((t) => t < '12:00').at(-1), '11:00')

const sabado = days[5]
check('offset 5 é sábado', sabado.weekdayShort, 'Sáb')
const sabCorte = slotsFor(sabado, corte, base)
check('sábado — volta do almoço às 13h', sabCorte.includes('13:00'), true)
check('sábado — último é 18h', sabCorte.at(-1), '18:00')

check('domingo — nenhum horário', slotsFor(days[6], corte, base).length, 0)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── mensagem do WhatsApp ─────────────────────────────────')

const msg = draftToMessage({
  serviceId: 'corte-barba',
  dayKey: '2026-08-26',
  time: '15:30',
  name: 'Rafael',
  notes: 'degradê mais baixo',
})
check('cita serviço, duração e preço', msg.includes('Corte + Barba (70 min · R$ 70)'), true)
check('cita a data por extenso', msg.includes('quarta-feira, 26 de agosto'), true)
check('cita o horário', msg.includes('15:30'), true)
check('cita a observação', msg.includes('degradê mais baixo'), true)
check('humanDate', humanDate('2026-08-26'), 'quarta-feira, 26 de agosto')

// Campos vazios não podem produzir "undefined" na mensagem
const vazio = draftToMessage({ serviceId: '', dayKey: '', time: '', name: '', notes: '' })
check('rascunho vazio não vaza undefined', vazio.includes('undefined'), false)
check('rascunho vazio diz "a combinar"', vazio.includes('a combinar'), true)

console.log('')
console.log(fails === 0 ? '✅ Toda a lógica passou.' : `❌ ${fails} verificação(ões) falharam.`)
process.exit(fails === 0 ? 0 : 1)
