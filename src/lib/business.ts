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
    'Barbearia no Jardim América, em Goiânia. Degradê, fade, barba e sobrancelha, ' +
    'com acabamento na navalha. Você explica o corte que quer e sai com ele. ' +
    'Agendamento pelo WhatsApp.',

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
  /** Quando true, o preço é um piso ("a partir de"), como na tabela da parede. */
  fromPrice?: boolean
  /** Duração estimada em minutos — alimenta o gerador de horários do agendamento. */
  minutes: number
  highlight?: boolean
  tag?: string
}

/**
 * A tabela de serviços da parede, transcrita.
 *
 * `minutes` é estimativa da casa, não vem da tabela — ela existe só para o
 * agendador saber se o serviço cabe no que resta do turno. Errar dez minutos
 * aqui não muda o preço nem o atendimento; mudar o preço, sim.
 */
export const SERVICES: Service[] = [
  {
    id: 'corte',
    name: 'Corte',
    description:
      'Degradê, fade, social — ou o modelo da foto que você trouxer. Máquina, tesoura e o contorno finalizado na navalha.',
    price: 40,
    minutes: 40,
    tag: 'Mais pedido',
    highlight: true,
  },
  {
    id: 'barba',
    name: 'Barba',
    description: 'Aparo, desenho no formato do seu rosto e acabamento com navalha aberta.',
    price: 40,
    minutes: 30,
    highlight: true,
  },
  {
    id: 'corte-barba',
    name: 'Corte + Barba',
    description:
      'Cabelo e barba na mesma sessão, os dois terminados na lâmina. Sai R$ 10 mais barato que separado.',
    price: 70,
    minutes: 70,
    tag: 'Melhor custo',
    highlight: true,
  },
  {
    id: 'pezinho',
    name: 'Acabamento pezinho',
    description: 'Manutenção do contorno entre um corte e outro. Entra e sai.',
    price: 10,
    minutes: 15,
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    description: 'Alinhamento no traço natural — limpa o excesso sem tirar a sua expressão.',
    price: 10,
    minutes: 15,
  },
  {
    id: 'hidratacao',
    name: 'Hidratação capilar',
    description: 'Repõe o que o sol, o boné e a máquina tiram. Deixa o fio mais macio de manejar.',
    price: 25,
    minutes: 30,
  },
  {
    id: 'selagem',
    name: 'Selagem / Progressiva',
    description: 'Reduz o volume e alinha o fio. O valor final depende do comprimento do cabelo.',
    price: 90,
    fromPrice: true,
    minutes: 120,
  },
  {
    id: 'botox',
    name: 'Botox capilar',
    description: 'Preenche o fio danificado e devolve brilho, sem alisar. Valor conforme o comprimento.',
    price: 60,
    fromPrice: true,
    minutes: 90,
  },
  {
    id: 'depilacao',
    name: 'Depilação nariz e orelha',
    description: 'Cera quente, rápido e no fim do atendimento. Detalhe que ninguém elogia, mas todo mundo nota.',
    price: 15,
    minutes: 10,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Cortes — os 9 modelos do cardápio
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
  { id: 'degrade', name: 'Degradê', image: 'corte-degrade', family: 'Fade', blurb: 'A transição limpa que virou a marca da casa. Volume no topo, névoa nas laterais.' },
  { id: 'americano', name: 'Americano', image: 'corte-americano', family: 'Clássico', blurb: 'Risca marcada e topo penteado. O clássico que nunca sai do lugar.' },
  { id: 'low-fade', name: 'Low Fade', image: 'corte-low-fade', family: 'Fade', blurb: 'Degradê baixo, discreto. Para quem quer estilo sem chamar atenção.' },
  { id: 'militar', name: 'Militar', image: 'corte-militar', family: 'Clássico', blurb: 'Máquina rente, testa desenhada. Praticidade com acabamento impecável.' },
  { id: 'degrade-v', name: 'Degradê com V', image: 'corte-degrade-v', family: 'Autoral', blurb: 'A nuca em V feita na lâmina livre. Detalhe que se vê de longe.' },
  { id: 'skin-fade', name: 'Skin Fade', image: 'corte-skin-fade', family: 'Fade', blurb: 'Da pele ao volume sem nenhum degrau. O teste de fogo de qualquer barbeiro.' },
  { id: 'mid-fade', name: 'Mid Fade', image: 'corte-mid-fade', family: 'Fade', blurb: 'O meio-termo perfeito: nem tão alto, nem tão baixo. Combina com quase todo rosto.' },
  { id: 'mullet', name: 'Mullet', image: 'corte-mullet', family: 'Autoral', blurb: 'Curto na frente, solto atrás. O corte que voltou e ficou.' },
  { id: 'social', name: 'Social', image: 'corte-social', family: 'Clássico', blurb: 'Discreto, alinhado e pronto para qualquer compromisso.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Produtos — a tabela de produtos da parede
// ─────────────────────────────────────────────────────────────────────────────

export type Product = {
  id: string
  name: string
  /** Volume ou peso, como está na embalagem. */
  size: string
  price: number
  description: string
  /**
   * Marca impressa no rótulo.
   *
   * Existe para o JSON-LD: `Product` sem marca é um item genérico para o
   * Google, e é a marca que conecta a página a buscas como "pomada infinity
   * goiânia" — concorrência muito mais rala que "barbearia goiânia".
   * Só entra aqui o que está escrito na embalagem e visível na página.
   */
  brand?: string
  /**
   * Slug do arquivo em /images (sem extensão). Opcional: sem foto, o card cai
   * para um tratamento tipográfico em vez de mostrar um buraco.
   */
  image?: string
}

/** Agrupado por problema que resolve — é assim que o cliente pergunta. */
export const PRODUCT_GROUPS: Array<{ title: string; blurb: string; items: Product[] }> = [
  {
    title: 'Barba que ainda está vindo',
    blurb:
      'O combo que o barbeiro monta para quem está fazendo a barba preencher. Ele explica a rotina no atendimento.',
    items: [
      {
        id: 'minoxidil',
        brand: 'Ultra Brasil',
        name: 'Minoxidil manipulado 5%',
        size: '60 ml',
        price: 80,
        description:
          'Manipulado na farmácia Ultra Brasil, não industrializado. Uso externo, na rotina de crescimento de barba — o resultado varia de pessoa para pessoa.',
        image: 'produto-minoxidil',
      },
      {
        id: 'derma-roller',
        name: 'Derma roller',
        size: 'unidade',
        price: 40,
        description: 'Acompanha o minoxidil: prepara a pele antes da aplicação.',
        image: 'produto-derma-roller',
      },
      {
        id: 'oleo-classe-a',
        brand: 'Classe A',
        name: 'Óleo para barba Classe A',
        size: '30 ml',
        price: 40,
        description: 'Hidrata o fio e a pele por baixo, e tira a coceira da barba em crescimento.',
        image: 'produto-oleo-classe-a',
      },
    ],
  },
  {
    title: 'Para o cabelo ficar em pé em casa',
    blurb:
      'As pomadas que o barbeiro usa na finalização. Você leva a mesma lata que passou no seu cabelo.',
    items: [
      {
        id: 'pomada-vision',
        brand: 'Vision',
        name: 'Pomada Vision',
        size: '70 g',
        price: 30,
        description: 'Fixação média com brilho. Boa para o dia a dia e fácil de sair no banho.',
        image: 'produto-pomada-vision',
      },
      {
        id: 'pomada-infinity-80',
        brand: 'Classic Barber',
        name: 'Pomada Infinity Classic',
        size: '80 g',
        price: 40,
        description: 'Modeladora, para quem quer o topo firme o dia inteiro.',
        image: 'produto-pomada-infinity',
      },
      {
        id: 'pomada-infinity-160',
        brand: 'Classic Barber',
        name: 'Pomada Infinity Classic',
        size: '160 g',
        price: 70,
        description: 'A mesma pomada no pote grande — sai mais barato por grama.',
        image: 'produto-pomada-infinity',
      },
    ],
  },
]

export const PRODUCTS: Product[] = PRODUCT_GROUPS.flatMap((g) => g.items)

// ─────────────────────────────────────────────────────────────────────────────
// Diferenciais, depoimentos e FAQ
// ─────────────────────────────────────────────────────────────────────────────

export const PILLARS = [
  {
    icon: 'eye',
    title: 'Sai do jeito que você pediu',
    text: 'Você explica com uma foto, com a mão na cabeça ou do jeito que der. O que sai é o que foi combinado — não a versão que o barbeiro preferia fazer.',
  },
  {
    icon: 'blade',
    title: 'Acabamento na navalha',
    text: 'O contorno e a nuca terminam com a lâmina aberta. É o que faz o corte continuar arrumado na segunda e na terceira semana.',
  },
  {
    icon: 'clock',
    title: 'Não sabe o que quer? Tudo bem',
    text: 'A gente olha o formato do seu rosto, o seu tipo de cabelo e quanto você pretende manter, e sugere o que funciona.',
  },
  {
    icon: 'sparkles',
    title: 'O que passa no seu cabelo, você leva',
    text: 'Pomada, tônico, minoxidil e pós-barba ficam à venda na loja. É o mesmo produto que o barbeiro usou em você.',
  },
]

/**
 * Resumo do perfil do Google.
 *
 * Números conferidos manualmente na listagem de avaliações. Se o perfil mudar,
 * é aqui que se atualiza — a régua de números e o texto da seção de
 * depoimentos leem daqui.
 */
export const GOOGLE_REVIEWS = { count: 30, rating: 5 }

/**
 * As 54h/semana saem da soma do SCHEDULE acima: 9h por dia útil (3h de manhã +
 * 6h à tarde) × 5, mais 9h no sábado. Não é número redondo de marketing.
 */
export const STATS = [
  { value: 9, prefix: '', suffix: '', label: 'modelos de corte no cardápio' },
  { value: 54, prefix: '', suffix: 'h', label: 'de atendimento por semana' },
  { value: 40, prefix: 'R$ ', suffix: '', label: 'a partir de' },
  { value: GOOGLE_REVIEWS.count, prefix: '', suffix: '', label: 'avaliações 5 estrelas no Google' },
]

/**
 * Depoimentos reais, transcritos do perfil do Google da barbearia.
 *
 * Regra deste arquivo: **texto verbatim**. Nada aqui é reescrito, resumido ou
 * "melhorado" — inclusive a pontuação e as maiúsculas de quem escreveu. Um
 * depoimento editado deixa de ser depoimento.
 *
 * `handle` não é invenção: sai dos campos que o próprio Google publica junto da
 * avaliação (serviços contratados, estilo pedido, selo de Local Guide).
 *
 * O JSON-LD de propósito NÃO marca estas avaliações: as diretrizes do Google
 * excluem review coletado em outra plataforma e republicado pelo próprio
 * negócio. Elas ficam aqui como prova social para quem lê, não como rich snippet.
 */
export type Testimonial = {
  name: string
  /** De onde vem a pessoa ou o que ela contratou, conforme publicado no Google. */
  handle: string
  text: string
  /** Nota de 1 a 5, como publicada no Google. */
  rating: number
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Tiago Silva',
    handle: 'Avaliação no Google',
    rating: 5,
    text:
      'Excelente atendimento! Fiquei muito satisfeito com o corte e com todo o profissionalismo. ' +
      'O barbeiro é extremamente atencioso, caprichoso e demonstra muita experiência no que faz. ' +
      'O ambiente é agradável, organizado e faz a gente se sentir à vontade. Sem dúvida, um dos ' +
      'melhores atendimentos que já recebi. Recomendo de olhos fechados para quem procura ' +
      'qualidade, respeito e um resultado impecável. Parabéns pelo excelente trabalho!',
  },
  {
    name: 'Gui Motta',
    handle: 'Corte, barba e navalha',
    rating: 5,
    text: 'Profissional extremamente competente! Fez um corte perfeito e um degrade perfeito! Indico demais!',
  },
  {
    name: 'Yuri Tavares',
    handle: 'Corte personalizado',
    rating: 5,
    text:
      'O cara é muito bom, o trabalho mais bem feito que já vi, sendo que já paguei caro e não ' +
      'chegou perto do que ele faz!!!',
  },
  {
    name: 'kal ly',
    handle: 'Degradê · atendido por Lucas',
    rating: 5,
    text: 'Melhor barbearia da região, corte rápido e bem feito! ✅',
  },
  {
    name: 'Halys Andrade Jr',
    handle: 'Local Guide no Google',
    rating: 5,
    text: 'Fiquei satisfeito com o corte. Lucas foi atencioso. Recomendo cortar com ele.',
  },
  {
    name: 'Regis Lima',
    handle: 'Corte, barba e sobrancelha',
    rating: 5,
    text: 'Atendimento excelente, ambiente agradável, o corte saiu do jeito que eu pedi.',
  },
  {
    name: 'Fabio Ferreira',
    handle: 'Corte em degradê e barba',
    rating: 5,
    text: 'O melhor de Goiânia!! Só corto meu cabelo com ele!',
  },
  {
    name: 'Leonardo Diniz Alencar',
    handle: 'Corte de cabelo',
    rating: 5,
    text:
      'Excelente atendimento, barbeiro muito simpático e super educado, ficou ótimo meu corte ' +
      'de cabelo…. Super indico 👍👍',
  },
]

/** Link direto para o perfil no Google, usado para ler e deixar avaliações. */
export const GOOGLE_PROFILE = 'https://share.google/wN91cRZ1BJSv56FWj'

export const FAQ = [
  {
    q: 'Preciso agendar ou posso chegar sem hora marcada?',
    a: 'Pode chegar e fazer o encaixe. Mandar mensagem antes só evita que você espere: o barbeiro responde com um horário livre e você chega na hora certa.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Pix, dinheiro e cartões de débito e crédito.',
  },
  {
    q: 'Não sei explicar o corte que eu quero. Tem problema?',
    a: 'Nenhum. Traga uma foto de referência — ou nem isso. A gente olha o formato do seu rosto, o seu tipo de cabelo e quanto você quer manter, e sugere o que combina.',
  },
  {
    q: 'Quanto tempo demora?',
    a: 'Um corte leva cerca de 40 minutos. Corte com barba fica em torno de 1h10, porque os dois terminam no acabamento com navalha.',
  },
  {
    q: 'Vocês atendem criança?',
    a: 'Sim. Avise ao agendar para reservarmos um horário mais tranquilo — normalmente logo na abertura ou no começo da tarde.',
  },
  {
    q: 'E se eu precisar remarcar?',
    a: 'Avise pelo WhatsApp assim que souber e a gente encaixa você em outro horário.',
  },
  {
    q: 'Vocês trabalham com plano ou mensalidade?',
    a: 'Não. Cada serviço tem o preço da tabela e você paga o que usou, quando usar.',
  },
  {
    q: 'Onde fica a barbearia?',
    a: 'Na Avenida C-4, nº 73, no Jardim América, em Goiânia. É a poucos minutos do Setor Bueno, do Marista, do Setor Oeste e do Jardim Goiás. Tem o mapa e a rota aqui embaixo, na seção Onde estamos.',
  },
  {
    q: 'Que horas vocês abrem? Abre no domingo?',
    a: 'De segunda a sexta, das 9h às 20h, com almoço das 12h às 14h. Sábado das 9h às 19h, com almoço das 12h às 13h. Domingo não abrimos.',
  },
  {
    q: 'Quanto custa o corte?',
    a: 'O corte de cabelo sai R$ 40 e o corte com barba, R$ 70. A tabela inteira está na seção Serviços, com o preço de cada item.',
  },
  {
    q: 'Vocês vendem os produtos usados no atendimento?',
    a: 'Vendemos. Pomada Vision (R$ 30), Pomada Infinity (R$ 40 ou R$ 70), óleo para barba Classe A (R$ 40), minoxidil manipulado (R$ 80) e derma roller (R$ 40). A lista completa está na seção Loja, aqui do site.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp
// ─────────────────────────────────────────────────────────────────────────────

export function whatsappUrl(message: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`
}

export const WHATSAPP_DEFAULT_MESSAGE =
  'Olá! Vim pelo site da Silverado e queria marcar um horário.'
