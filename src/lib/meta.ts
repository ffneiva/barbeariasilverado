/**
 * Pixel da Meta.
 *
 * O painel da Meta manda colar um `<script>` inline no `<head>`. Colado assim,
 * ele **não funcionaria neste site** e ninguém veria erro nenhum: a CSP é
 * `script-src 'self' …`, sem `'unsafe-inline'`, e o navegador descarta scripts
 * inline caladamente. O Gerenciador de Eventos ficaria zerado por semanas com o
 * código "instalado" na página — a mesma armadilha que a tag do Google Ads teria
 * caído (ver analytics.ts).
 *
 * Aqui o bootstrap que a Meta escreve inline vive dentro do bundle, que é
 * 'self', e só o `fbevents.js` vem de fora — com `connect.facebook.net`
 * liberado explicitamente na CSP (ver scripts/aws-setup.sh).
 *
 * A fila (`fbq.queue`) é a mesma do snippet original e é o que permite disparar
 * um evento antes de o script terminar de baixar: quem clica no WhatsApp dois
 * segundos depois de abrir a página não perde o evento.
 */

/** ID do pixel da conta da barbearia. */
export const PIXEL_ID = '1025893443765598'

type Fbq = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: Fbq
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

let carregando = false

function ensurePixel(): void {
  if (typeof window === 'undefined') return

  // O stub é o do snippet oficial, com `arguments` trocado por rest/spread —
  // o fbevents.js relê a fila com `apply`, e para ele um array e um `arguments`
  // são a mesma coisa. Chamar `fbq.callMethod(...)` como método preserva o
  // `this` que o `.apply(n, …)` do original garantia.
  if (!window.fbq) {
    // A anotação `: Fbq` existe para o corpo da função enxergar `callMethod` e
    // `queue`: o nome de uma função-expressão referencia a si mesma com a
    // assinatura crua, sem as propriedades que o stub pendura depois.
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue.push(args)
    } as unknown as Fbq

    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.push = fbq

    window.fbq = fbq
    if (!window._fbq) window._fbq = fbq

    window.fbq('init', PIXEL_ID)
  }

  if (carregando) return
  carregando = true

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

/** Carrega o pixel assim que a thread principal ficar ociosa. Idempotente. */
export function loadPixel(): void {
  if (typeof window === 'undefined' || carregando) return

  const iniciar = () => ensurePixel()
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(iniciar, { timeout: 2000 })
  } else {
    window.setTimeout(iniciar, 1200)
  }
}

/**
 * Dispara um evento padrão da Meta.
 *
 * Só eventos padrão (`Contact`, `Schedule`, `FindLocation`, `PageView`) — são
 * os que o Gerenciador de Anúncios já sabe usar como objetivo de campanha sem
 * configuração nenhuma. Evento personalizado exigiria o Lucas criar a conversão
 * na mão antes de servir para alguma coisa.
 */
export function trackMeta(evento: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  ensurePixel()
  window.fbq?.('track', evento, params)
}

/**
 * PageView de uma navegação interna.
 *
 * O snippet original dispara PageView uma única vez, no carregamento. Como a
 * navegação daqui é do cliente, ir da home para /loja não geraria evento
 * nenhum — e o funil da Meta mostraria todo mundo entrando e ninguém andando.
 */
export function trackMetaPageView(): void {
  trackMeta('PageView')
}
