/**
 * API do painel da Barbearia Silverado: coleta anônima de visitas e contatos
 * do site + leitura autenticada para o painel (/painel).
 *
 * Uma Lambda com Function URL (mesmo modelo da API de leads da International).
 * Sem dependências: o runtime nodejs22.x traz o AWS SDK v3.
 *
 * Rotas:
 *   POST /e          evento do site (público, sem dado pessoal)
 *   POST /login      { email, senha } → { token }
 *   GET  /resumo     ?dias=7|30|90  indicadores do período (autenticado)
 *   GET  /contatos   ?dias=…        contatos, do mais novo ao mais velho
 *   POST /senha      { atual, nova } troca a senha
 *   GET  /eu         quem está logado (nome, papel)
 *   GET  /usuarios                        lista (só admin)
 *   POST /usuarios   { email, nome, papel, senha? } cria; sem senha, gera uma
 *   POST /usuarios/redefinir { email }    nova senha aleatória (derruba sessões)
 *   POST /usuarios/remover   { email }    remove (não a si mesmo)
 *
 * Papéis: admin (tudo, inclusive usuários) e leitura (só os números).
 *
 * Privacidade: nada de nome, telefone, IP ou cookie. O visitante é um número
 * aleatório gerado no navegador; o pedido de agendamento guarda só serviço,
 * dia e hora (o nome vai para o WhatsApp, não para cá). TTL de 13 meses.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const TABELA_EVENTOS = process.env.TABELA_EVENTOS
const TABELA_USUARIOS = process.env.TABELA_USUARIOS
const SEGREDO = process.env.SEGREDO_JWT ?? ''
const TREZE_MESES = 60 * 60 * 24 * 396
const TIPOS = new Set(['visita', 'whatsapp', 'agendamento', 'telefone', 'mapa', 'instagram'])
export const CONTATOS = new Set(['whatsapp', 'agendamento', 'telefone'])
export const PAPEIS = new Set(['admin', 'leitura'])
const SENHA_MINIMA = 8
const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp\/|curl|wget|python|axios|node-fetch|playwright|puppeteer/i

// ── Utilidades puras (testadas) ────────────────────────────────────────────

const limpar = (v, max = 120) =>
  String(v ?? '')
    .replace(/\p{Cc}/gu, ' ')
    .trim()
    .slice(0, max)

/** Data e hora em Goiânia (UTC−3, sem horário de verão desde 2019). */
export function horaLocal(iso) {
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000)
  return { dia: d.toISOString().slice(0, 10), hora: d.getUTCHours(), semana: d.getUTCDay() }
}

/** De onde a pessoa veio: anúncio, busca, rede social, link ou direto. */
export function origemDe(referrer, utm = {}) {
  const fonte = (utm.utm_source ?? '').toLowerCase()
  const meio = (utm.utm_medium ?? '').toLowerCase()
  if (utm.gclid || (fonte.includes('google') && /cpc|paid|ads/.test(meio))) return 'Anúncio Google'
  if (utm.fbclid || /facebook|instagram|meta/.test(fonte)) return meio && /cpc|paid|ads/.test(meio) ? 'Anúncio Meta' : 'Instagram/Facebook'
  let host = ''
  try {
    host = new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    /* sem referrer */
  }
  if (!host) return fonte ? `Link (${fonte})` : 'Direto'
  if (/google\./.test(host)) return 'Busca Google'
  if (/bing\.|duckduckgo|yahoo|ecosia/.test(host)) return 'Outras buscas'
  if (/instagram|facebook|fb\.|threads/.test(host)) return 'Instagram/Facebook'
  if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(host)) return 'Assistentes de IA'
  if (/whatsapp|wa\.me/.test(host)) return 'WhatsApp'
  if (/barbeariasilverado/.test(host)) return 'Direto'
  return `Outro site (${host})`
}

export function aparelhoDe(ua = '') {
  if (/ipad|tablet/i.test(ua)) return 'Tablet'
  if (/mobi|android|iphone/i.test(ua)) return 'Celular'
  return 'Computador'
}

/** Valida o corpo de POST /e. Devolve o item a gravar ou null. */
export function validarEvento(corpo, ua, agora = new Date().toISOString()) {
  if (!corpo || typeof corpo !== 'object') return null
  if (ROBO.test(ua ?? '')) return null
  const tipo = limpar(corpo.t, 20)
  const visitante = limpar(corpo.v, 40)
  if (!TIPOS.has(tipo) || !/^[a-z0-9]{8,40}$/i.test(visitante)) return null
  const { dia } = horaLocal(agora)
  const utm = typeof corpo.u === 'object' && corpo.u ? corpo.u : {}
  const item = {
    dia,
    em: `${agora}#${randomBytes(3).toString('hex')}`,
    tipo,
    visitante,
    pagina: limpar(corpo.p, 120) || '/',
    contexto: limpar(corpo.c, 40),
    origem: origemDe(limpar(corpo.r, 300), {
      utm_source: limpar(utm.utm_source, 60),
      utm_medium: limpar(utm.utm_medium, 60),
      gclid: limpar(utm.gclid, 10),
      fbclid: limpar(utm.fbclid, 10),
    }),
    campanha: limpar(utm.utm_campaign, 80),
    aparelho: aparelhoDe(ua),
    novo: corpo.n === true,
    expiraEm: Math.floor(Date.parse(agora) / 1000) + TREZE_MESES,
  }
  if (tipo === 'agendamento') {
    item.servico = limpar(corpo.s, 60)
    item.diaPedido = limpar(corpo.d, 10)
    item.horaPedido = limpar(corpo.h, 5)
  }
  return item
}

// ── Indicadores (testados) ─────────────────────────────────────────────────

const contar = (lista, chave) => {
  const m = new Map()
  for (const x of lista) {
    const k = typeof chave === 'function' ? chave(x) : x[chave]
    if (k === undefined || k === '') continue
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nome, total]) => ({ nome, total }))
}

/** Indicadores de um período. `eventos` já filtrados pelo período. */
export function indicadores(eventos, dias, hojeIso = new Date().toISOString()) {
  const visitas = eventos.filter((e) => e.tipo === 'visita')
  const contatos = eventos.filter((e) => CONTATOS.has(e.tipo))
  const visitantes = new Set(visitas.map((e) => e.visitante))
  const quemContatou = new Set(contatos.map((e) => e.visitante))
  // Origem do visitante = a da primeira visita dele no período.
  const origemDoVisitante = new Map()
  for (const v of [...visitas].sort((a, b) => a.em.localeCompare(b.em)))
    if (!origemDoVisitante.has(v.visitante)) origemDoVisitante.set(v.visitante, v.origem)

  const { dia: hoje } = horaLocal(hojeIso)
  const serie = []
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(Date.parse(`${hoje}T12:00:00Z`) - i * 86400000).toISOString().slice(0, 10)
    serie.push({
      dia: d,
      visitantes: new Set(visitas.filter((e) => e.dia === d).map((e) => e.visitante)).size,
      contatos: contatos.filter((e) => e.dia === d).length,
    })
  }

  const calor = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const c of contatos) {
    const { hora, semana } = horaLocal(c.em.split('#')[0])
    calor[semana][hora]++
  }

  return {
    totais: {
      visitas: visitas.length,
      visitantes: visitantes.size,
      novos: new Set(visitas.filter((e) => e.novo).map((e) => e.visitante)).size,
      contatos: contatos.length,
      pessoasQueContataram: quemContatou.size,
      whatsapp: eventos.filter((e) => e.tipo === 'whatsapp').length,
      agendamentos: eventos.filter((e) => e.tipo === 'agendamento').length,
      telefone: eventos.filter((e) => e.tipo === 'telefone').length,
      mapa: eventos.filter((e) => e.tipo === 'mapa').length,
      instagram: eventos.filter((e) => e.tipo === 'instagram').length,
      conversao: visitantes.size ? quemContatou.size / visitantes.size : 0,
    },
    serie,
    origens: contar([...origemDoVisitante.values()].map((o) => ({ o })), 'o'),
    origensContato: contar(contatos, (c) => origemDoVisitante.get(c.visitante) ?? c.origem),
    paginas: contar(visitas, 'pagina').slice(0, 12),
    ondeClicaram: contar(contatos, (c) => c.contexto || c.tipo).slice(0, 12),
    servicos: contar(eventos.filter((e) => e.tipo === 'agendamento'), 'servico'),
    horasPedidas: contar(eventos.filter((e) => e.tipo === 'agendamento' && e.horaPedido), 'horaPedido'),
    aparelhos: contar([...visitantes].map((v) => visitas.find((e) => e.visitante === v)), 'aparelho'),
    campanhas: contar(visitas.filter((e) => e.campanha), 'campanha').slice(0, 10),
    calor,
  }
}

// ── Sessão (JWT HS256 próprio) ─────────────────────────────────────────────

const b64 = (b) => Buffer.from(b).toString('base64url')
export function assinar(dados, segredo = SEGREDO, horas = 12) {
  const cab = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const corpo = b64(JSON.stringify({ ...dados, exp: Math.floor(Date.now() / 1000) + horas * 3600 }))
  const ass = createHmac('sha256', segredo).update(`${cab}.${corpo}`).digest('base64url')
  return `${cab}.${corpo}.${ass}`
}
export function verificar(token, segredo = SEGREDO) {
  const [cab, corpo, ass] = String(token ?? '').split('.')
  if (!cab || !corpo || !ass) return null
  const esperado = createHmac('sha256', segredo).update(`${cab}.${corpo}`).digest()
  const recebido = Buffer.from(ass, 'base64url')
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return null
  const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString())
  return dados.exp > Date.now() / 1000 ? dados : null
}
export function hashSenha(senha, sal = randomBytes(16).toString('hex')) {
  return { sal, hash: scryptSync(senha, sal, 32).toString('hex') }
}
export function confere(senha, sal, hash) {
  const a = scryptSync(senha, sal, 32)
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

// ── HTTP + DynamoDB ────────────────────────────────────────────────────────

function resposta(status, corpo) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    body: corpo === undefined ? '' : JSON.stringify(corpo),
  }
}

/* c8 ignore start — integração com a AWS */
let sdk
async function aws() {
  if (!sdk) {
    const ddb = await import('@aws-sdk/client-dynamodb')
    const util = await import('@aws-sdk/util-dynamodb')
    sdk = { cli: new ddb.DynamoDBClient({}), ...ddb, ...util }
  }
  return sdk
}

async function eventosDoPeriodo(dias) {
  const { cli, QueryCommand, unmarshall } = await aws()
  const { dia: hoje } = horaLocal(new Date().toISOString())
  const lista = []
  const consultas = []
  for (let i = 0; i < dias; i++) {
    const d = new Date(Date.parse(`${hoje}T12:00:00Z`) - i * 86400000).toISOString().slice(0, 10)
    consultas.push(
      (async () => {
        let inicio
        do {
          const r = await cli.send(
            new QueryCommand({
              TableName: TABELA_EVENTOS,
              KeyConditionExpression: 'dia = :d',
              ExpressionAttributeValues: { ':d': { S: d } },
              ExclusiveStartKey: inicio,
            }),
          )
          for (const it of r.Items ?? []) lista.push(unmarshall(it))
          inicio = r.LastEvaluatedKey
        } while (inicio)
      })(),
    )
  }
  await Promise.all(consultas)
  return lista
}

async function usuario(email) {
  const { cli, GetItemCommand, unmarshall } = await aws()
  const r = await cli.send(new GetItemCommand({ TableName: TABELA_USUARIOS, Key: { email: { S: email } } }))
  return r.Item ? unmarshall(r.Item) : null
}

async function listarUsuarios() {
  const { cli, ScanCommand, unmarshall } = await aws()
  const r = await cli.send(new ScanCommand({ TableName: TABELA_USUARIOS }))
  return (r.Items ?? []).map((i) => unmarshall(i))
}

async function removerUsuario(email) {
  const { cli, DeleteItemCommand } = await aws()
  await cli.send(new DeleteItemCommand({ TableName: TABELA_USUARIOS, Key: { email: { S: email } } }))
}

/** Senha legível para passar por mensagem: 12 caracteres sem ambíguos. */
export function senhaAleatoria() {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(randomBytes(12), (b) => letras[b % letras.length]).join('')
}

const publico = (u) => ({ email: u.email, nome: u.nome ?? '', papel: u.papel ?? 'admin' })

async function salvarUsuario(u) {
  const { cli, PutItemCommand, marshall } = await aws()
  await cli.send(new PutItemCommand({ TableName: TABELA_USUARIOS, Item: marshall(u, { removeUndefinedValues: true }) }))
}

async function autenticado(evento) {
  const auth = evento.headers?.authorization ?? ''
  const dados = verificar(auth.replace(/^Bearer\s+/i, ''))
  if (!dados) return null
  const u = await usuario(dados.sub)
  return u && u.versao === dados.v ? u : null
}

function lerCorpo(evento) {
  const bruto = evento.isBase64Encoded ? Buffer.from(evento.body ?? '', 'base64').toString('utf8') : (evento.body ?? '')
  if (bruto.length > 4000) throw new Error('grande')
  return JSON.parse(bruto || '{}')
}

export async function handler(evento) {
  const metodo = evento?.requestContext?.http?.method
  const rota = evento?.rawPath ?? '/'
  if (metodo === 'OPTIONS') return { statusCode: 204 }

  let corpo = {}
  if (metodo === 'POST') {
    try {
      corpo = lerCorpo(evento)
    } catch {
      return resposta(400, { erro: 'corpo' })
    }
  }

  if (metodo === 'POST' && rota === '/e') {
    const item = validarEvento(corpo, evento.headers?.['user-agent'])
    if (item) {
      const { cli, PutItemCommand, marshall } = await aws()
      await cli.send(new PutItemCommand({ TableName: TABELA_EVENTOS, Item: marshall(item) }))
    }
    return resposta(204)
  }

  if (metodo === 'POST' && rota === '/login') {
    const email = limpar(corpo.email, 120).toLowerCase()
    const u = await usuario(email)
    const agora = Date.now()
    if (u?.bloqueadoAte && u.bloqueadoAte > agora) return resposta(429, { erro: 'bloqueado' })
    if (!u || !confere(String(corpo.senha ?? ''), u.sal, u.hash)) {
      if (u) {
        u.tentativas = (u.tentativas ?? 0) + 1
        if (u.tentativas >= 5) {
          u.bloqueadoAte = agora + 15 * 60 * 1000
          u.tentativas = 0
        }
        await salvarUsuario(u)
      } else hashSenha('x') // mesmo custo com e-mail inexistente
      return resposta(401, { erro: 'credenciais' })
    }
    if (u.tentativas) {
      u.tentativas = 0
      await salvarUsuario(u)
    }
    return resposta(200, { token: assinar({ sub: u.email, v: u.versao }), ...publico(u) })
  }

  const u = await autenticado(evento)
  if (!u) return resposta(401, { erro: 'sessao' })
  const dias = Math.min(90, Math.max(1, Number(evento.queryStringParameters?.dias ?? 30) || 30))

  if (metodo === 'GET' && rota === '/resumo') {
    const todos = await eventosDoPeriodo(dias * 2)
    const { dia: hoje } = horaLocal(new Date().toISOString())
    const corte = new Date(Date.parse(`${hoje}T12:00:00Z`) - (dias - 1) * 86400000).toISOString().slice(0, 10)
    const atual = todos.filter((e) => e.dia >= corte)
    const anterior = todos.filter((e) => e.dia < corte)
    const a = indicadores(atual, dias)
    const b = indicadores(anterior, dias)
    return resposta(200, { dias, ...a, anterior: b.totais })
  }

  if (metodo === 'GET' && rota === '/contatos') {
    const lista = (await eventosDoPeriodo(dias))
      .filter((e) => CONTATOS.has(e.tipo) || e.tipo === 'mapa')
      .sort((x, y) => y.em.localeCompare(x.em))
      .slice(0, 1000)
      .map(({ expiraEm: _x, ...r }) => r)
    return resposta(200, { dias, contatos: lista })
  }

  if (metodo === 'POST' && rota === '/senha') {
    if (!confere(String(corpo.atual ?? ''), u.sal, u.hash)) return resposta(401, { erro: 'senha-atual' })
    const nova = String(corpo.nova ?? '')
    if (nova.length < SENHA_MINIMA) return resposta(400, { erro: 'senha-curta' })
    Object.assign(u, hashSenha(nova), { versao: (u.versao ?? 1) + 1 })
    await salvarUsuario(u)
    return resposta(200, { token: assinar({ sub: u.email, v: u.versao }) })
  }

  if (metodo === 'GET' && rota === '/eu') return resposta(200, publico(u))

  // ── Usuários: só admin ──
  if (rota.startsWith('/usuarios')) {
    if ((u.papel ?? 'admin') !== 'admin') return resposta(403, { erro: 'permissao' })

    if (metodo === 'GET' && rota === '/usuarios') {
      const lista = (await listarUsuarios()).map(publico).sort((a, b) => a.email.localeCompare(b.email))
      return resposta(200, { usuarios: lista })
    }

    const email = limpar(corpo.email, 120).toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return resposta(400, { erro: 'email' })

    if (metodo === 'POST' && rota === '/usuarios') {
      if (await usuario(email)) return resposta(409, { erro: 'existe' })
      const papel = PAPEIS.has(corpo.papel) ? corpo.papel : 'leitura'
      const senha = String(corpo.senha ?? '') || senhaAleatoria()
      if (senha.length < SENHA_MINIMA) return resposta(400, { erro: 'senha-curta' })
      await salvarUsuario({ email, nome: limpar(corpo.nome, 80), papel, versao: 1, tentativas: 0, ...hashSenha(senha) })
      return resposta(201, { email, senha })
    }

    const alvo = await usuario(email)
    if (!alvo) return resposta(404, { erro: 'nao-existe' })

    if (metodo === 'POST' && rota === '/usuarios/redefinir') {
      const senha = senhaAleatoria()
      Object.assign(alvo, hashSenha(senha), { versao: (alvo.versao ?? 1) + 1, tentativas: 0, bloqueadoAte: undefined })
      await salvarUsuario(alvo)
      return resposta(200, { email, senha })
    }

    if (metodo === 'POST' && rota === '/usuarios/remover') {
      if (email === u.email) return resposta(400, { erro: 'si-mesmo' })
      await removerUsuario(email)
      return resposta(200, { email })
    }
  }

  return resposta(404, { erro: 'rota' })
}
/* c8 ignore stop */
