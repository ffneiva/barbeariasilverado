import { ArrowRight, Clock, MapPin, MessageCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { PageHero } from '@/components/PageHero'
import { Picture } from '@/components/Picture'
import { Reveal } from '@/components/Reveal'
import { BUSINESS, CUTS, SERVICES, whatsappUrl } from '@/lib/business'
import { cutMessage } from '@/lib/booking'
import {
  PAGINAS_CORTE,
  PAGINAS_SERVICO,
  PERGUNTAS_GERAIS,
  type Pergunta,
  precoTexto,
} from '@/lib/paginas'

/**
 * As páginas de conteúdo: serviços, cortes e perguntas frequentes.
 *
 * Existem para a busca: cada serviço e cada corte tem uma URL própria que
 * responde direto o que se pergunta ao Google e às IAs (preço, tempo, onde,
 * horário). Os links são `<a href>` de verdade (o App intercepta e navega sem
 * recarregar), para que robôs sigam a estrutura do site.
 */

const cls = {
  secao: 'pb-16 sm:pb-24',
  link: 'text-steel-200 underline decoration-steel-700 underline-offset-4 transition-colors hover:text-steel-50 hover:decoration-steel-300',
}

/** Perguntas abertas (sem sanfona): o texto visível é o que as IAs citam. */
function Respostas({ itens, titulo = 'Perguntas frequentes' }: { itens: Pergunta[]; titulo?: string }) {
  return (
    <section className={cls.secao} aria-labelledby="perguntas">
      <div className="container-x">
        <h2 id="perguntas" className="text-3xl text-steel-100 sm:text-4xl">
          {titulo}
        </h2>
        <dl className="mt-8 divide-y divide-steel-900 border-y border-steel-900">
          {itens.map((p) => (
            <div key={p.q} className="grid gap-2 py-6 sm:grid-cols-[0.9fr_1.1fr] sm:gap-10">
              <dt className="text-base font-medium text-steel-100 sm:text-lg">{p.q}</dt>
              <dd className="text-sm leading-relaxed text-steel-400 sm:text-base">{p.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Chamada({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button href={whatsappUrl(mensagem)} size="lg" magnetic={false}>
        <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
        Chamar no WhatsApp
      </Button>
      <Button href="/agendar" variant="outline" size="lg" magnetic={false} external={false}>
        Escolher dia e horário
      </Button>
    </div>
  )
}

function Trilha({ itens }: { itens: [string, string?][] }) {
  return (
    <nav aria-label="Você está em" className="container-x pt-28 sm:pt-32">
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-steel-600 uppercase">
        {itens.map(([nome, href], i) => (
          <li key={nome} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {href ? (
              <a href={href} className="transition-colors hover:text-steel-200">
                {nome}
              </a>
            ) : (
              <span className="text-steel-400">{nome}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ── Serviços ────────────────────────────────────────────────────────────────

export function Servicos() {
  return (
    <main id="conteudo">
      <Trilha itens={[['Início', '/'], ['Serviços']]} />
      <PageHero
        compacto
        eyebrow="Barbearia Silverado · Jardim América, Goiânia"
        title="Serviços e preços"
        lead="A tabela da parede, com preço fechado. Selagem e botox variam com o comprimento do cabelo, e o valor é combinado antes de começar."
      >
        <Chamada mensagem="Olá! Queria agendar um horário na Silverado." />
      </PageHero>
      <section className={cls.secao}>
        <ul className="container-x grid gap-px border border-steel-900 bg-steel-900 sm:grid-cols-2 lg:grid-cols-3">
          {PAGINAS_SERVICO.map(({ servico: s, path }) => (
            <li key={s.id} className="bg-void">
              <a href={path} className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-white/[0.03] sm:p-7">
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-2xl text-steel-100 uppercase">{s.name}</span>
                  <span className="font-display text-xl whitespace-nowrap text-steel-300">{precoTexto(s)}</span>
                </span>
                <span className="text-sm leading-relaxed text-steel-400">{s.description}</span>
                <span className="mt-auto flex items-center justify-between pt-2 font-mono text-[0.65rem] tracking-[0.2em] text-steel-600 uppercase">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" strokeWidth={1.5} /> {s.minutes} min
                  </span>
                  <span className="flex items-center gap-1.5 transition-colors group-hover:text-steel-200">
                    Ver detalhes <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <Respostas itens={PERGUNTAS_GERAIS.slice(-3)} titulo="Antes de vir" />
    </main>
  )
}

export function Servico({ path }: { path: string }) {
  const p = PAGINAS_SERVICO.find((x) => x.path === path)
  if (!p) return null
  const s = p.servico
  return (
    <main id="conteudo">
      <Trilha itens={[['Início', '/'], ['Serviços', '/servicos'], [s.name]]} />
      <PageHero compacto eyebrow={`${BUSINESS.shortName} · ${BUSINESS.address.district}, Goiânia`} title={p.h1} lead={s.description}>
        <dl className="mb-8 flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <dt className="label-mono">Preço</dt>
            <dd className="mt-1 font-display text-4xl text-steel-100">{precoTexto(s)}</dd>
          </div>
          <div>
            <dt className="label-mono">Duração média</dt>
            <dd className="mt-1 font-display text-4xl text-steel-100">{s.minutes} min</dd>
          </div>
        </dl>
        <Chamada mensagem={`Olá! Queria agendar ${s.name.toLowerCase()} na Silverado.`} />
      </PageHero>

      <section className={cls.secao}>
        <div className="container-x grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <Reveal>
            <h2 className="text-3xl text-steel-100 sm:text-4xl">Como é feito</h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-steel-300">{p.detalhe}</p>
            {s.id === 'corte' && (
              <p className="mt-5 max-w-2xl leading-relaxed text-steel-400">
                Modelos mais pedidos:{' '}
                {CUTS.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ', '}
                    <a href={`/cortes/${c.id}`} className={cls.link}>
                      {c.name}
                    </a>
                  </span>
                ))}
                .
              </p>
            )}
          </Reveal>
          <Reveal delay={0.1} className="border border-steel-900 p-6">
            <span className="label-mono">Endereço</span>
            <p className="mt-3 flex gap-2.5 text-sm leading-relaxed text-steel-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>
                {BUSINESS.address.street}
                <br />
                {BUSINESS.address.district}, {BUSINESS.address.city}/{BUSINESS.address.state}
              </span>
            </p>
            <a href={BUSINESS.mapsLink} target="_blank" rel="noopener noreferrer" className={`mt-4 inline-block text-sm ${cls.link}`}>
              Abrir no Google Maps
            </a>
          </Reveal>
        </div>
      </section>

      <Respostas itens={p.perguntas} />

      {p.relacionados.length > 0 && (
        <section className={cls.secao}>
          <div className="container-x">
            <h2 className="text-2xl text-steel-100 sm:text-3xl">Também na Silverado</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {p.relacionados.map((o) => (
                <li key={o.id}>
                  <a
                    href={`/servicos/${o.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-steel-800 px-5 py-2.5 text-sm text-steel-300 transition-colors hover:border-steel-500 hover:text-steel-100"
                  >
                    {o.name} · {precoTexto(o)}
                  </a>
                </li>
              ))}
              <li>
                <a href="/servicos" className="inline-flex px-2 py-2.5 text-sm text-steel-500 transition-colors hover:text-steel-200">
                  Todos os serviços →
                </a>
              </li>
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}

// ── Cortes ──────────────────────────────────────────────────────────────────

export function Cortes() {
  return (
    <main id="conteudo">
      <Trilha itens={[['Início', '/'], ['Cortes']]} />
      <PageHero
        compacto
        eyebrow="Barbearia Silverado · Jardim América, Goiânia"
        title="Cortes masculinos"
        lead={`Os modelos mais pedidos na casa. Qualquer um deles sai pelo preço do corte, ${precoTexto(SERVICES[0])}, com o contorno terminado na navalha.`}
      >
        <Chamada mensagem="Olá! Queria agendar um corte na Silverado." />
      </PageHero>
      <section className={cls.secao}>
        <ul className="container-x grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PAGINAS_CORTE.map(({ corte: c, path }) => (
            <li key={c.id}>
              <a href={path} className="group block">
                <div className="relative aspect-3/4 overflow-hidden bg-steel-900">
                  <Picture
                    name={c.image}
                    alt={`Corte ${c.name} feito na Barbearia Silverado`}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <h2 className="mt-4 text-2xl text-steel-100">{c.name}</h2>
                <p className="mt-1 text-sm leading-relaxed text-steel-400">{c.blurb}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export function Corte({ path }: { path: string }) {
  const p = PAGINAS_CORTE.find((x) => x.path === path)
  if (!p) return null
  const c = p.corte
  return (
    <main id="conteudo">
      <Trilha itens={[['Início', '/'], ['Cortes', '/cortes'], [c.name]]} />
      <PageHero compacto eyebrow={`${c.family} · ${BUSINESS.shortName}, Goiânia`} title={p.h1} lead={c.blurb} showStatus={false}>
        <Chamada mensagem={cutMessage(c.name)} />
      </PageHero>
      <section className={cls.secao}>
        <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
          <div className="relative aspect-3/4 overflow-hidden bg-steel-900">
            <Picture
              name={c.image}
              alt={`Corte ${c.name} feito na Barbearia Silverado, Jardim América, Goiânia`}
              className="h-full w-full"
              sizes="(min-width: 1024px) 45vw, 100vw"
              priority
            />
          </div>
          <div>
            <h2 className="text-3xl text-steel-100 sm:text-4xl">Como pedir o {c.name}</h2>
            <p className="mt-5 leading-relaxed text-steel-300">
              Traga uma foto de referência ou só a ideia. O barbeiro olha o formato do rosto, o tipo de cabelo e
              quanto você quer manter antes de começar, e termina o contorno e a nuca na navalha. Preço do corte:{' '}
              <a href="/servicos/corte" className={cls.link}>
                {precoTexto(SERVICES[0])}
              </a>
              .
            </p>
            <h2 className="mt-12 text-2xl text-steel-100">Outros cortes</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {CUTS.filter((o) => o.id !== c.id).map((o) => (
                <li key={o.id}>
                  <a
                    href={`/cortes/${o.id}`}
                    className="inline-flex rounded-full border border-steel-800 px-4 py-2 text-sm text-steel-300 transition-colors hover:border-steel-500 hover:text-steel-100"
                  >
                    {o.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <Respostas itens={p.perguntas} />
    </main>
  )
}

// ── Perguntas ───────────────────────────────────────────────────────────────

export function Perguntas() {
  return (
    <main id="conteudo">
      <Trilha itens={[['Início', '/'], ['Perguntas frequentes']]} />
      <PageHero
        compacto
        eyebrow="Barbearia Silverado · Jardim América, Goiânia"
        title="Perguntas frequentes"
        lead="Preço, horário, agendamento, pagamento e o que a casa faz (e não faz), em respostas curtas."
      >
        <Chamada mensagem="Olá! Tenho uma dúvida sobre a Silverado." />
      </PageHero>
      <Respostas itens={PERGUNTAS_GERAIS} titulo="Respostas" />
      <section className={cls.secao}>
        <p className="container-x text-sm text-steel-500">
          Veja também a <a href="/servicos" className={cls.link}>tabela de serviços</a> e os{' '}
          <a href="/cortes" className={cls.link}>modelos de corte</a>.
        </p>
      </section>
    </main>
  )
}
