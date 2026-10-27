import { useEffect, useRef } from 'react'
import { type Ancora, CenaMarca, type Pose } from '@/scene/marca'

/**
 * A navalha-S em 3D, fixa atrás do conteúdo da home (ver scene/marca.ts).
 *
 * Cada seção tem uma pose. No desktop a peça corre pelas laterais, onde não há
 * texto; no celular fica atrás do conteúdo, bem discreta, e só aparece inteira
 * na abertura e no fecho. Onde a seção tem um "pouso" (`data-marca-alvo`), a
 * peça se encaixa exatamente ali.
 *
 * Só depende de WebGL: com "reduzir movimento" ligado (muito Windows vem assim
 * sem a pessoa saber), roda no modo calmo, sem nada se mexendo sozinho.
 */

const P = (x: number, y: number, s: number, ry: number, op: number, extra: Partial<Pose> = {}): Pose => ({
  x,
  y,
  s,
  rx: 0.06,
  ry,
  rz: 0,
  op,
  abre: 0,
  ...extra,
})

const VOLTA = Math.PI * 2

/**
 * No celular, entre a abertura e o fecho, a peça vira um emblema pequeno no
 * canto de cima, girando com a rolagem: acompanha a página sem passar por
 * trás do texto (que ocupa a largura toda).
 */
const canto = (voltas: number) => P(0.72, 0.73, 0.1, VOLTA * voltas, 0.9, { rx: 0.1 })

/** id da seção → pose no desktop e no celular. A ordem é a da página. */
const POSES: [string, Pose, Pose][] = [
  ['inicio', P(0.52, 0, 0.66, -0.35, 1, { rx: 0.12 }), P(0.62, 0.63, 0.15, -0.3, 1, { rx: 0.1 })],
  // A peça vai para o centro e some exatamente onde o recorte do portal abre.
  ['portal', P(0, 0, 0.46, 0, 0, { rx: 0 }), P(0, 0, 0.29, 0, 0, { rx: 0 })],
  ['manifesto', P(0.74, -0.05, 0.42, VOLTA * 0.3, 0.5, { rz: 0.12 }), canto(0.5)],
  ['numeros', P(-0.74, 0.1, 0.4, VOLTA * 0.55, 0.42), canto(1)],
  // Seções com grade de cartões na largura toda: a peça só espia pela borda.
  ['servicos', P(0.98, -0.05, 0.6, VOLTA * 0.85, 0.22, { rz: -0.2 }), canto(1.5)],
  ['agendar', P(-0.82, 0, 0.55, VOLTA * 1.15, 0.3), canto(2)],
  ['cortes', P(0, 0.9, 0.3, VOLTA * 1.4, 0), canto(2.5)],
  ['depoimentos', P(0.95, 0.15, 0.5, VOLTA * 1.7, 0.36), canto(3)],
  ['loja', P(0.98, -0.1, 0.55, VOLTA * 2, 0.22), canto(3.5)],
  ['duvidas', P(0.8, 0, 0.55, VOLTA * 2.3, 0.32), canto(4)],
  ['localizacao', P(0.86, 0.1, 0.45, VOLTA * 2.6, 0.3, { abre: 0.2 }), canto(4.5)],
  // O fecho tem pouso: x/y/s vêm do elemento `data-marca-alvo="fecho"`.
  ['fecho', P(0, 0.3, 0.3, VOLTA * 3, 1, { rx: 0 }), P(0, 0.3, 0.3, VOLTA * 5, 1, { rx: 0 })],
]

function temWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function MarcaFixa() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !temWebGL()) return
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cena: CenaMarca
    try {
      cena = new CenaMarca(canvas, { compacto: !desktop, calmo })
    } catch {
      return
    }
    document.documentElement.classList.add('marca-3d')

    const ancoras: Ancora[] = []
    for (const [id, pd, pc] of POSES) {
      const el = document.getElementById(id)
      if (!el) continue
      const alvo = document.querySelector<HTMLElement>(`[data-marca-alvo="${id}"]`)
      ancoras.push({
        el,
        pose: desktop ? pd : pc,
        // O alvo só vale se estiver visível (o do herói é só desktop).
        alvo: alvo && alvo.offsetWidth > 0 ? alvo : undefined,
      })
    }
    cena.definirAncoras(ancoras)
    cena.iniciar()
    // Fontes e imagens mudam a altura das seções depois da primeira medida.
    const remedir = () => cena.medir()
    document.fonts?.ready.then(remedir)
    window.addEventListener('load', remedir)

    return () => {
      window.removeEventListener('load', remedir)
      document.documentElement.classList.remove('marca-3d')
      cena.dispose()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  )
}
