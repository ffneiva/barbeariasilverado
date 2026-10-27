import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshMatcapMaterial,
  Path,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Shape,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three'
import contorno from '@/lib/navalha-contorno.json'

/**
 * A navalha-S da marca em cromo, acompanhando a página.
 *
 * O contorno é o da logo oficial (extraído do wordmark em 2112 px, ver
 * lib/navalha-contorno.json), extrudado em LÂMINAS que se juntam: na abertura,
 * as lâminas chegam separadas e se fecham numa peça só; no fecho da página,
 * abrem e se fecham de novo. Um ponto de luz corre pelo contorno.
 *
 * Uma cena só, fixa atrás do conteúdo. Cada seção da home tem uma POSE (onde a
 * peça fica, tamanho, giro); a rolagem interpola entre elas. Desempenho:
 * as posições das seções são medidas só no resize; a cada quadro só se lê o
 * scrollY guardado no evento e se escreve no próprio canvas.
 */

export type Pose = {
  /** Centro na tela, de -1 (esquerda/baixo) a 1 (direita/cima). */
  x: number
  y: number
  /** Altura da peça como fração da altura da tela. */
  s: number
  rx: number
  ry: number
  rz: number
  /** Opacidade da peça (atrás de texto, fica discreta). */
  op: number
  /** 0 = peça fechada; 1 = lâminas abertas. */
  abre: number
}

export type Ancora = {
  el: HTMLElement
  pose: Pose
  /** Se presente, x/y/s saem deste elemento (onde a peça "pousa"). */
  alvo?: HTMLElement
}

type Medida = { chave: number; pose: Pose }

const LAMINAS = 5
const PROFUNDIDADE = 0.2
const VAZIO: Pose = { x: 0, y: 0, s: 0.5, rx: 0, ry: 0, rz: 0, op: 0, abre: 0 }

const suave = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * O degradê cromado da logo 2D (components/Logo.tsx, CHROME_GRADIENT), como
 * textura da FACE da peça. Face reta de metal reflete uma cor só; com o
 * degradê, a peça 3D tem o mesmo brilho da marca e o ambiente soma o reflexo.
 */
function cromado(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const a = (168 * Math.PI) / 180
  const dx = Math.sin(a) * 128
  const dy = -Math.cos(a) * 128
  const d = g.createLinearGradient(128 - dx, 128 - dy, 128 + dx, 128 + dy)
  const paradas: [number, string][] = [
    [0, '#ffffff'], [0.14, '#d6dae1'], [0.32, '#7e848f'], [0.46, '#ffffff'],
    [0.58, '#6d7380'], [0.76, '#c9ced7'], [0.92, '#ffffff'], [1, '#9aa0aa'],
  ]
  for (const [p, cor] of paradas) d.addColorStop(p, cor)
  g.fillStyle = d
  g.fillRect(0, 0, 256, 256)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  // A UV da face é a própria coordenada do contorno (-0,5 a 0,5).
  t.offset.set(0.5, 0.5)
  return t
}

/**
 * Matcap de cromo: o reflexo de estúdio já "cozido" numa esfera de 256 px.
 * Para uma logo de metal dá o mesmo efeito de um mapa de ambiente, sem luz
 * nem PMREM (que custava ~1,8 s de tarefa no carregamento com CPU 4×).
 */
function matcapCromo(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.beginPath()
  g.arc(128, 128, 128, 0, Math.PI * 2)
  g.clip()
  // Horizonte: céu claro em cima, chão escuro embaixo, como cromo de verdade.
  const ceu = g.createLinearGradient(0, 0, 0, 256)
  // O centro (face virada para a câmera) precisa ser cromo CLARO: o horizonte
  // escuro fica abaixo do meio e só aparece quando a peça inclina.
  ceu.addColorStop(0, '#ffffff')
  ceu.addColorStop(0.35, '#dfe3e9')
  ceu.addColorStop(0.58, '#aab1bc')
  ceu.addColorStop(0.68, '#30343b')
  ceu.addColorStop(0.78, '#5a606a')
  ceu.addColorStop(1, '#121317')
  g.fillStyle = ceu
  g.fillRect(0, 0, 256, 256)
  const luz = (x: number, y: number, r: number, a: number) => {
    const d = g.createRadialGradient(x, y, 0, x, y, r)
    d.addColorStop(0, `rgba(255,255,255,${a})`)
    d.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = d
    g.fillRect(0, 0, 256, 256)
  }
  luz(84, 70, 70, 0.95) // luz principal
  luz(196, 110, 46, 0.5) // recorte
  luz(128, 230, 60, 0.25) // rebote de baixo
  // Borda escura: dá volume aos chanfros.
  const borda = g.createRadialGradient(128, 128, 96, 128, 128, 128)
  borda.addColorStop(0, 'rgba(0,0,0,0)')
  borda.addColorStop(1, 'rgba(0,0,0,0.55)')
  g.fillStyle = borda
  g.fillRect(0, 0, 256, 256)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

function formato(): Shape {
  const s = new Shape(contorno.contorno.map(([x, y]) => new Vector2(x, y)))
  s.holes.push(new Path(contorno.furo.map(([x, y]) => new Vector2(x, y)).reverse()))
  return s
}

/** Pontos ao longo do contorno, com a posição (0–1) no perímetro. */
function pontosDoContorno(qtd: number) {
  const pts = contorno.contorno
  const seg: number[] = []
  let total = 0
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[(i + 1) % pts.length]
    const d = Math.hypot(bx - ax, by - ay)
    seg.push(d)
    total += d
  }
  const pos = new Float32Array(qtd * 3)
  const t = new Float32Array(qtd)
  let i = 0
  let acum = 0
  for (let k = 0; k < qtd; k++) {
    const alvo = (k / qtd) * total
    while (acum + seg[i] < alvo) acum += seg[i++]
    const f = (alvo - acum) / seg[i]
    const [ax, ay] = pts[i]
    const [bx, by] = pts[(i + 1) % pts.length]
    pos[k * 3] = lerp(ax, bx, f)
    pos[k * 3 + 1] = lerp(ay, by, f)
    pos[k * 3 + 2] = 0
    t[k] = k / qtd
  }
  return { pos, t }
}

export class CenaMarca {
  private renderer: WebGLRenderer
  private cena = new Scene()
  private camera = new PerspectiveCamera(30, 1, 0.1, 50)
  private peca = new Group()
  private laminas: Mesh[] = []
  private material: MeshMatcapMaterial
  private lateral: MeshMatcapMaterial
  private luzFio: ShaderMaterial
  private ancoras: Ancora[] = []
  private medidas: Medida[] = []
  private largura = 1
  private altura = 1
  private meiaAltura = 1
  private scrollY = 0
  private ponteiro = { x: 0, y: 0, ix: 0, iy: 0 }
  private atual: Pose = { ...VAZIO }
  private inicio = performance.now()
  private montagem = 0
  private flashEm = -10
  private ultimaChave = -1
  private raf = 0
  private ativo = false
  private quadro = 0
  private paradoDesde = 0
  private ro: ResizeObserver
  private medirAgendado = 0
  private canvas: HTMLCanvasElement
  private opCanvas = -1
  /** Quanto a peça ainda falta andar até a pose da rolagem. */
  private falta = 1
  private opts: { compacto: boolean; calmo: boolean }

  constructor(canvas: HTMLCanvasElement, opts: { compacto: boolean; calmo: boolean }) {
    this.opts = opts
    this.canvas = canvas
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !opts.compacto,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.camera.position.set(0, 0, 6)

    const matcap = matcapCromo()
    // Face: matcap × o degradê cromado da logo 2D. Laterais: só o matcap.
    // Opacos: a transparência fica no CANVAS (ver quadroAnimacao). Por lâmina,
    // as 5 camadas somavam e 30% virava ~80%.
    this.material = new MeshMatcapMaterial({ matcap, map: cromado() })
    this.lateral = new MeshMatcapMaterial({ matcap, color: new Color('#c3c8d0') })

    // Lâminas: mesma silhueta, fatiada na profundidade.
    const fatia = PROFUNDIDADE / LAMINAS
    const geo = new ExtrudeGeometry(formato(), {
      depth: fatia * 0.82,
      bevelEnabled: true,
      bevelThickness: fatia * 0.09,
      bevelSize: 0.0045,
      bevelSegments: opts.compacto ? 1 : 2,
      curveSegments: 4,
    })
    geo.translate(0, 0, -fatia * 0.41)
    for (let i = 0; i < LAMINAS; i++) {
      const m = new Mesh(geo, [this.material, this.lateral])
      m.userData.z = (i - (LAMINAS - 1) / 2) * fatia
      this.laminas.push(m)
      this.peca.add(m)
    }

    // O pino da navalha, atravessando as lâminas.
    const pino = new Mesh(
      new CylinderGeometry(0.019, 0.019, PROFUNDIDADE * 1.3, 20),
      new MeshMatcapMaterial({ matcap, color: '#8d939c' }),
    )
    pino.rotation.x = Math.PI / 2
    pino.position.set(contorno.pivo[0], contorno.pivo[1], 0)
    this.peca.add(pino)

    // Luz que corre pelo contorno, na face da frente.
    const { pos, t } = pontosDoContorno(opts.compacto ? 260 : 420)
    const fio = new BufferGeometry()
    fio.setAttribute('position', new BufferAttribute(pos, 3))
    fio.setAttribute('t', new BufferAttribute(t, 1))
    this.luzFio = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        cabeca: { value: 0 },
        forca: { value: 0 },
        tamanho: { value: 5 },
        z: { value: PROFUNDIDADE / 2 + 0.004 },
      },
      vertexShader: /* glsl */ `
        attribute float t;
        uniform float cabeca, tamanho, z;
        varying float vLuz;
        void main() {
          float d = fract(cabeca - t);          // distância atrás da cabeça
          vLuz = exp(-d * 9.0) + 0.9 * exp(-fract(t - cabeca) * 60.0);
          vec4 mv = modelViewMatrix * vec4(position.xy, z, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(2.5, tamanho * (0.45 + vLuz) * (6.0 / -mv.z));
        }`,
      fragmentShader: /* glsl */ `
        uniform float forca;
        varying float vLuz;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r = length(c);
          if (r > 0.5) discard;
          float disco = smoothstep(0.5, 0.18, r);
          gl_FragColor = vec4(vec3(1.0, 0.97, 0.92) * vLuz * forca * disco, 1.0);
        }`,
    })
    this.peca.add(new Points(fio, this.luzFio))

    this.cena.add(this.peca)

    // Em lote: várias mudanças de altura seguidas viram uma medida só.
    this.ro = new ResizeObserver(() => {
      clearTimeout(this.medirAgendado)
      this.medirAgendado = window.setTimeout(this.medir, 120)
    })
    this.ro.observe(document.documentElement)
    window.addEventListener('scroll', this.aoRolar, { passive: true })
    window.addEventListener('pointermove', this.aoMover, { passive: true })
    document.addEventListener('visibilitychange', this.aoVisibilidade)
    this.scrollY = window.scrollY
  }

  definirAncoras(ancoras: Ancora[]) {
    this.ancoras = ancoras
    this.medir()
  }

  /** Mede tela e seções. Só no resize: nada disso roda por quadro. */
  medir = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    // O canvas só é realocado quando a TELA muda. O observador também dispara
    // quando a página cresce (imagens, barra do navegador no celular), e
    // realocar a cada vez custava quadros no meio da rolagem.
    if (w !== this.largura || h !== this.altura) {
      this.largura = w
      this.altura = h
      const teto = this.opts.compacto ? 0.75e6 : 1.5e6
      const dpr = Math.min(window.devicePixelRatio || 1, this.opts.compacto ? 1 : 1.5, Math.sqrt(teto / (w * h)))
      this.renderer.setPixelRatio(dpr)
      this.renderer.setSize(w, h, false)
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.meiaAltura = Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z
    }

    const y0 = window.scrollY
    this.medidas = this.ancoras.map(({ el, pose, alvo }) => {
      const r = el.getBoundingClientRect()
      const topo = r.top + y0
      // A pose vale quando a seção está centrada na tela (ou no topo, se for
      // mais alta que a tela e começar no 0).
      const chave = Math.max(0, topo + Math.min(r.height, h) / 2 - h / 2)
      if (!alvo) return { chave, pose }
      const a = alvo.getBoundingClientRect()
      const cy = a.top + y0 + a.height / 2 - chave
      return {
        chave,
        pose: {
          ...pose,
          x: ((a.left + a.width / 2) / w) * 2 - 1,
          y: 1 - (cy / h) * 2,
          s: a.height / h,
        },
      }
    })
    this.pedir()
  }

  private aoRolar = () => {
    this.scrollY = window.scrollY
    this.paradoDesde = performance.now()
    this.pedir()
  }

  private aoMover = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    this.ponteiro.x = (e.clientX / this.largura) * 2 - 1
    this.ponteiro.y = (e.clientY / this.altura) * 2 - 1
    this.pedir()
  }

  private aoVisibilidade = () => {
    if (document.hidden) cancelAnimationFrame(this.raf)
    else this.pedir()
  }

  iniciar() {
    this.ativo = true
    this.inicio = performance.now()
    this.pedir()
  }

  private pedir() {
    if (!this.ativo || document.hidden || this.raf) return
    this.raf = requestAnimationFrame(this.quadroAnimacao)
  }

  private poseDaRolagem(): Pose {
    const m = this.medidas
    if (!m.length) return VAZIO
    const y = this.scrollY
    if (y <= m[0].chave) return m[0].pose
    for (let i = 0; i < m.length - 1; i++) {
      const a = m[i]
      const b = m[i + 1]
      if (y <= b.chave) {
        const t = suave((y - a.chave) / Math.max(1, b.chave - a.chave))
        if (i + 1 !== this.ultimaChave && t > 0.98 && i + 1 === m.length - 1) {
          this.ultimaChave = i + 1
          this.flashEm = performance.now()
        }
        const p = a.pose
        const q = b.pose
        return {
          x: lerp(p.x, q.x, t),
          y: lerp(p.y, q.y, t),
          s: lerp(p.s, q.s, t),
          rx: lerp(p.rx, q.rx, t),
          ry: lerp(p.ry, q.ry, t),
          rz: lerp(p.rz, q.rz, t),
          op: lerp(p.op, q.op, t),
          // No meio do caminho entre duas poses as lâminas se soltam um pouco.
          abre: lerp(p.abre, q.abre, t) + Math.sin(t * Math.PI) * 0.08,
        }
      }
    }
    if (this.ultimaChave !== m.length - 1) {
      this.ultimaChave = m.length - 1
      this.flashEm = performance.now()
    }
    return m[m.length - 1].pose
  }

  private quadroAnimacao = (agora: number) => {
    this.raf = 0
    const calmo = this.opts.calmo
    const seg = (agora - this.inicio) / 1000

    // Celular parado: meio quadro (a luz do fio continua, mais barata).
    const parado = agora - this.paradoDesde > 400
    this.quadro++
    const pular = this.opts.compacto && parado && this.quadro % 2 === 1

    if (!pular) {
      // Montagem da abertura: as lâminas chegam abertas e se fecham.
      const m = calmo ? 1 : Math.min(1, seg / 1.9)
      if (this.montagem < 1 && m >= 1) this.flashEm = agora
      this.montagem = m
      const intro = 1 - suave(m)

      const alvo = this.poseDaRolagem()
      const p = this.atual
      // Amortecimento no tempo: a peça segue a rolagem com um leve atraso.
      const k = 1 - Math.exp(-(calmo ? 14 : 7) * 0.016)
      let falta = 0
      for (const c of ['x', 'y', 's', 'rx', 'ry', 'rz', 'op', 'abre'] as const) {
        p[c] = lerp(p[c], alvo[c], k)
        falta = Math.max(falta, Math.abs(alvo[c] - p[c]))
      }
      this.falta = falta

      const pt = this.ponteiro
      pt.ix = lerp(pt.ix, pt.x, 0.06)
      pt.iy = lerp(pt.iy, pt.y, 0.06)

      const flutua = calmo ? 0 : Math.sin(seg * 0.9) * 0.05
      const escala = (p.s * 2 * this.meiaAltura) / 1
      const g = this.peca
      g.scale.setScalar(escala * (1 - intro * 0.25))
      g.position.set(
        p.x * this.meiaAltura * this.camera.aspect,
        p.y * this.meiaAltura + flutua * escala,
        0,
      )
      g.rotation.set(
        p.rx + pt.iy * 0.18 + intro * 0.6,
        p.ry + pt.ix * 0.28 - intro * 2.4,
        p.rz,
      )
      const abre = Math.max(p.abre, intro)
      for (let i = 0; i < LAMINAS; i++) {
        const l = this.laminas[i]
        const lado = i - (LAMINAS - 1) / 2
        l.position.z = l.userData.z * (1 + abre * 5)
        l.position.x = lado * abre * 0.05
        l.rotation.z = lado * abre * 0.09
      }
      const op = Math.round(p.op * (1 - intro * 0.6) * 100) / 100
      if (op !== this.opCanvas) {
        this.opCanvas = op
        this.canvas.style.opacity = String(op)
      }

      // Brilho no fim da montagem e ao pousar no fecho: o metal acende e apaga.
      const f = (agora - this.flashEm) / 1000
      const flash = f >= 0 && f < 1.2 ? Math.sin((f / 1.2) * Math.PI) * 0.9 : 0
      this.material.color.setScalar(1 + flash)
      this.lateral.color.setRGB(0.76 + flash, 0.78 + flash, 0.82 + flash)

      // Luz que corre pelo contorno.
      this.luzFio.uniforms.cabeca.value = calmo ? 0.15 : (seg * 0.16 + this.scrollY * 0.00012) % 1
      // No celular, a luz do fio só corre com a peça grande (abertura e
      // fecho); no emblema do canto ela não aparece e não força quadros.
      const fioLigado = !this.opts.compacto || p.s > 0.13
      this.luzFio.uniforms.forca.value = fioLigado ? (calmo ? 0.35 : 0.85) * (1 - intro) : 0
      this.luzFio.uniforms.tamanho.value = this.opts.compacto ? 4 : 5.5

      this.renderer.render(this.cena, this.camera)
    }

    // No modo calmo (e no celular com o emblema pequeno) nada se move sozinho:
    // só renderiza quando algo muda.
    const fioCorre = !this.opts.compacto || this.atual.s > 0.13
    const assentando =
      this.falta > 0.0015 ||
      Math.abs(this.ponteiro.ix - this.ponteiro.x) > 0.002 ||
      this.montagem < 1 ||
      agora - this.flashEm < 1300
    if ((!calmo && fioCorre) || assentando) this.pedir()
  }

  dispose() {
    this.ativo = false
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    clearTimeout(this.medirAgendado)
    window.removeEventListener('scroll', this.aoRolar)
    window.removeEventListener('pointermove', this.aoMover)
    document.removeEventListener('visibilitychange', this.aoVisibilidade)
    this.cena.traverse((o) => {
      const m = o as Mesh
      m.geometry?.dispose()
    })
    this.material.map?.dispose()
    this.material.matcap?.dispose()
    this.material.dispose()
    this.lateral.dispose()
    this.luzFio.dispose()
    this.renderer.dispose()
  }
}
