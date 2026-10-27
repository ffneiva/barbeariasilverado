import { useEffect, useRef } from 'react'
import { Picture } from '@/components/Picture'
import contorno from '@/lib/navalha-contorno.json'

/**
 * O "portal": logo depois do herói, a tela escurece e a navalha-S da marca
 * vira um recorte que mostra a barbearia lá dentro. A rolagem dá zoom no
 * recorte (em volta do ponto mais grosso do traço) até a pessoa "atravessar"
 * a marca e estar na cadeira.
 *
 * Leve de propósito: um canvas 2D por cima da foto, redesenhado só quando a
 * seção está na tela e a rolagem muda. Posições medidas no resize; por quadro,
 * só o scrollY guardado no evento. Sem JavaScript (ou antes de ele chegar), a
 * foto aparece inteira.
 */

const FRASES = ['Você chega com a referência.', 'A gente escuta antes de ligar a máquina.', 'E você sai com o corte que pediu.']

/** O contorno da logo como Path2D, centrado em (0,0), altura 1, y para baixo. */
function caminho(): Path2D {
  const p = new Path2D()
  const anel = (pts: number[][]) => {
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, -y) : p.moveTo(x, -y)))
    p.closePath()
  }
  anel(contorno.contorno)
  anel(contorno.furo)
  return p
}

const suave = (t: number) => t * t * (3 - 2 * t)
const faixa = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)))

export function Portal() {
  const secao = useRef<HTMLElement>(null)
  const tela = useRef<HTMLCanvasElement>(null)
  const frases = useRef<(HTMLParagraphElement | null)[]>([])
  const convite = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = secao.current
    const canvas = tela.current
    const ctx = canvas?.getContext('2d')
    if (!el || !canvas || !ctx) return
    const forma = caminho()
    const [mx, my] = contorno.miolo
    let topo = 0
    let curso = 1
    let w = 1
    let h = 1
    let y = window.scrollY
    let raf = 0
    let ultimo = -1

    const medir = () => {
      const r = el.getBoundingClientRect()
      topo = r.top + window.scrollY
      curso = Math.max(1, r.height - window.innerHeight)
      // Realoca o canvas só quando a tela muda (não quando a página cresce).
      if (w !== window.innerWidth || h !== window.innerHeight) {
        w = window.innerWidth
        h = window.innerHeight
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      ultimo = -1
      pedir()
    }

    const desenhar = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, (y - topo) / curso))
      if (p === ultimo) return
      ultimo = p
      // 0–0,12: a marca parada; 0,12–0,78: o zoom atravessa; depois, a foto.
      const z = suave(faixa(p, 0.12, 0.78))
      const base = Math.min(h * 0.46, w * 0.62)
      const escala = base * (1 + z * z * 46)
      // O ponto mais grosso do traço vai para o centro durante o zoom.
      const cx = w / 2 - mx * escala * z
      const cy = h / 2 + my * escala * z

      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, w, h)
      if (z < 1) {
        ctx.fillStyle = '#030304'
        ctx.globalAlpha = 1
        ctx.fillRect(0, 0, w, h)
        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(escala, escala)
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fill(forma, 'evenodd')
        // Fio cromado em volta do recorte, enquanto ele ainda é pequeno.
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = Math.max(0, 1 - z * 4)
        ctx.lineWidth = 1.4 / escala
        ctx.strokeStyle = '#d3d7de'
        ctx.stroke(forma)
        ctx.restore()
      }

      // As frases entram em sequência; o convite final fica sobre a foto.
      frases.current.forEach((f, i) => {
        if (!f) return
        // Uma frase por vez: a próxima só entra depois que a anterior saiu.
        const s = 0.06 + i * 0.24
        const a = faixa(p, s, s + 0.06) * (1 - faixa(p, s + 0.16, s + 0.22))
        f.style.opacity = String(a)
        f.style.transform = `translate3d(0, ${(1 - a) * 18}px, 0)`
      })
      const c = convite.current
      if (c) {
        const a = faixa(p, 0.8, 0.92)
        c.style.opacity = String(a)
        c.style.transform = `translate3d(0, ${(1 - a) * 24}px, 0)`
      }
    }

    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(desenhar)
    }
    const aoRolar = () => {
      y = window.scrollY
      // Fora da seção, nada a redesenhar.
      if (y > topo - h && y < topo + curso + h) pedir()
    }

    let lote = 0
    const ro = new ResizeObserver(() => {
      clearTimeout(lote)
      lote = window.setTimeout(medir, 120)
    })
    ro.observe(document.documentElement)
    window.addEventListener('scroll', aoRolar, { passive: true })
    medir()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      clearTimeout(lote)
      window.removeEventListener('scroll', aoRolar)
    }
  }, [])

  return (
    <section ref={secao} id="portal" aria-label="A barbearia por dentro" className="relative h-[280vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Picture
          name="hero-shop"
          alt="Barbeiro e cliente na cadeira da Barbearia Silverado"
          className="absolute inset-0 h-full w-full"
          sizes="100vw"
        />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-void/85 via-void/10 to-void/30" />
        <canvas ref={tela} aria-hidden className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none absolute inset-x-0 bottom-[12%] container-x text-center">
          {FRASES.map((f, i) => (
            <p
              key={f}
              ref={(n) => {
                frases.current[i] = n
              }}
              className="absolute inset-x-0 font-display text-[clamp(1.9rem,5vw,3.4rem)] leading-none text-steel-100 uppercase opacity-0"
            >
              {f}
            </p>
          ))}
        </div>

        <div
          ref={convite}
          className="absolute inset-x-0 bottom-[10%] container-x flex flex-col items-center gap-3 text-center opacity-0"
        >
          <span className="label-mono text-steel-300">Av. C-4, 73 · Jardim América</span>
          <p className="font-display text-[clamp(2.4rem,7vw,5rem)] leading-[0.9] text-steel-50 uppercase">
            Puxa a cadeira
          </p>
        </div>
      </div>
    </section>
  )
}
