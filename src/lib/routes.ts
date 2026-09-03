import { BUSINESS } from './business.ts'

/**
 * As rotas do site, com os metadados de cada uma.
 *
 * Este arquivo é importado dos DOIS lados: pelo React em tempo de execução e
 * pelo `vite.config.ts` em tempo de build, que usa a mesma lista para gerar um
 * HTML estático por rota. É por isso que ele não toca em `window` nem importa
 * nada de DOM.
 *
 * Por que HTML por rota, e não só trocar o `document.title` no cliente: as
 * páginas /agendar e /loja são destino de anúncio pago. O robô do Google Ads
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
      'Barbearia no Jardim América, em Goiânia. Degradê, fade, barba e sobrancelha com acabamento na navalha. Você explica o corte que quer e sai com ele. Corte a partir de R$ 40 — agende pelo WhatsApp.',
    adsConversion: PAGEVIEW.home,
  },
  {
    path: '/agendar',
    title: 'Agendar horário · Barbearia Silverado — Jardim América, Goiânia',
    description:
      'Escolha o serviço, o dia e a hora, e a mensagem chega pronta no WhatsApp da Barbearia Silverado. Corte R$ 40, corte + barba R$ 70. Jardim América, Goiânia.',
    adsConversion: PAGEVIEW.agendar,
  },
  {
    path: '/loja',
    title: 'Loja · Barbearia Silverado — pomadas, minoxidil e óleo de barba',
    description:
      'Pomada Vision e Infinity, minoxidil manipulado 5%, derma roller e óleo para barba Classe A. Os mesmos produtos usados no atendimento, com preço fechado. Jardim América, Goiânia.',
    adsConversion: PAGEVIEW.loja,
  },
  {
    path: '/politica-de-privacidade',
    title: 'Política de privacidade · Barbearia Silverado',
    description:
      'Como a Barbearia Silverado trata dados neste site: o que é coletado, quais serviços de terceiros são acionados e como exercer seus direitos pela LGPD.',
  },
]

export const HOME = ROUTES[0]

/** Casa o pathname com uma rota, ignorando barra final. */
export function routeFor(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return ROUTES.find((r) => r.path === clean) ?? HOME
}

export function canonicalFor(route: Route): string {
  return route.path === '/' ? `${BUSINESS.url}/` : `${BUSINESS.url}${route.path}`
}
