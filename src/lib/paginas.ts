import { BUSINESS, CUTS, type Cut, FAQ, SERVICES, type Service } from './business.ts'

/**
 * Conteúdo das páginas de serviço, de corte e de perguntas.
 *
 * Feitas para responder direto o que as pessoas perguntam ao Google e às IAs
 * ("quanto custa um degradê no Jardim América?", "abre sábado?", "precisa
 * agendar?"). Tudo sai dos dados da casa em business.ts (preço, duração,
 * horário, endereço), para não existir um segundo lugar com preço velho.
 *
 * Importado também pelo vite.config.ts (rotas, sitemap, llms.txt): nada de
 * `window` aqui.
 */

export type Pergunta = { q: string; a: string }

const ENDERECO = `${BUSINESS.address.street}, ${BUSINESS.address.district}, ${BUSINESS.address.city}/${BUSINESS.address.state}`
const HORARIO = 'de segunda a sábado, das 9h às 12h e das 13h às 19h (domingo fechado)'

export function precoTexto(s: Service): string {
  if (s.price === null) return 'sob consulta'
  return s.fromPrice ? `a partir de R$ ${s.price}` : `R$ ${s.price}`
}

/** Texto de apoio de cada serviço: o que é e como é feito na casa. */
const DETALHE: Record<string, string> = {
  corte:
    'O corte começa pela conversa: você mostra a foto de referência ou explica o que quer, e o barbeiro confere o formato do rosto e o tipo de cabelo antes de ligar a máquina. Degradê, fade, social, militar ou o modelo da foto: máquina e tesoura no volume, e o contorno e a nuca terminados na navalha.',
  barba:
    'A barba é aparada e desenhada no formato do seu rosto, com o contorno da bochecha e do pescoço fechado na navalha aberta. Serve tanto para manter uma barba cheia quanto para deixar só o desenho limpo.',
  'corte-barba':
    'Cabelo e barba na mesma cadeira, os dois terminados na lâmina. É o serviço completo da casa e sai R$ 10 mais barato que fazer os dois separados.',
  pezinho:
    'O pezinho é a manutenção do contorno entre um corte e outro: nuca, lateral e costeleta alinhadas de novo, para o corte continuar com cara de feito na semana.',
  sobrancelha:
    'Alinhamento no traço natural: tira o excesso e os fios fora do desenho sem afinar demais nem mudar a sua expressão.',
  'pintura-barba':
    'Tinta profissional aplicada na barba para cobrir o branco e disfarçar as falhas. É o serviço que muita gente procura como pigmentação de barba.',
  'pintura-cabelo':
    'Tinta profissional no cabelo para cobrir o branco e igualar a cor, sem mexer no corte. Também procurada como pigmentação de cabelo.',
  'pintura-barba-cabelo':
    'Pintura de barba e de cabelo na mesma sessão, com a cor igualada nos dois. Sai R$ 10 mais barato que fazer separado.',
  hidratacao:
    'Tratamento que repõe a hidratação que o sol, o boné e a máquina tiram, e deixa o fio mais macio e fácil de arrumar.',
  selagem:
    'Selagem ou progressiva para reduzir o volume e alinhar o fio. O valor final depende do comprimento do cabelo e é combinado antes de começar.',
  botox:
    'Botox capilar para preencher o fio danificado e devolver o brilho, sem alisar. O valor depende do comprimento e é combinado antes de começar.',
  depilacao:
    'Depilação de nariz e orelha com cera quente, feita no fim do atendimento. É rápida e entra junto com o corte ou a barba.',
}

/** Termo que as pessoas buscam, quando é diferente do nome do serviço. */
const BUSCA: Record<string, string> = {
  corte: 'Corte de cabelo masculino',
  'corte-barba': 'Corte e barba',
  pezinho: 'Pezinho (acabamento)',
  'pintura-barba': 'Pigmentação de barba',
  'pintura-cabelo': 'Pigmentação de cabelo',
}

export type PaginaServico = {
  servico: Service
  path: string
  titulo: string
  h1: string
  descricao: string
  detalhe: string
  perguntas: Pergunta[]
  relacionados: Service[]
}

function perguntasDoServico(s: Service): Pergunta[] {
  const nome = s.name.toLowerCase()
  const p: Pergunta[] = [
    {
      q: `Quanto custa ${nome} na Barbearia Silverado?`,
      a: `${s.name} custa ${precoTexto(s)} na ${BUSINESS.shortName}, no Jardim América, em Goiânia.${
        s.fromPrice ? ' O valor final depende do comprimento do cabelo e é combinado antes de começar.' : ' Preço fechado, igual ao da tabela da parede.'
      }`,
    },
    {
      q: `Quanto tempo demora?`,
      a: `Em média ${s.minutes} minutos. O tempo exato depende do seu cabelo e do que for combinado na cadeira.`,
    },
    {
      q: 'Precisa agendar?',
      a: 'Não é obrigatório: dá para chegar e fazer o encaixe. Mandar mensagem no WhatsApp antes evita espera, porque o barbeiro responde com um horário livre.',
    },
    {
      q: 'Onde fica e qual o horário?',
      a: `${ENDERECO}. Atende ${HORARIO}.`,
    },
  ]
  return p
}

export const PAGINAS_SERVICO: PaginaServico[] = SERVICES.map((s) => {
  const termo = BUSCA[s.id] ?? s.name
  return {
    servico: s,
    path: `/servicos/${s.id}`,
    titulo: `${termo} em Goiânia · ${BUSINESS.shortName}`,
    h1: `${termo} no Jardim América`,
    descricao: `${termo} na ${BUSINESS.shortName}, Jardim América, Goiânia: ${precoTexto(s)}, cerca de ${s.minutes} min. ${s.description}`,
    detalhe: DETALHE[s.id] ?? s.description,
    perguntas: perguntasDoServico(s),
    relacionados: SERVICES.filter((o) => o.id !== s.id && (o.highlight || o.id.startsWith(s.id.split('-')[0]))).slice(0, 3),
  }
})

export type PaginaCorte = {
  corte: Cut
  path: string
  titulo: string
  h1: string
  descricao: string
  perguntas: Pergunta[]
}

const corte = SERVICES.find((s) => s.id === 'corte')!

export const PAGINAS_CORTE: PaginaCorte[] = CUTS.map((c) => ({
  corte: c,
  path: `/cortes/${c.id}`,
  titulo: `Corte ${c.name} em Goiânia · ${BUSINESS.shortName}`,
  h1: `Corte ${c.name}`,
  descricao: `${c.name} na ${BUSINESS.shortName}, Jardim América, Goiânia. ${c.blurb} Corte ${precoTexto(corte)}.`,
  perguntas: [
    {
      q: `Quanto custa o corte ${c.name}?`,
      a: `O ${c.name} entra no preço do corte: ${precoTexto(corte)}, com o contorno terminado na navalha. Com a barba junto, o combo sai R$ 70.`,
    },
    {
      q: `Como pedir o ${c.name} do jeito que eu quero?`,
      a: 'Traga uma foto de referência ou mostre no celular. O barbeiro confere o formato do rosto e o tipo de cabelo antes de começar, e o corte termina quando bate com a referência.',
    },
    {
      q: 'Precisa agendar?',
      a: 'Não é obrigatório, mas mandar mensagem no WhatsApp antes evita espera: o barbeiro responde com um horário livre.',
    },
  ],
}))

/** Página de perguntas: o FAQ da casa + as respostas de preço e horário. */
export const PERGUNTAS_GERAIS: Pergunta[] = [
  ...FAQ.map((f) => ({ q: f.q, a: f.a })),
  {
    q: 'Quanto custa um corte masculino na Barbearia Silverado?',
    a: `O corte custa ${precoTexto(corte)}; corte e barba juntos, R$ 70. A tabela completa está em barbeariasilverado.com.br/servicos.`,
  },
  {
    q: 'A Barbearia Silverado abre sábado?',
    a: `Abre. O horário é ${HORARIO}.`,
  },
  {
    q: 'Onde fica a Barbearia Silverado?',
    a: `${ENDERECO}, a poucos minutos do Setor Bueno e do Setor Oeste.`,
  },
]
