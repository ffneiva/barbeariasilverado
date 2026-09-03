/**
 * Tag do Google Ads.
 *
 * Três decisões que valem a explicação:
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
 */

/** ID da conta do Google Ads. */
export const ADS_ID = 'AW-18389994298'

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
 * Dispara a conversão de uma rota.
 *
 * Enfileira no `dataLayer` mesmo antes de o gtag.js terminar de baixar — é
 * exatamente para isso que a fila existe —, então uma navegação rápida não
 * perde o evento.
 */
export function trackConversion(label: string | undefined): void {
  if (!label || typeof window === 'undefined') return
  ensureGtag()
  window.gtag?.('event', 'conversion', {
    send_to: `${ADS_ID}/${label}`,
    value: 1.0,
    currency: 'BRL',
  })
}
