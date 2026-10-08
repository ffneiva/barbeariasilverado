/**
 * Tag do Google Ads.
 *
 * Quatro decisões que valem a explicação:
 *
 * 1. **Nada de snippet inline.** O e-mail do Google manda colar um `<script>`
 *    inline no `<head>`. A CSP deste site é `script-src 'self'` mais os
 *    domínios do Google — um script inline seria bloqueado, silenciosamente,
 *    e as conversões nunca chegariam. Aqui o bootstrap roda a partir do bundle
 *    (que é 'self') e só o `gtag/js` vem de fora.
 *
 * 2. **Carrega quando a thread principal fica ociosa.** Tag de anúncio não
 *    pode competir com o primeiro paint da página que ela está medindo.
 *
 * 3. **Uma conversão por rota.** As três conversões da conta são todas de
 *    "visualização de página". Disparar as três em toda página contaria três
 *    conversões por visita e destruiria o sinal de otimização da campanha.
 *
 * 4. **O evento que importa é o clique no WhatsApp.** Ver a página não separa
 *    quem vira cliente de quem só passou; pedir horário, sim. Toda a fiação
 *    para isso já está pronta — falta só o rótulo da conversão (ver abaixo).
 *
 * A escuta dos cliques não mora aqui: ela é compartilhada com o Pixel da Meta,
 * e vive em tracking.ts para que as duas plataformas nunca divirjam sobre o que
 * conta como contato.
 */

/** ID da conta do Google Ads. */
export const ADS_ID = 'AW-18389994298'

/**
 * Rótulos das conversões, no formato que vai depois da barra em `send_to`.
 *
 * ┌─ COMO PREENCHER ────────────────────────────────────────────────────────┐
 * │ Google Ads → Metas → Conversões → Nova ação de conversão → Site         │
 * │ Categoria "Contato", configuração manual. O Google devolve algo como    │
 * │ AW-18389994298/AbC-D_efGhIjKlM — cole só a parte DEPOIS da barra.       │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * `null` desliga a conversão sem quebrar nada: a fiação continua no lugar e
 * passa a valer no minuto em que o rótulo existir. É de propósito que não há
 * um valor de mentira aqui — rótulo inventado manda conversão para o limbo e
 * ninguém percebe.
 */
export const CONVERSIONS = {
  /** Clique em qualquer botão/link de WhatsApp. O evento que vira cliente. */
  whatsapp: null as string | null,
  /** Clique para ligar (links `tel:`). */
  telefone: null as string | null,
  /** Envio do pedido montado no agendador — a intenção mais forte do site. */
  agendamento: null as string | null,
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let loading = false

function ensureGtag(): void {
  if (loading || typeof window === 'undefined') return
  loading = true

  window.dataLayer = window.dataLayer || []
  // A função precisa usar `arguments`, e não rest args: é assim que o gtag.js
  // do Google espera encontrar os itens empilhados no dataLayer.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', ADS_ID)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`
  document.head.appendChild(script)
}

/** Carrega a tag assim que a página estiver ociosa. Idempotente. */
export function loadAds(): void {
  if (typeof window === 'undefined' || loading) return

  const start = () => ensureGtag()
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 2000 })
  } else {
    window.setTimeout(start, 1200)
  }
}

/**
 * Dispara uma conversão do Google Ads.
 *
 * Enfileira no `dataLayer` mesmo antes de o gtag.js terminar de baixar — é
 * exatamente para isso que a fila existe —, então um clique logo na chegada
 * não perde o evento.
 */
export function trackConversion(label: string | null | undefined, valor = 1.0): void {
  if (!label || typeof window === 'undefined') return
  ensureGtag()
  window.gtag?.('event', 'conversion', {
    send_to: `${ADS_ID}/${label}`,
    value: valor,
    currency: 'BRL',
  })
}

/**
 * Evento nomeado, independente de conversão configurada.
 *
 * Vale disparar mesmo com `CONVERSIONS` vazio: se um dia a conta for ligada ao
 * GA4, o histórico de eventos já estará lá — e enquanto isso ele custa nada.
 */
export function trackEvent(nome: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  ensureGtag()
  window.gtag?.('event', nome, { send_to: ADS_ID, ...params })
}
