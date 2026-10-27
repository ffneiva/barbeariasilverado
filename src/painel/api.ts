import { API_PAINEL } from '@/lib/rastro'

/** Cliente da API do painel (api/painel/index.mjs). Token no localStorage. */

const CHAVE_TOKEN = 'slv.painel.token'

export type Item = { nome: string; total: number }
export type Totais = {
  visitas: number
  visitantes: number
  novos: number
  contatos: number
  pessoasQueContataram: number
  whatsapp: number
  agendamentos: number
  telefone: number
  mapa: number
  instagram: number
  conversao: number
}
export type Resumo = {
  dias: number
  totais: Totais
  anterior: Totais
  serie: { dia: string; visitantes: number; contatos: number }[]
  origens: Item[]
  origensContato: Item[]
  paginas: Item[]
  ondeClicaram: Item[]
  servicos: Item[]
  horasPedidas: Item[]
  aparelhos: Item[]
  campanhas: Item[]
  calor: number[][]
}
export type Contato = {
  dia: string
  em: string
  tipo: string
  visitante: string
  pagina: string
  contexto?: string
  origem: string
  campanha?: string
  aparelho: string
  novo?: boolean
  servico?: string
  diaPedido?: string
  horaPedido?: string
}

export type Usuario = { email: string; nome: string; papel: 'admin' | 'leitura' }

export const token = {
  ler: () => {
    try {
      return localStorage.getItem(CHAVE_TOKEN)
    } catch {
      return null
    }
  },
  gravar: (t: string | null) => {
    try {
      if (t) localStorage.setItem(CHAVE_TOKEN, t)
      else localStorage.removeItem(CHAVE_TOKEN)
    } catch {
      /* sem armazenamento: vale só nesta aba */
    }
  },
}

export class SessaoExpirada extends Error {}

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const t = token.ler()
  const r = await fetch(`${API_PAINEL}${caminho}`, {
    ...init,
    headers: { ...(t ? { authorization: `Bearer ${t}` } : {}), ...(init.body ? { 'content-type': 'text/plain' } : {}) },
  })
  if (r.status === 401 && caminho !== '/login' && caminho !== '/senha') {
    token.gravar(null)
    throw new SessaoExpirada()
  }
  const dados = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(dados.erro ?? `erro ${r.status}`), { status: r.status })
  return dados as T
}

export const api = {
  login: (email: string, senha: string) =>
    chamar<{ token: string; nome: string }>('/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
  resumo: (dias: number) => chamar<Resumo>(`/resumo?dias=${dias}`),
  contatos: (dias: number) => chamar<{ contatos: Contato[] }>(`/contatos?dias=${dias}`),
  senha: (atual: string, nova: string) =>
    chamar<{ token: string }>('/senha', { method: 'POST', body: JSON.stringify({ atual, nova }) }),
  eu: () => chamar<Usuario>('/eu'),
  usuarios: () => chamar<{ usuarios: Usuario[] }>('/usuarios'),
  criarUsuario: (u: { email: string; nome: string; papel: string; senha?: string }) =>
    chamar<{ email: string; senha: string }>('/usuarios', { method: 'POST', body: JSON.stringify(u) }),
  redefinir: (email: string) =>
    chamar<{ email: string; senha: string }>('/usuarios/redefinir', { method: 'POST', body: JSON.stringify({ email }) }),
  remover: (email: string) => chamar<{ email: string }>('/usuarios/remover', { method: 'POST', body: JSON.stringify({ email }) }),
}
