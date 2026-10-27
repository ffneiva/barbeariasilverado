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
import { buildDays, draftToMessage, humanDate, nextDayWithSlots, slotsFor } from '../src/lib/booking.ts'
import { FAQ, PRODUCTS, SERVICES } from '../src/lib/business.ts'
import { buildJsonLd } from '../src/lib/seo.ts'
import { existsSync, readFileSync } from 'node:fs'

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
check('seg 12h30 — volta do almoço', getOpenState(at('2026-08-24T15:30:00Z')).detail, 'Volta do almoço às 13h')

// 20:00 UTC = 17:00 → segundo turno
check('seg 17h — aberto até 19h', getOpenState(at('2026-08-24T20:00:00Z')).detail, 'Aberto até 19h')

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
check('hoje/corte — nada durante o almoço', hojeCorte.some((t) => t >= '12:00' && t < '13:00'), false)
check('hoje/corte — último cabe antes de fechar', hojeCorte.at(-1), '18:00')

const hojeCombo = slotsFor(days[0], combo, base)
check('hoje/combo 70min — não cabe na manhã', hojeCombo.some((t) => t < '12:00'), false)
check('hoje/combo 70min — último é 17h30', hojeCombo.at(-1), '17:30')

const amanhaCorte = slotsFor(days[1], corte, base)
check('amanhã/corte — começa às 9h', amanhaCorte[0], '09:00')
check('amanhã/corte — manhã termina às 11h', amanhaCorte.filter((t) => t < '12:00').at(-1), '11:00')

const sabado = days[5]
check('offset 5 é sábado', sabado.weekdayShort, 'Sáb')
const sabCorte = slotsFor(sabado, corte, base)
check('sábado — volta do almoço às 13h', sabCorte.includes('13:00'), true)
check('sábado — último é 18h', sabCorte.at(-1), '18:00')

check('domingo — nenhum horário', slotsFor(days[6], corte, base).length, 0)

// ── saída para o beco sem saída do passo 3 ──────────────────────────────────
// Segunda 19h em Goiânia: nem corte nem combo cabem no que resta do dia.
const tarde = at('2026-08-24T22:00:00Z')
const diasTarde = buildDays(tarde)
check('seg 19h — hoje sem vaga para o combo', slotsFor(diasTarde[0], combo, tarde).length, 0)
check(
  'seg 19h — sugere amanhã',
  nextDayWithSlots(diasTarde, combo, diasTarde[0].key, tarde)?.key,
  '2026-08-25',
)
// Sábado à noite: o próximo dia é domingo (fechado), então tem que pular para segunda.
const sabNoite = at('2026-08-29T22:00:00Z')
const diasSab = buildDays(sabNoite)
check('sáb 19h — pula o domingo fechado', nextDayWithSlots(diasSab, corte, diasSab[0].key, sabNoite)?.key, '2026-08-31')

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

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── seo.ts (dados estruturados) ──────────────────────────')

/**
 * O Search Console reprovou os seis produtos com "Especifique offers, review ou
 * aggregateRating". A causa era de aninhamento, não de conteúdo: o preço estava
 * um nível acima do nó que o validador lê. É exatamente o tipo de regressão que
 * volta sem ninguém notar, porque a página continua idêntica na tela e o erro
 * só aparece semanas depois, no relatório.
 */
type No = { '@type': string; [chave: string]: unknown }

const tipos = (caminho: string) => (buildJsonLd(caminho)['@graph'] as No[]).map((no) => no['@type'])

function produtosDe(caminho: string): No[] {
  const lista = (buildJsonLd(caminho)['@graph'] as No[]).find((no) => no['@type'] === 'ItemList')
  if (!lista) return []
  return (lista.itemListElement as Array<{ item: No }>).map((entrada) => entrada.item)
}

const produtos = produtosDe('/')
check('home lista todos os produtos', produtos.length, PRODUCTS.length)
check(
  'todo produto tem offers com preço em BRL',
  produtos.every((produto) => {
    const oferta = produto.offers as { price?: string; priceCurrency?: string } | undefined
    return Boolean(oferta?.price && oferta.priceCurrency === 'BRL')
  }),
  true,
)
check(
  'preço do schema bate com a tabela',
  produtos.map((produto) => (produto.offers as { price: string }).price),
  PRODUCTS.map((produto) => produto.price.toFixed(2)),
)
check('produto declara venda no balcão', (produtos[0].offers as { availability: string }).availability, 'https://schema.org/InStoreOnly')

// Marcar conteúdo que a página não mostra é violação das diretrizes de dados
// estruturados, e o preço não é um aviso: é a página perder a elegibilidade.
check('FAQ marcado na home, que o mostra', tipos('/').includes('FAQPage'), true)
check('FAQ ausente da /produtos, que não o mostra', tipos('/produtos').includes('FAQPage'), false)
check('galeria ausente da /agendar', tipos('/agendar').includes('ImageGallery'), false)
check('/produtos lista os produtos', produtosDe('/produtos').length, PRODUCTS.length)
check('/loja (endereço antigo) também lista', produtosDe('/loja').length, PRODUCTS.length)
check('/agendar não lista produtos', produtosDe('/agendar').length, 0)
check('rota filha tem trilha de navegação', tipos('/agendar').includes('BreadcrumbList'), true)
check('home não tem trilha', tipos('/').includes('BreadcrumbList'), false)

// Várias respostas do FAQ repetem preços que moram na tabela — produtos, corte,
// pintura. É uma segunda fonte de verdade, e segunda fonte de verdade envelhece
// calada: o óleo e o derma roller subiram de 35 para 40 e o FAQ continuaria
// anunciando 35 para quem lesse a página até o fim.
const precosCitados = FAQ.flatMap((item) =>
  [...item.a.matchAll(/R\$ (\d+)/g)].map((achado) => Number(achado[1])),
)
const precosDaTabela = new Set<number>([
  ...PRODUCTS.map((produto) => produto.price),
  ...SERVICES.map((servico) => servico.price).filter((preco): preco is number => preco !== null),
])
check('FAQ cita algum preço', precosCitados.length > 0, true)
check(
  'todo preço citado no FAQ existe na tabela',
  precosCitados.filter((valor) => !precosDaTabela.has(valor)),
  [],
)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n── tags de anúncio e CSP ────────────────────────────────')

/**
 * Os módulos das tags são lidos como texto, não importados.
 *
 * Este arquivo compila no projeto de tsconfig.node.json, que não tem a lib DOM
 * — importar analytics.ts ou meta.ts arrastaria `window` para um projeto que
 * não o conhece, e o build inteiro quebraria. Ler o fonte também é o que estas
 * verificações querem: o assunto aqui é o que está escrito no arquivo.
 */
const ler = (caminho: string) => readFileSync(caminho, 'utf8')
const fonteAds = ler('src/lib/analytics.ts')
const fonteMeta = ler('src/lib/meta.ts')

const adsId = /ADS_ID = '([^']+)'/.exec(fonteAds)?.[1] ?? ''
const pixelId = /PIXEL_ID = '([^']+)'/.exec(fonteMeta)?.[1] ?? ''

check('ID do Google Ads no formato AW-', /^AW-\d{8,}$/.test(adsId), true)
check('ID do pixel da Meta é numérico', /^\d{15,16}$/.test(pixelId), true)
check('o pixel do <noscript> usa o mesmo ID', ler('index.html').includes(`tr?id=${pixelId}`), true)

/**
 * Toda tag de terceiro precisa do host liberado na CSP.
 *
 * Este é o pior modo de falha do site: o navegador descarta o script bloqueado
 * sem erro visível, a página continua perfeita, e a plataforma de anúncio fica
 * marcando zero conversão por semanas com o código "instalado". Aconteceria com
 * o gtag e aconteceria de novo com o pixel — então a verificação vale por si.
 *
 * Ela lê os `script.src` do código e cobra cada host no aws-setup.sh, que é a
 * fonte de verdade da política aplicada no CloudFront.
 */
// O aws-setup.sh mora fora do repositório público (../_infra-barbeariasilverado).
// Na máquina de quem provisiona, a conferência roda; no CI, onde ele não
// existe, fica registrado que foi pulada.
const caminhoPolitica = ['../_infra-barbeariasilverado/aws-setup.sh', 'scripts/aws-setup.sh'].find(
  (c) => existsSync(c),
)
const politica = caminhoPolitica ? ler(caminhoPolitica) : null
const fontes = [fonteAds, fonteMeta].flatMap((codigo) =>
  codigo
    .split('\n')
    .filter((linha) => linha.includes('script.src'))
    .flatMap((linha) => [...linha.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((achado) => achado[1])),
)

check('achou os scripts de terceiro no código', fontes.sort(), [
  'connect.facebook.net',
  'www.googletagmanager.com',
])
if (politica) {
  check(
    'todo host carregado está liberado na CSP',
    fontes.filter((host) => !politica.includes(host)),
    [],
  )
} else {
  console.log('  --   CSP: aws-setup.sh fora do repositório — conferência pulada')
}

console.log('')
console.log(fails === 0 ? '✅ Toda a lógica passou.' : `❌ ${fails} verificação(ões) falharam.`)
process.exit(fails === 0 ? 0 : 1)
