import type { Item } from './api'

/** Gráficos do painel em SVG/CSS, sem biblioteca. Números sempre visíveis. */

export function Barras({ itens, vazio = 'Sem dados no período', max = 8 }: { itens: Item[]; vazio?: string; max?: number }) {
  if (!itens.length) return <p className="py-6 text-sm text-steel-600">{vazio}</p>
  const topo = Math.max(...itens.map((i) => i.total))
  return (
    <ul className="space-y-2.5">
      {itens.slice(0, max).map((i) => (
        <li key={i.nome}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-steel-300">{i.nome}</span>
            <span className="font-mono text-steel-100 tabular-nums">{i.total}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-steel-900">
            <div className="h-full rounded-full bg-steel-300" style={{ width: `${(i.total / topo) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Série diária: colunas = pessoas no site; marcas claras = contatos. */
export function Serie({ dados }: { dados: { dia: string; visitantes: number; contatos: number }[] }) {
  const topo = Math.max(1, ...dados.map((d) => d.visitantes), ...dados.map((d) => d.contatos))
  const L = 100 / dados.length
  const rotulo = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
  const passo = Math.ceil(dados.length / 10)
  return (
    <figure>
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="h-48 w-full" role="img" aria-label="Pessoas no site e contatos por dia">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2="100" y1={40 - f * 38} y2={40 - f * 38} stroke="#212227" strokeWidth="0.15" />
        ))}
        {dados.map((d, i) => (
          <g key={d.dia}>
            <rect x={i * L + L * 0.15} width={L * 0.7} y={40 - (d.visitantes / topo) * 38} height={(d.visitantes / topo) * 38} fill="#35383f">
              <title>{`${rotulo(d.dia)}: ${d.visitantes} pessoas, ${d.contatos} contatos`}</title>
            </rect>
            {d.contatos > 0 && (
              <rect x={i * L + L * 0.3} width={L * 0.4} y={40 - (d.contatos / topo) * 38} height={(d.contatos / topo) * 38} fill="#e9ebef" />
            )}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-steel-600">
        {dados.filter((_, i) => i % passo === 0).map((d) => (
          <span key={d.dia}>{rotulo(d.dia)}</span>
        ))}
      </div>
      <figcaption className="mt-3 flex gap-5 text-xs text-steel-500">
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-steel-700" /> Pessoas no site</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-steel-100" /> Contatos</span>
      </figcaption>
    </figure>
  )
}

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Quando os contatos chegam: dia da semana × hora (horário de Goiânia). */
export function Calor({ grade }: { grade: number[][] }) {
  const topo = Math.max(1, ...grade.flat())
  const horas = Array.from({ length: 17 }, (_, i) => i + 6) // 6h às 22h
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-[3px] text-[0.6rem]">
        <thead>
          <tr>
            <th />
            {horas.map((h) => (
              <th key={h} className="font-mono font-normal text-steel-600">{h % 3 === 0 ? `${h}h` : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grade.map((linha, d) => (
            <tr key={SEMANA[d]}>
              <th className="pr-1 text-left font-mono font-normal text-steel-500">{SEMANA[d]}</th>
              {horas.map((h) => (
                <td
                  key={h}
                  title={`${SEMANA[d]} ${h}h: ${linha[h]} contato(s)`}
                  className="h-5 min-w-4 rounded-[2px]"
                  style={{ background: linha[h] ? `rgba(233,235,239,${0.15 + (linha[h] / topo) * 0.85})` : '#131418' }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
