/**
 * Fonte única de verdade do conteúdo do site.
 *
 * Tudo que a barbearia precisa mudar com frequência (preço, horário, serviço,
 * texto) mora aqui — nenhuma dessas informações fica espalhada pelos
 * componentes. Alterar um preço = editar uma linha e dar `git push`.
 */

export const BUSINESS = {
  name: 'Barbearia Silverado',
  shortName: 'Silverado',
  tagline: 'O talento da lâmina',
  description:
    'Barbearia no Jardim América, em Goiânia. Degradê, navalhado, barba e visagismo ' +
    'com acabamento de lâmina. Agende pelo WhatsApp em menos de um minuto.',

  url: 'https://barbeariasilverado.com.br',

  phoneDisplay: '(62) 99857-5858',
  /** E.164 sem símbolos — formato exigido pelo wa.me */
  whatsapp: '5562998575858',
  email: 'barbeariasilverado@gmail.com',

  address: {
    street: 'Avenida C-4, nº 73 — Qd. 490, Lt. 09',
    district: 'Jardim América',
    city: 'Goiânia',
    state: 'GO',
    zip: '74265-040',
    country: 'BR',
  },
  /** Coordenadas extraídas do perfil do Google Business */
  geo: { lat: -16.695983, lng: -49.283492 },
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=-16.695983,-49.283492',
  mapsEmbed:
    'https://maps.google.com/maps?q=-16.695983,-49.283492&hl=pt-BR&z=17&output=embed',

  instagram: 'https://instagram.com/barbeariasilverado',
  instagramHandle: '@barbeariasilverado',
  threads: 'https://www.threads.net/@barbeariasilverado',

  /** MEI — CNAE 9602-5/01 (Cabeleireiros, manicure e pedicure) */
  legal: {
    cnpj: '68.366.916/0001-01',
    razaoSocial: '68.366.916 LUCAS HENRIQUE COSTA SILVA',
    regime: 'Microempreendedor Individual (MEI)',
    cnae: '9602-5/01 — Cabeleireiros, manicure e pedicure',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Horário de funcionamento
// ─────────────────────────────────────────────────────────────────────────────

export type Shift = { open: string; close: string }
/** Índice = dia da semana no padrão JS (0 = domingo). `null` = fechado. */
export type DaySchedule = { label: string; short: string; shifts: Shift[] }

export const SCHEDULE: DaySchedule[] = [
  { label: 'Domingo', short: 'Dom', shifts: [] },
  { label: 'Segunda-feira', short: 'Seg', shifts: [{ open: '09:00', close: '12:00' }, { open: '14:00', close: '20:00' }] },
  { label: 'Terça-feira', short: 'Ter', shifts: [{ open: '09:00', close: '12:00' }, { open: '14:00', close: '20:00' }] },
  { label: 'Quarta-feira', short: 'Qua', shifts: [{ open: '09:00', close: '12:00' }, { open: '14:00', close: '20:00' }] },
  { label: 'Quinta-feira', short: 'Qui', shifts: [{ open: '09:00', close: '12:00' }, { open: '14:00', close: '20:00' }] },
  { label: 'Sexta-feira', short: 'Sex', shifts: [{ open: '09:00', close: '12:00' }, { open: '14:00', close: '20:00' }] },
  { label: 'Sábado', short: 'Sáb', shifts: [{ open: '09:00', close: '12:00' }, { open: '13:00', close: '19:00' }] },
]

export const SCHEDULE_SUMMARY = [
  { days: 'Segunda a sexta', hours: '9h — 20h', lunch: 'almoço 12h — 14h' },
  { days: 'Sábado', hours: '9h — 19h', lunch: 'almoço 12h — 13h' },
  { days: 'Domingo', hours: 'Fechado', lunch: '' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Serviços
// ─────────────────────────────────────────────────────────────────────────────

export type Service = {
  id: string
  name: string
  description: string
  /** Preço em reais. `null` quando é sob consulta. */
  price: number | null
  /** Duração estimada em minutos — alimenta o gerador de horários do agendamento. */
  minutes: number
  highlight?: boolean
  tag?: string
}

export const SERVICES: Service[] = [
  {
    id: 'corte',
    name: 'Corte',
    description:
      'Degradê, fade ou social. Consulta de visagismo, máquina, tesoura e acabamento na navalha.',
    price: 40,
    minutes: 40,
    tag: 'Mais pedido',
    highlight: true,
  },
  {
    id: 'corte-barba',
    name: 'Corte + Barba',
    description:
      'O combo completo: corte finalizado na lâmina, toalha quente, navalha e balm pós-barba.',
    price: 70,
    minutes: 70,
    tag: 'Melhor custo',
    highlight: true,
  },
  {
    id: 'barba',
    name: 'Barba',
    description:
      'Modelagem no desenho do rosto, toalha quente, navalha aberta e finalização hidratante.',
    price: null,
    minutes: 30,
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    description: 'Alinhamento masculino na navalha, respeitando o traço natural.',
    price: null,
    minutes: 15,
  },
  {
    id: 'pezinho',
    name: 'Pezinho',
    description: 'Manutenção do contorno entre um corte e outro. Entra e sai.',
    price: null,
    minutes: 15,
  },
  {
    id: 'minoxidil',
    name: 'Consultoria Minoxidil',
    description:
      'Acompanhamento de crescimento de barba: rotina, aplicação e evolução registrada.',
    price: null,
    minutes: 20,
    tag: 'Programa',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Cortes — as 9 assinaturas da casa
// ─────────────────────────────────────────────────────────────────────────────

export type Cut = {
  id: string
  name: string
  /** Slug do arquivo em /images (sem extensão) */
  image: string
  blurb: string
  /** Usado no filtro da galeria */
  family: 'Fade' | 'Clássico' | 'Autoral'
}

export const CUTS: Cut[] = [
  { id: 'degrade', name: 'Degradê', image: 'corte-degrade', family: 'Fade', blurb: 'A transição limpa que virou assinatura da casa. Volume no topo, névoa nas laterais.' },
  { id: 'americano', name: 'Americano', image: 'corte-americano', family: 'Clássico', blurb: 'Risca marcada e topo penteado. O clássico que nunca sai do lugar.' },
  { id: 'low-fade', name: 'Low Fade', image: 'corte-low-fade', family: 'Fade', blurb: 'Degradê baixo, discreto. Para quem quer estilo sem chamar atenção.' },
  { id: 'militar', name: 'Militar', image: 'corte-militar', family: 'Clássico', blurb: 'Máquina rente, testa desenhada. Praticidade com acabamento impecável.' },
  { id: 'degrade-v', name: 'Degradê com V', image: 'corte-degrade-v', family: 'Autoral', blurb: 'A nuca em V feita na lâmina livre. Assinatura visível de longe.' },
  { id: 'skin-fade', name: 'Skin Fade', image: 'corte-skin-fade', family: 'Fade', blurb: 'Da pele ao volume sem nenhum degrau. O teste de fogo de qualquer barbeiro.' },
  { id: 'mid-fade', name: 'Mid Fade', image: 'corte-mid-fade', family: 'Fade', blurb: 'O meio-termo perfeito: nem tão alto, nem tão baixo. Combina com quase todo rosto.' },
  { id: 'mullet', name: 'Mullet', image: 'corte-mullet', family: 'Autoral', blurb: 'Curto na frente, solto atrás. O corte que voltou e ficou.' },
  { id: 'social', name: 'Social', image: 'corte-social', family: 'Clássico', blurb: 'Discreto, alinhado e pronto para qualquer compromisso.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Diferenciais, depoimentos e FAQ
// ─────────────────────────────────────────────────────────────────────────────

export const PILLARS = [
  {
    icon: 'blade',
    title: 'Acabamento na navalha',
    text: 'Todo corte termina com a lâmina aberta no contorno e na nuca. É o que faz o corte continuar arrumado na segunda e na terceira semana.',
  },
  {
    icon: 'clock',
    title: 'Hora marcada que se cumpre',
    text: 'A agenda é fechada pela duração real de cada serviço. Você senta na cadeira no horário combinado — sem esperar a vez de outra pessoa.',
  },
  {
    icon: 'eye',
    title: 'A conversa vem antes da máquina',
    text: 'Formato do rosto, tipo de cabelo e quanto você quer manter. O corte é combinado antes de qualquer máquina ligar.',
  },
  {
    icon: 'sparkles',
    title: 'O que passa no seu cabelo, você leva',
    text: 'Pomada, tônico, minoxidil e pós-barba ficam à venda na loja. É o mesmo produto que o barbeiro usou em você.',
  },
]

export const STATS = [
  { value: 9, prefix: '', suffix: '', label: 'cortes de assinatura' },
  { value: 60, prefix: '', suffix: 'h', label: 'de agenda por semana' },
  { value: 40, prefix: 'R$ ', suffix: '', label: 'a partir de' },
  { value: 100, prefix: '', suffix: '%', label: 'agendamento pelo WhatsApp' },
]

/**
 * Depoimentos reais, copiados do perfil do Google da barbearia.
 *
 * Esta lista está vazia de propósito. Ela chegou a ter quatro textos plausíveis
 * escritos por mim — o que, no site de um negócio real, é propaganda enganosa
 * com nome e sobrenome de gente que não existe. Enquanto não houver avaliação
 * de verdade aqui, a seção mostra o convite para avaliar no Google, e não
 * elogio fabricado.
 *
 * Para preencher: copie do perfil do Google (nome de quem escreveu, o texto e
 * a nota) e adicione abaixo.
 */
export type Testimonial = {
  name: string
  /** De onde a pessoa é, ou há quanto tempo é cliente. */
  handle: string
  text: string
  /** Nota de 1 a 5, como publicada no Google. */
  rating: number
}

export const TESTIMONIALS: Testimonial[] = []

/** Link direto para o perfil no Google, usado para ler e deixar avaliações. */
export const GOOGLE_PROFILE = 'https://share.google/wN91cRZ1BJSv56FWj'

export const FAQ = [
  {
    q: 'Preciso agendar ou posso chegar sem hora marcada?',
    a: 'A agenda funciona por horário marcado, então o ideal é reservar pelo WhatsApp. Se aparecer sem agendar, a gente encaixa conforme a disponibilidade do dia — mas o horário garantido é sempre o agendado.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Pix, dinheiro e cartões de débito e crédito. O Pix é o mais rápido e sai na hora.',
  },
  {
    q: 'Quanto tempo demora um corte?',
    a: 'Um corte leva cerca de 40 minutos. O combo corte + barba fica em torno de 1h10, porque inclui toalha quente e acabamento na navalha.',
  },
  {
    q: 'Vocês atendem criança?',
    a: 'Sim. É só avisar na hora de agendar para reservarmos um horário mais tranquilo, normalmente logo na abertura ou no início da tarde.',
  },
  {
    q: 'E se eu precisar remarcar?',
    a: 'Sem problema — avise pelo WhatsApp com pelo menos 2 horas de antecedência e a gente remarca para o próximo horário livre.',
  },
  {
    q: 'Vocês vendem os produtos usados no atendimento?',
    a: 'Vendemos. Pomadas, tônicos, minoxidil e pós-barba ficam disponíveis na loja — pergunte ao barbeiro durante o atendimento.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp
// ─────────────────────────────────────────────────────────────────────────────

export function whatsappUrl(message: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`
}

export const WHATSAPP_DEFAULT_MESSAGE =
  'Olá! Vim pelo site da Silverado e gostaria de agendar um horário.'
