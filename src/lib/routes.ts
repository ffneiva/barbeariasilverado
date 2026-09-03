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
 * As três conversões que a conta do Google Ads criou são todas do tipo
 * "visualização de página", e o e-mail de configuração não diz qual é qual.
 * O mapeamento abaixo é a leitura mais provável (a sem número é a primeira,
 * criada junto da conta). Se a campanha mostrar a conversão errada em alguma
 * página, é trocar a linha — nada mais depende disso.
 */
export const ROUTES: Route[] = [
  {
    path: '/',
    title: 'Barbearia Silverado · Barbearia no Jardim América, Goiânia',
    description:
      'Barbearia no Jardim América, em Goiânia. Degradê, fade, barba e sobrancelha com acabamento na navalha. Você explica o corte que quer e sai com ele. Corte a partir de R$ 40 — agende pelo WhatsApp.',
    adsConversion: 'l1coCLmH4OIcELqWhMFE',
  },
  {
    path: '/agendar',
    title: 'Agendar horário · Barbearia Silverado — Jardim América, Goiânia',
    description:
      'Escolha o serviço, o dia e a hora, e a mensagem chega pronta no WhatsApp da Barbearia Silverado. Corte R$ 40, corte + barba R$ 70. Jardim América, Goiânia.',
    adsConversion: 'skq4CMXF0eIcELqWhMFE',
  },
  {
    path: '/loja',
    title: 'Loja · Barbearia Silverado — pomadas, minoxidil e óleo de barba',
    description:
      'Pomada Vision e Infinity, minoxidil manipulado 5%, derma roller e óleo para barba Classe A. Os mesmos produtos usados no atendimento, com preço fechado. Jardim América, Goiânia.',
    adsConversion: 'hQSYCP2w0uIcELqWhMFE',
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
