import { BUSINESS } from './business.ts'
import { PAGINAS_CORTE, PAGINAS_SERVICO } from './paginas.ts'

/**
 * As rotas do site, com os metadados de cada uma.
 *
 * Este arquivo é importado dos DOIS lados: pelo React em tempo de execução e
 * pelo `vite.config.ts` em tempo de build, que usa a mesma lista para gerar um
 * HTML estático por rota. É por isso que ele não toca em `window` nem importa
 * nada de DOM.
 *
 * Por que HTML por rota, e não só trocar o `document.title` no cliente: as
 * páginas /agendar e /produtos são destino de anúncio pago. O robô do Google Ads
 * avalia a página de destino, e um leitor de link (WhatsApp, Instagram) lê só o
 * HTML inicial — nenhum dos dois executa a aplicação inteira antes de decidir
 * o que mostrar.
 */

export type Route = {
  path: string
  /** `<title>` da página. */
  title: string
  description: string
  /**
   * Rótulo da conversão do Google Ads disparada ao abrir esta rota.
   *
   * O ID da conta é global (ver lib/analytics); aqui fica só a parte final do
   * `send_to`. Cada rota dispara UMA conversão — disparar as três em toda
   * página contaria três conversões por visita e inutilizaria a otimização da
   * campanha.
   */
  adsConversion?: string
  /** Mantém a página fora do índice do Google (404 e painel). */
  noindex?: boolean
  /** Imagem de prévia própria (WhatsApp, Instagram), relativa ao site. */
  og?: string
  /**
   * Endereço antigo que mostra a mesma página de outra rota: a canônica aponta
   * para ela e o endereço fica fora do sitemap. /loja continua abrindo (links
   * e anúncios antigos), mas o endereço oficial é /produtos.
   */
  canonical?: string
}

/**
 * Conversões de "visualização de página" da conta, uma por rota.
 *
 * ┌─ COMO CONFERIR SE ESTÃO NA PÁGINA CERTA ────────────────────────────────┐
 * │ Google Ads → Metas → Conversões → clique na ação → "Configuração da     │
 * │ tag" → "Instalar a tag manualmente". O rótulo aparece dentro do         │
 * │ send_to, depois da barra. Compare com a lista abaixo.                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * O mapeamento veio da ordem de criação (a ação sem número é a mais antiga),
 * porque o e-mail de configuração não diz qual rótulo é de qual meta. Se
 * estiver trocado, é uma linha aqui — nada mais no site depende disso.
 *
 * Vale dizer o que estas conversões NÃO são: sinal de otimização. Elas
 * disparam por visitar a página, e quem clicou no anúncio sempre visita — a
 * taxa é 100% e o Google não aprende nada com isso. Elas servem só para ver o
 * tráfego separado por página de destino, e devem ficar marcadas como
 * **secundárias** no Ads. A conversão principal é o clique no WhatsApp
 * (ver CONVERSIONS em lib/analytics.ts).
 */
const PAGEVIEW = {
  home: 'l1coCLmH4OIcELqWhMFE', // "Visualização de página"
  agendar: 'skq4CMXF0eIcELqWhMFE', // "Visualização de página (1)"
  loja: 'hQSYCP2w0uIcELqWhMFE', // "Visualização de página (2)"
} as const

export const ROUTES: Route[] = [
  {
    path: '/',
    title: 'Barbearia Silverado · Barbearia no Jardim América, Goiânia',
    description:
      'Barbearia no Jardim América, Goiânia: degradê, fade, barba e sobrancelha com acabamento na navalha. Corte R$ 40. Seg a sáb, 9h às 19h. Agende pelo WhatsApp.',
    adsConversion: PAGEVIEW.home,
  },
  {
    path: '/agendar',
    title: 'Agendar horário · Barbearia Silverado, Goiânia',
    description:
      'Escolha o serviço, o dia e a hora, e a mensagem chega pronta no WhatsApp da Barbearia Silverado. Corte R$ 40, corte + barba R$ 70. Jardim América, Goiânia.',
    adsConversion: PAGEVIEW.agendar,
  },
  {
    path: '/produtos',
    title: 'Produtos: pomadas, minoxidil e óleo · Barbearia Silverado',
    description:
      'Pomadas Vision e Infinity, minoxidil manipulado 5%, derma roller e óleo de barba Classe A, com preço fechado, na Barbearia Silverado, Jardim América, Goiânia.',
    adsConversion: PAGEVIEW.loja,
  },
  {
    path: '/loja',
    title: 'Produtos: pomadas, minoxidil e óleo · Barbearia Silverado',
    description:
      'Pomadas Vision e Infinity, minoxidil manipulado 5%, derma roller e óleo de barba Classe A, com preço fechado, na Barbearia Silverado, Jardim América, Goiânia.',
    adsConversion: PAGEVIEW.loja,
    canonical: '/produtos',
  },
  {
    path: '/servicos',
    title: 'Serviços e preços · Barbearia Silverado, Goiânia',
    description:
      'Tabela de serviços e preços da Barbearia Silverado no Jardim América, Goiânia: corte R$ 40, barba R$ 40, corte + barba R$ 70, sobrancelha, pintura e mais.',
  },
  ...PAGINAS_SERVICO.map((p) => ({ path: p.path, title: p.titulo, description: limitar(p.descricao) })),
  {
    path: '/cortes',
    title: 'Cortes masculinos · Barbearia Silverado, Goiânia',
    description:
      'Degradê, low fade, mid fade, skin fade, militar, social, americano, mullet e degradê com V: os cortes feitos na Barbearia Silverado, no Jardim América.',
  },
  ...PAGINAS_CORTE.map((p) => ({
    path: p.path,
    title: p.titulo,
    description: limitar(p.descricao),
    og: `/images/${p.corte.image}-1280.webp`,
  })),
  {
    path: '/perguntas-frequentes',
    title: 'Perguntas frequentes · Barbearia Silverado, Goiânia',
    description:
      'Preço do corte, horário, se precisa agendar, onde fica, formas de pagamento: as respostas diretas sobre a Barbearia Silverado, no Jardim América.',
  },
  {
    path: '/politica-de-privacidade',
    title: 'Política de privacidade · Barbearia Silverado',
    description:
      'Como a Barbearia Silverado trata dados neste site: o que é coletado, quais serviços de terceiros são acionados e como exercer seus direitos pela LGPD.',
  },
]

export const HOME = ROUTES[0]

/** Meta description cabe em ~160 caracteres; corta na última palavra inteira. */
function limitar(texto: string, max = 158): string {
  if (texto.length <= max) return texto
  return `${texto.slice(0, texto.lastIndexOf(' ', max - 1)).replace(/[,.:;]$/, '')}.`
}

/**
 * Rota usada quando o endereço não existe.
 *
 * `noindex` é o ponto: sem ele, uma URL errada devolveria a home com status
 * 200 — o *soft 404* que o Google trata como sinal de site mal cuidado.
 */
export const NAO_ENCONTRADA: Route = {
  path: '/404',
  title: 'Página não encontrada · Barbearia Silverado',
  description: 'Este endereço não existe no site da Barbearia Silverado.',
  noindex: true,
}

/** Normaliza o pathname (ignora barra final e diferenças de caixa). */
function limpar(pathname: string): string {
  return pathname.replace(/\/+$/, '').toLowerCase() || '/'
}

/** Devolve a rota correspondente, ou a de 404 se o endereço não existir. */
export function routeFor(pathname: string): Route {
  return ROUTES.find((r) => r.path === limpar(pathname)) ?? NAO_ENCONTRADA
}

/** `true` quando o endereço corresponde a uma página real. */
export function isKnownRoute(pathname: string): boolean {
  return ROUTES.some((r) => r.path === limpar(pathname))
}

export function canonicalFor(route: Route): string {
  const path = route.canonical ?? route.path
  return path === '/' ? `${BUSINESS.url}/` : `${BUSINESS.url}${path}`
}
