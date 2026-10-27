import { BUSINESS, CUTS, PRODUCTS, SCHEDULE_SUMMARY, SERVICES } from './business.ts'
import { PAGINAS_CORTE, PAGINAS_SERVICO, PERGUNTAS_GERAIS, precoTexto } from './paginas.ts'

/**
 * llms.txt: o resumo que assistentes de IA (ChatGPT, Claude, Perplexity,
 * Gemini) leem para responder sobre a barbearia. Padrão llmstxt.org: título,
 * resumo em citação, fatos e links com descrição.
 *
 * llms-full.txt: o mesmo com tudo por extenso (tabela, cortes, produtos e
 * todas as perguntas), para o assistente responder sem precisar abrir páginas.
 *
 * Gerados no build (vite.config.ts), da mesma fonte que o site.
 */

const U = BUSINESS.url
const ENDERECO = `${BUSINESS.address.street}, ${BUSINESS.address.district}, ${BUSINESS.address.city}/${BUSINESS.address.state}, CEP ${BUSINESS.address.zip}`
const TELEFONE = `(${BUSINESS.whatsapp.slice(2, 4)}) ${BUSINESS.whatsapp.slice(4, 9)}-${BUSINESS.whatsapp.slice(9)}`

function fatos(): string[] {
  return [
    `- Endereço: ${ENDERECO}`,
    `- WhatsApp e telefone: ${TELEFONE} (https://wa.me/${BUSINESS.whatsapp})`,
    `- Horário: ${SCHEDULE_SUMMARY.map((r) => `${r.days}: ${r.hours}${r.lunch ? ` (${r.lunch})` : ''}`).join('; ')}`,
    `- Agendamento: pelo WhatsApp ou em ${U}/agendar; também atende por encaixe, sem hora marcada`,
    `- Preços: corte ${precoTexto(SERVICES[0])}, barba R$ 40, corte + barba R$ 70 (tabela completa em ${U}/servicos)`,
    `- Pagamento: Pix, dinheiro, cartão de débito e de crédito`,
    `- Instagram: ${BUSINESS.instagram}`,
    `- Como chegar: ${BUSINESS.mapsLink}`,
  ]
}

export function gerarLlmsTxt(): string {
  return [
    `# ${BUSINESS.name}`,
    '',
    `> ${BUSINESS.description}`,
    '',
    ...fatos(),
    '',
    '## Páginas',
    '',
    `- [Início](${U}/): a barbearia, serviços, cortes, avaliações e localização`,
    `- [Serviços e preços](${U}/servicos): tabela com preço e duração de cada serviço`,
    `- [Cortes](${U}/cortes): degradê, fades, social, militar, americano, mullet e degradê com V`,
    `- [Agendar](${U}/agendar): escolher serviço, dia e hora e enviar o pedido no WhatsApp`,
    `- [Produtos](${U}/produtos): pomadas, minoxidil manipulado, derma roller e óleo de barba`,
    `- [Perguntas frequentes](${U}/perguntas-frequentes): respostas diretas sobre preço, horário e atendimento`,
    '',
    '## Serviços',
    '',
    ...PAGINAS_SERVICO.map((p) => `- [${p.servico.name}](${U}${p.path}): ${precoTexto(p.servico)}, cerca de ${p.servico.minutes} min`),
    '',
    '## Opcional',
    '',
    `- [Tudo em texto](${U}/llms-full.txt): tabela, cortes, produtos e todas as perguntas por extenso`,
    '',
  ].join('\n')
}

export function gerarLlmsFullTxt(): string {
  return [
    `# ${BUSINESS.name}: informações completas`,
    '',
    `> ${BUSINESS.description}`,
    '',
    '## Fatos',
    '',
    ...fatos(),
    '',
    '## Serviços e preços',
    '',
    ...PAGINAS_SERVICO.flatMap((p) => [
      `### ${p.servico.name}: ${precoTexto(p.servico)}`,
      '',
      `${p.detalhe} Duração média: ${p.servico.minutes} minutos. Página: ${U}${p.path}`,
      '',
    ]),
    '## Cortes',
    '',
    ...PAGINAS_CORTE.map((p) => `- ${p.corte.name} (${p.corte.family}): ${p.corte.blurb} ${U}${p.path}`),
    '',
    `Todos os cortes saem pelo preço do corte (${precoTexto(SERVICES[0])}). ${CUTS.length} modelos no cardápio, e qualquer outro pela foto de referência.`,
    '',
    '## Produtos à venda no balcão',
    '',
    ...PRODUCTS.map((p) => `- ${p.name} ${p.size}: R$ ${p.price}. ${p.description}`),
    '',
    '## Perguntas frequentes',
    '',
    ...PERGUNTAS_GERAIS.flatMap((p) => [`### ${p.q}`, '', p.a, '']),
  ].join('\n')
}
