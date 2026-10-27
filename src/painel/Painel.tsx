import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { CHAVE_NAO_CONTAR } from '@/lib/rastro'
import { api, type Contato, type Resumo, SessaoExpirada, type Totais, token, type Usuario } from './api'
import { Barras, Calor, Serie } from './graficos'

/**
 * Painel da Barbearia Silverado (/painel): quantas pessoas entram no site, de
 * onde vêm e quantas chamam no WhatsApp, ligam, pedem horário ou pedem a rota.
 * Dados anônimos coletados pelo próprio site (lib/rastro.ts → api/painel).
 */

const TIPO: Record<string, string> = {
  whatsapp: 'WhatsApp',
  agendamento: 'Pedido de horário',
  telefone: 'Ligação',
  mapa: 'Rota no mapa',
  instagram: 'Instagram',
}

/** Onde o botão estava, em português (o site manda o id da seção). */
const LUGAR: Record<string, string> = {
  inicio: 'Abertura do site',
  'início': 'Abertura do site',
  manifesto: 'A casa',
  numeros: 'Números',
  servicos: 'Card de serviço',
  agendar: 'Agendador',
  agendamento: 'Agendador',
  cortes: 'Galeria de cortes',
  depoimentos: 'Depoimentos',
  loja: 'Produtos',
  duvidas: 'Dúvidas',
  localizacao: 'Onde estamos',
  fecho: 'Chamada final',
  portal: 'Foto da barbearia',
  topo: 'Topo do site',
  'rodapé': 'Rodapé',
  'botão flutuante': 'Botão flutuante',
  link: 'Link',
}
const lugar = (c?: string) => (c ? (LUGAR[c] ?? c) : '')

const n = (v: number) => v.toLocaleString('pt-BR')
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

function quando(iso: string) {
  const d = new Date(iso.split('#')[0])
  return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function diaPedido(d?: string) {
  return d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : ''
}

function Cartao({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-sm border border-steel-900 bg-white/[0.015] p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 font-mono text-[0.65rem] tracking-[0.2em] text-steel-500 uppercase">{titulo}</h2>
      {children}
    </section>
  )
}

function Indicador({ rotulo, valor, antes, formato = n, dica }: { rotulo: string; valor: number; antes: number; formato?: (v: number) => string; dica?: string }) {
  const dif = antes ? (valor - antes) / antes : valor ? 1 : 0
  return (
    <div className="rounded-sm border border-steel-900 bg-white/[0.015] p-5" title={dica}>
      <p className="font-mono text-[0.62rem] tracking-[0.18em] text-steel-500 uppercase">{rotulo}</p>
      <p className="mt-2 font-display text-4xl text-steel-50 tabular-nums">{formato(valor)}</p>
      <p className={`mt-1 text-xs ${dif > 0 ? 'text-emerald-400' : dif < 0 ? 'text-rose-400' : 'text-steel-600'}`}>
        {antes || valor ? `${dif > 0 ? '▲' : dif < 0 ? '▼' : '='} ${pct(Math.abs(dif))} vs. período anterior` : 'sem dados ainda'}
      </p>
    </div>
  )
}

// ── Login ───────────────────────────────────────────────────────────────────

function Entrar({ aoEntrar }: { aoEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      const r = await api.login(email, senha)
      token.gravar(r.token)
      aoEntrar()
    } catch (err) {
      const s = (err as { status?: number }).status
      setErro(s === 429 ? 'Muitas tentativas. Espere 15 minutos.' : 'E-mail ou senha incorretos.')
    } finally {
      setEnviando(false)
    }
  }
  const campo = 'mt-1.5 w-full border border-steel-800 bg-void px-4 py-3 text-steel-100 focus:border-steel-400 focus:outline-none'
  return (
    <main className="grid min-h-svh place-items-center px-5">
      <form onSubmit={enviar} className="w-full max-w-sm">
        <img src="/images/logo-wordmark.png" alt="Barbearia Silverado" className="mb-10 w-48" />
        <h1 className="text-4xl text-steel-100">Painel</h1>
        <label className="mt-8 block text-sm text-steel-400">
          E-mail
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
        </label>
        <label className="mt-4 block text-sm text-steel-400">
          Senha
          <input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} />
        </label>
        {erro && <p className="mt-4 text-sm text-rose-400" role="alert">{erro}</p>}
        <button disabled={enviando} className="mt-6 w-full rounded-full bg-steel-100 py-3.5 font-mono text-xs tracking-[0.2em] text-void uppercase disabled:opacity-50">
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

// ── Resumo ──────────────────────────────────────────────────────────────────

function PainelResumo({ r }: { r: Resumo }) {
  const t: Totais = r.totais
  const a: Totais = r.anterior
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Pessoas no site" valor={t.visitantes} antes={a.visitantes} dica="Visitantes diferentes (aparelhos) no período" />
        <Indicador rotulo="Contatos" valor={t.contatos} antes={a.contatos} dica="Cliques em WhatsApp, pedidos de horário e ligações" />
        <Indicador rotulo="Pedidos de horário" valor={t.agendamentos} antes={a.agendamentos} dica="Pedidos enviados pelo agendador do site" />
        <Indicador rotulo="Viraram contato" valor={t.conversao} antes={a.conversao} formato={pct} dica="Das pessoas que entraram, quantas chamaram" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ['WhatsApp', t.whatsapp, a.whatsapp],
            ['Ligações', t.telefone, a.telefone],
            ['Rotas no mapa', t.mapa, a.mapa],
            ['Instagram', t.instagram, a.instagram],
            ['Páginas vistas', t.visitas, a.visitas],
          ] as const
        ).map(([rot, v, ant]) => (
          <div key={rot} className="rounded-sm border border-steel-900 px-4 py-3">
            <p className="text-xs text-steel-500">{rot}</p>
            <p className="mt-1 font-display text-2xl text-steel-100 tabular-nums">
              {n(v)} <span className="text-xs text-steel-600">antes {n(ant)}</span>
            </p>
          </div>
        ))}
      </div>

      <Cartao titulo="Dia a dia">
        <Serie dados={r.serie} />
      </Cartao>

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo="De onde vieram as pessoas">
          <Barras itens={r.origens} />
        </Cartao>
        <Cartao titulo="De onde vieram os contatos">
          <Barras itens={r.origensContato} vazio="Nenhum contato no período" />
        </Cartao>
        <Cartao titulo="Onde clicaram para chamar">
          <Barras itens={r.ondeClicaram.map((i) => ({ ...i, nome: lugar(i.nome) }))} vazio="Nenhum contato no período" />
        </Cartao>
        <Cartao titulo="Serviços pedidos no agendador">
          <Barras itens={r.servicos} vazio="Nenhum pedido de horário no período" />
        </Cartao>
        <Cartao titulo="Páginas mais vistas">
          <Barras itens={r.paginas} />
        </Cartao>
        <Cartao titulo="Horários mais pedidos">
          <Barras itens={r.horasPedidas} vazio="Nenhum pedido de horário no período" />
        </Cartao>
        <Cartao titulo="Aparelho">
          <Barras itens={r.aparelhos} />
        </Cartao>
        <Cartao titulo="Campanhas (UTM)">
          <Barras itens={r.campanhas} vazio="Nenhuma visita com utm_campaign" />
        </Cartao>
      </div>

      <Cartao titulo="Quando os contatos chegam (horário de Goiânia)">
        <Calor grade={r.calor} />
      </Cartao>
    </div>
  )
}

// ── Contatos ────────────────────────────────────────────────────────────────

function PainelContatos({ lista }: { lista: Contato[] }) {
  const [tipo, setTipo] = useState('')
  const visiveis = tipo ? lista.filter((c) => c.tipo === tipo) : lista
  const detalhe = (c: Contato) =>
    c.tipo === 'agendamento'
      ? [c.servico, diaPedido(c.diaPedido), c.horaPedido].filter(Boolean).join(' · ')
      : lugar(c.contexto)
  const csv = () => {
    const linhas = [
      ['Quando', 'Tipo', 'Detalhe', 'Origem', 'Campanha', 'Aparelho', 'Página', 'Primeira visita', 'Visitante'],
      ...visiveis.map((c) => [quando(c.em), TIPO[c.tipo] ?? c.tipo, detalhe(c), c.origem, c.campanha ?? '', c.aparelho, c.pagina, c.novo ? 'sim' : 'não', c.visitante]),
    ]
    const texto = linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'contatos-silverado.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Cartao titulo={`${visiveis.length} registros`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['', 'whatsapp', 'agendamento', 'telefone', 'mapa'].map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`rounded-full border px-3.5 py-1.5 text-xs ${tipo === t ? 'border-steel-300 text-steel-100' : 'border-steel-800 text-steel-500'}`}
          >
            {t ? TIPO[t] : 'Todos'}
          </button>
        ))}
        <button onClick={csv} className="ml-auto rounded-full border border-steel-700 px-3.5 py-1.5 text-xs text-steel-300 hover:text-steel-50">
          Baixar planilha (CSV)
        </button>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-steel-600">
        Cada linha é um clique no site. O nome e o telefone da pessoa chegam pelo WhatsApp da barbearia, não por aqui (o site não guarda dado pessoal).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="font-mono text-[0.6rem] tracking-[0.16em] text-steel-600 uppercase">
            <tr>
              {['Quando', 'Tipo', 'Detalhe', 'Origem', 'Aparelho', 'Página'].map((h) => (
                <th key={h} className="border-b border-steel-900 py-2 pr-4 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((c) => (
              <tr key={c.em} className="border-b border-steel-900/60 text-steel-300">
                <td className="py-2.5 pr-4 whitespace-nowrap tabular-nums">{quando(c.em)}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap text-steel-100">{TIPO[c.tipo] ?? c.tipo}</td>
                <td className="py-2.5 pr-4">{detalhe(c)}</td>
                <td className="py-2.5 pr-4">{c.origem}{c.campanha ? ` · ${c.campanha}` : ''}</td>
                <td className="py-2.5 pr-4">{c.aparelho}</td>
                <td className="py-2.5 pr-4 text-steel-500">{c.pagina}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visiveis.length && <p className="py-8 text-center text-sm text-steel-600">Nenhum contato no período.</p>}
      </div>
    </Cartao>
  )
}

// ── Conta ───────────────────────────────────────────────────────────────────

function PainelConta({ sair }: { sair: () => void }) {
  const [naoContar, setNaoContar] = useState(() => localStorage.getItem(CHAVE_NAO_CONTAR) === '1')
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [msg, setMsg] = useState('')
  const alternar = () => {
    const v = !naoContar
    if (v) localStorage.setItem(CHAVE_NAO_CONTAR, '1')
    else localStorage.removeItem(CHAVE_NAO_CONTAR)
    setNaoContar(v)
  }
  const trocar = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const r = await api.senha(atual, nova)
      token.gravar(r.token)
      setMsg('Senha trocada. As outras sessões foram encerradas.')
      setAtual('')
      setNova('')
    } catch (err) {
      setMsg((err as Error).message === 'senha-curta' ? 'A senha nova precisa de pelo menos 8 caracteres.' : 'Senha atual incorreta.')
    }
  }
  const campo = 'mt-1.5 w-full border border-steel-800 bg-void px-4 py-2.5 text-steel-100 focus:border-steel-400 focus:outline-none'
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Cartao titulo="Este aparelho">
        <p className="text-sm leading-relaxed text-steel-400">
          Seus próprios acessos ao site não devem entrar na conta. Marque em cada aparelho que você (ou a equipe) usa para abrir o site.
        </p>
        <button onClick={alternar} className={`mt-4 rounded-full border px-5 py-2.5 text-sm ${naoContar ? 'border-emerald-500 text-emerald-300' : 'border-steel-700 text-steel-200'}`}>
          {naoContar ? '✓ Este aparelho não é contado' : 'Não contar este aparelho'}
        </button>
      </Cartao>
      <Cartao titulo="Trocar senha">
        <form onSubmit={trocar} className="space-y-3">
          <label className="block text-sm text-steel-400">Senha atual<input type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} className={campo} required /></label>
          <label className="block text-sm text-steel-400">Senha nova (mínimo 8 caracteres)<input type="password" autoComplete="new-password" minLength={8} value={nova} onChange={(e) => setNova(e.target.value)} className={campo} required /></label>
          <button className="rounded-full bg-steel-100 px-5 py-2.5 font-mono text-xs tracking-[0.18em] text-void uppercase">Trocar</button>
          {msg && <p className="text-sm text-steel-300">{msg}</p>}
        </form>
      </Cartao>
      <Cartao titulo="Sessão">
        <button onClick={sair} className="rounded-full border border-steel-700 px-5 py-2.5 text-sm text-steel-200">Sair</button>
      </Cartao>
    </div>
  )
}

// ── Usuários (só admin) ─────────────────────────────────────────────────────

const ERROS_USUARIO: Record<string, string> = {
  existe: 'Já existe um usuário com esse e-mail.',
  email: 'E-mail inválido.',
  'senha-curta': 'A senha precisa de pelo menos 8 caracteres.',
  'si-mesmo': 'Você não pode remover o próprio acesso.',
  permissao: 'Só administradores gerenciam usuários.',
}

function PainelUsuarios({ eu }: { eu: Usuario }) {
  const [lista, setLista] = useState<Usuario[] | null>(null)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [papel, setPapel] = useState<'leitura' | 'admin'>('leitura')
  const [senha, setSenha] = useState('')
  const [aviso, setAviso] = useState<ReactNode>('')

  const recarregar = useCallback(async () => {
    try {
      setLista((await api.usuarios()).usuarios)
    } catch {
      setAviso('Não foi possível carregar os usuários.')
    }
  }, [])
  useEffect(() => {
    const id = setTimeout(recarregar, 0)
    return () => clearTimeout(id)
  }, [recarregar])

  const mostrarSenha = (quem: string, s: string) =>
    setAviso(
      <span>
        Senha de <strong className="text-steel-100">{quem}</strong>:{' '}
        <code className="rounded bg-steel-900 px-2 py-0.5 text-steel-50 select-all">{s}</code>. Copie e envie para a
        pessoa agora: ela não aparece de novo. Dá para trocar depois em Conta.
      </span>,
    )
  const erro = (e: unknown) => setAviso(ERROS_USUARIO[(e as Error).message] ?? 'Não deu certo. Tente de novo.')

  const criar = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const r = await api.criarUsuario({ email, nome, papel, ...(senha ? { senha } : {}) })
      mostrarSenha(r.email, r.senha)
      setEmail('')
      setNome('')
      setSenha('')
      recarregar()
    } catch (err) {
      erro(err)
    }
  }
  const redefinir = async (u: Usuario) => {
    if (!confirm(`Gerar uma senha nova para ${u.email}? A atual deixa de funcionar.`)) return
    try {
      mostrarSenha(u.email, (await api.redefinir(u.email)).senha)
    } catch (err) {
      erro(err)
    }
  }
  const remover = async (u: Usuario) => {
    if (!confirm(`Remover o acesso de ${u.email}?`)) return
    try {
      await api.remover(u.email)
      setAviso(`Acesso de ${u.email} removido.`)
      recarregar()
    } catch (err) {
      erro(err)
    }
  }

  const campo = 'mt-1.5 w-full border border-steel-800 bg-void px-4 py-2.5 text-steel-100 focus:border-steel-400 focus:outline-none'
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Cartao titulo="Quem tem acesso">
        {aviso && <p className="mb-4 rounded-sm border border-steel-800 bg-white/[0.03] p-3 text-sm leading-relaxed text-steel-300">{aviso}</p>}
        {!lista ? (
          <p className="text-steel-500">Carregando…</p>
        ) : (
          <ul className="divide-y divide-steel-900">
            {lista.map((u) => (
              <li key={u.email} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-steel-100">{u.nome || u.email}</p>
                  <p className="truncate text-xs text-steel-500">
                    {u.email} · {u.papel === 'admin' ? 'Administrador' : 'Só leitura'}
                    {u.email === eu.email ? ' · você' : ''}
                  </p>
                </div>
                <button onClick={() => redefinir(u)} className="rounded-full border border-steel-800 px-3 py-1.5 text-xs text-steel-300 hover:text-steel-50">
                  Nova senha
                </button>
                {u.email !== eu.email && (
                  <button onClick={() => remover(u)} className="rounded-full border border-rose-900/70 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200">
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Adicionar usuário">
        <form onSubmit={criar} className="space-y-3">
          <label className="block text-sm text-steel-400">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder="Ex.: Lucas" />
          </label>
          <label className="block text-sm text-steel-400">
            E-mail (é o login)
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
          </label>
          <label className="block text-sm text-steel-400">
            Acesso
            <select value={papel} onChange={(e) => setPapel(e.target.value as 'leitura' | 'admin')} className={campo}>
              <option value="leitura">Só leitura: vê os números</option>
              <option value="admin">Administrador: vê tudo e gerencia usuários</option>
            </select>
          </label>
          <label className="block text-sm text-steel-400">
            Senha (opcional, mínimo 8)
            <input type="text" minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} placeholder="Em branco: o painel gera uma" />
          </label>
          <button className="rounded-full bg-steel-100 px-5 py-2.5 font-mono text-xs tracking-[0.18em] text-void uppercase">Adicionar</button>
        </form>
      </Cartao>
    </div>
  )
}

// ── App ─────────────────────────────────────────────────────────────────────

type Aba = 'resumo' | 'contatos' | 'usuarios' | 'conta'
const NOME_ABA: Record<Aba, string> = { resumo: 'Resumo', contatos: 'Contatos', usuarios: 'Usuários', conta: 'Conta' }

export function Painel() {
  const [logado, setLogado] = useState(() => Boolean(token.ler()))
  const [aba, setAba] = useState<Aba>(() => (location.hash.slice(1) as Aba) || 'resumo')
  const [dias, setDias] = useState(30)
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [contatos, setContatos] = useState<Contato[] | null>(null)
  const [erro, setErro] = useState('')
  const [eu, setEu] = useState<Usuario | null>(null)

  const sair = useCallback(() => {
    token.gravar(null)
    setLogado(false)
  }, [])

  const carregar = useCallback(async () => {
    try {
      if (!eu) setEu(await api.eu())
      if (aba === 'resumo') setResumo(await api.resumo(dias))
      if (aba === 'contatos') setContatos((await api.contatos(dias)).contatos)
      setErro('')
    } catch (e) {
      if (e instanceof SessaoExpirada) setLogado(false)
      else setErro('Não foi possível carregar. Tente de novo em instantes.')
    }
  }, [aba, dias, eu])

  useEffect(() => {
    // Busca fora do corpo do efeito (o setState acontece depois do await).
    if (!logado) return
    const id = setTimeout(carregar, 0)
    return () => clearTimeout(id)
  }, [logado, carregar])

  useEffect(() => {
    history.replaceState(null, '', `#${aba}`)
  }, [aba])

  if (!logado) return <Entrar aoEntrar={() => setLogado(true)} />

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center gap-4 border-b border-steel-900 py-5">
        <img src="/images/logo-wordmark.png" alt="Barbearia Silverado" className="w-32" />
        <nav className="flex gap-1">
          {(['resumo', 'contatos', 'usuarios', 'conta'] as Aba[])
            .filter((a) => a !== 'usuarios' || eu?.papel === 'admin')
            .map((a) => (
              <button key={a} onClick={() => setAba(a)} className={`rounded-full px-4 py-2 text-sm ${aba === a ? 'bg-steel-100 text-void' : 'text-steel-400 hover:text-steel-100'}`}>
                {NOME_ABA[a]}
              </button>
            ))}
        </nav>
        {(aba === 'resumo' || aba === 'contatos') && (
          <div className="ml-auto flex gap-1">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDias(d)} className={`rounded-full border px-3.5 py-1.5 text-xs ${dias === d ? 'border-steel-300 text-steel-100' : 'border-steel-800 text-steel-500'}`}>
                {d} dias
              </button>
            ))}
            <button onClick={carregar} className="rounded-full border border-steel-800 px-3.5 py-1.5 text-xs text-steel-400" title="Atualizar">↻</button>
          </div>
        )}
      </header>
      <main className="pt-6">
        {erro && <p className="mb-4 text-sm text-rose-400">{erro}</p>}
        {aba === 'resumo' && (resumo ? <PainelResumo r={resumo} /> : <p className="text-steel-500">Carregando…</p>)}
        {aba === 'contatos' && (contatos ? <PainelContatos lista={contatos} /> : <p className="text-steel-500">Carregando…</p>)}
        {aba === 'usuarios' && eu?.papel === 'admin' && <PainelUsuarios eu={eu} />}
        {aba === 'conta' && <PainelConta sair={sair} />}
      </main>
      <footer className="mt-12 text-xs text-steel-700">
        Dados anônimos coletados pelo próprio site. Robôs e aparelhos marcados como “não contar” ficam de fora.
      </footer>
    </div>
  )
}

