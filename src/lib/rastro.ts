/**
 * Contagem própria de visitas e contatos, para o painel (/painel).
 *
 * Anônima de propósito: o visitante é um número aleatório guardado no
 * navegador (sem cookie, sem IP, sem nome). Cada página vista vira uma
 * "visita"; cada clique em WhatsApp, telefone, rota ou Instagram, um contato.
 * O pedido do agendador leva só serviço, dia e hora.
 *
 * Não conta: robôs, o pré-render do build (navigator.webdriver) e aparelhos
 * marcados no painel como "não contar".
 */

export const API_PAINEL = 'https://r33bfjwsmkpfx4pts7ue36kjmy0gxgxq.lambda-url.us-east-2.on.aws'

const CHAVE_VISITANTE = 'slv.v'
export const CHAVE_NAO_CONTAR = 'slv.nao-contar'
const CHAVE_ORIGEM = 'slv.origem'

type Evento = {
  t: 'visita' | 'whatsapp' | 'agendamento' | 'telefone' | 'mapa' | 'instagram'
  c?: string
  s?: string
  d?: string
  h?: string
}

function guardado(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave)
  } catch {
    return null
  }
}

function visitante(): { id: string; novo: boolean } {
  let id = guardado(CHAVE_VISITANTE)
  if (id) return { id, novo: false }
  id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20)
  try {
    window.localStorage.setItem(CHAVE_VISITANTE, id)
  } catch {
    /* sem armazenamento: conta como visitante novo a cada página */
  }
  return { id, novo: true }
}

/**
 * Origem da visita: o referrer e as UTMs da PRIMEIRA página da sessão. Nas
 * páginas seguintes o referrer é o próprio site, e a origem real se perderia.
 */
function origem(): { r: string; u: Record<string, string> } {
  try {
    const salvo = window.sessionStorage.getItem(CHAVE_ORIGEM)
    if (salvo) return JSON.parse(salvo)
  } catch {
    /* segue */
  }
  const q = new URLSearchParams(window.location.search)
  const u: Record<string, string> = {}
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid']) {
    const v = q.get(k)
    if (v) u[k] = k.endsWith('clid') ? '1' : v
  }
  const o = { r: document.referrer, u }
  try {
    window.sessionStorage.setItem(CHAVE_ORIGEM, JSON.stringify(o))
  } catch {
    /* segue */
  }
  return o
}

function desligado(): boolean {
  return (
    typeof window === 'undefined' ||
    navigator.webdriver ||
    guardado(CHAVE_NAO_CONTAR) === '1' ||
    window.location.pathname.startsWith('/painel')
  )
}

export function registrar(evento: Evento): void {
  if (desligado()) return
  const v = visitante()
  const corpo = JSON.stringify({ ...evento, v: v.id, n: v.novo, p: window.location.pathname, ...origem() })
  // text/plain não dispara preflight de CORS, e o sendBeacon sobrevive à saída
  // da página (o clique no WhatsApp abre outra aba ou outro app).
  const blob = new Blob([corpo], { type: 'text/plain' })
  if (!navigator.sendBeacon?.(`${API_PAINEL}/e`, blob)) {
    fetch(`${API_PAINEL}/e`, { method: 'POST', body: corpo, keepalive: true, mode: 'no-cors' }).catch(() => {})
  }
}
