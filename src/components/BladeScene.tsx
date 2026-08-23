import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A navalha da marca, em metal de verdade.
 *
 * Três decisões carregam a cena:
 *
 * 1. **Ambiente cozido em código, sem HDRI.** Cromo sem environment map fica
 *    cinza-chapado: o que dá a leitura de "polido" são as faixas de luz
 *    refletidas. Em vez de baixar um .hdr de um CDN, monta-se uma cena auxiliar
 *    com retângulos emissivos — softboxes de estúdio — e o `PMREMGenerator` a
 *    converte, uma única vez, no mapa que a `MeshStandardMaterial` consome.
 *    Nenhum byte de terceiro, nada para o CDN derrubar.
 *
 * 2. **Sem @react-three/drei.** A biblioteca resolveria o ambiente, o flutuar
 *    e a sombra de contato, mas traz junto os loaders de HDRI/gainmap que este
 *    site nunca usa — ~250 kB de JS para três efeitos que cabem em 60 linhas.
 *
 * 3. **Geometria procedural.** A lâmina é um `Shape` extrudado com bisel, não
 *    um .glb: pesa zero no bundle e o formato continua editável em código.
 *
 * A cena é carregada sob `React.lazy` (ver Hero) e nunca monta em
 * `prefers-reduced-motion`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Estúdio virtual
// ─────────────────────────────────────────────────────────────────────────────

type Softbox = {
  position: [number, number, number]
  scale: [number, number]
  intensity: number
  color: string
  rotation?: [number, number, number]
}

/**
 * Cada retângulo só existe no reflexo — é ele que desenha o brilho na lâmina.
 *
 * A primeira versão tinha só quatro luzes frontais, e a navalha "apagava"
 * sempre que o ponteiro a girava para longe delas: metal com `metalness: 1`
 * não tem cor própria, só reflexo, e o que havia atrás era preto. Agora o
 * estúdio envolve o objeto — inclusive por trás e por baixo —, de modo que
 * nenhuma orientação deixa a lâmina sem nada para refletir.
 */
const SOFTBOXES: Softbox[] = [
  // Key light: a faixa larga que corre pelas costas da lâmina.
  { position: [0, 3.5, 4], scale: [9, 3], intensity: 5, color: '#ffffff' },
  // Rim fria, atrás, para separar o objeto do fundo.
  { position: [-5, 1, -4], scale: [6, 6], intensity: 3.4, color: '#dbe4f0' },
  // Kicker quente — sem ele o metal puxa para o azul.
  { position: [5, -1.5, 2], scale: [5, 3], intensity: 2, color: '#fff0dc' },
  // Barra fina inclinada: vira o "risco" característico do cromo.
  { position: [1.5, 4, -1], scale: [0.35, 8], intensity: 7, color: '#ffffff', rotation: [0, 0, Math.PI / 5] },

  // ── Preenchimento: fracos, largos e por todos os lados. São eles que
  //    garantem um mínimo de brilho em qualquer ângulo de giro.
  { position: [-7, 0, 3], scale: [7, 7], intensity: 1.1, color: '#c8d0dc' },   // esquerda
  { position: [7, 1.5, -2], scale: [7, 7], intensity: 1.1, color: '#c8d0dc' }, // direita
  { position: [0, -5, 1], scale: [10, 5], intensity: 0.9, color: '#9aa4b2' },  // por baixo
  { position: [0, 1, -8], scale: [12, 8], intensity: 1.4, color: '#aeb8c6' },  // fundo
]

function makeSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#4a5260')   // zênite: o "teto do estúdio"
  gradient.addColorStop(0.45, '#22262d')
  gradient.addColorStop(0.72, '#101216')
  gradient.addColorStop(1, '#050506')   // chão
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 4, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function buildStudioEnvMap(gl: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(gl)
  const studio = new THREE.Scene()

  // Fundo em degradê vertical, e não preto chapado: mesmo virada para o "chão",
  // a lâmina reflete alguma coisa. É esse piso de luminância que impede o
  // objeto de desaparecer quando o ponteiro o inclina.
  studio.background = makeSkyTexture()

  const disposables: Array<THREE.BufferGeometry | THREE.Material> = []

  for (const box of SOFTBOXES) {
    const geometry = new THREE.PlaneGeometry(box.scale[0], box.scale[1])
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(box.color).multiplyScalar(box.intensity),
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...box.position)
    if (box.rotation) mesh.rotation.set(...box.rotation)
    else mesh.lookAt(0, 0, 0)
    studio.add(mesh)
    disposables.push(geometry, material)
  }

  const target = pmrem.fromScene(studio, 0.04)

  // A cena auxiliar já cumpriu seu papel: o conteúdo dela vive agora na textura.
  pmrem.dispose()
  for (const item of disposables) item.dispose()
  ;(studio.background as THREE.CanvasTexture).dispose()

  return target.texture
}

/**
 * Publica o mapa na cena via `attach="environment"`.
 *
 * O caminho imperativo (`scene.environment = tex` num useEffect) funciona, mas
 * mexe num objeto devolvido por hook e deixa a limpeza por conta do
 * desenvolvedor. Com `attach`, é o próprio R3F que faz o vínculo na montagem e
 * restaura o valor anterior na desmontagem.
 */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const texture = useMemo(() => buildStudioEnvMap(gl), [gl])

  useEffect(() => () => texture.dispose(), [texture])

  return <primitive object={texture} attach="environment" />
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometria da navalha
// ─────────────────────────────────────────────────────────────────────────────

/** Perfil da lâmina: costas retas, gume reto e ponta quadrada arredondada. */
function useBladeGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-2.05, 0.02)
    shape.lineTo(1.72, 0.02)
    shape.quadraticCurveTo(2.02, 0.02, 2.02, 0.3)
    shape.lineTo(2.02, 0.46)
    shape.lineTo(-1.9, 0.46)
    shape.quadraticCurveTo(-2.12, 0.46, -2.05, 0.02)

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.018,
      bevelSegments: 4,
      curveSegments: 24,
    }).center()
  }, [])
}

/** Cabo (escala) da navalha: caixa alongada com cantos arredondados. */
function useHandleGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    const w = 2.25
    const h = 0.3
    const r = 0.12
    shape.moveTo(-w + r, -h)
    shape.lineTo(w - r, -h)
    shape.quadraticCurveTo(w, -h, w, -h + r)
    shape.lineTo(w, h - r)
    shape.quadraticCurveTo(w, h, w - r, h)
    shape.lineTo(-w + r, h)
    shape.quadraticCurveTo(-w, h, -w, h - r)
    shape.lineTo(-w, -h + r)
    shape.quadraticCurveTo(-w, -h, -w + r, -h)

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 16,
    }).center()
  }, [])
}

/**
 * Posição do ponteiro normalizada em [-1, 1], lida da window.
 *
 * O `state.pointer` do R3F não serve aqui: o <Canvas> é `pointer-events: none`
 * (para não roubar cliques do texto que fica por cima), e sem eventos chegando
 * ao canvas aquele valor nunca sai de (0, 0). Um listener na window resolve — e
 * de quebra a navalha reage ao mouse mesmo quando ele está sobre o título.
 */
function useWindowPointer() {
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return pointer
}

function Razor(props: ThreeElements['group']) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const pointer = useWindowPointer()
  const blade = useBladeGeometry()
  const handle = useHandleGeometry()

  const steel = useMemo(
    // roughness um pouco maior espalha o reflexo em vez de concentrá-lo num
    // ponto: o brilho fica menos "liga/desliga" conforme a lâmina gira.
    () => new THREE.MeshStandardMaterial({ color: '#dfe4ea', metalness: 0.96, roughness: 0.19, envMapIntensity: 2.1 }),
    [],
  )
  const darkSteel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4a4e57', metalness: 0.9, roughness: 0.34, envMapIntensity: 1.6 }),
    [],
  )

  useEffect(() => {
    return () => {
      steel.dispose()
      darkSteel.dispose()
      blade.dispose()
      handle.dispose()
    }
  }, [steel, darkSteel, blade, handle])

  useFrame((state, delta) => {
    // Perseguição amortecida do ponteiro. O fator exponencial mantém a mesma
    // sensação a 60 ou a 144 Hz — um `lerp` de passo fixo ficaria mais rápido
    // em telas mais velozes.
    if (outer.current) {
      // Amplitude curta de propósito. Com o giro largo original, o ponteiro no
      // canto da tela levava a lâmina a um ângulo em que ela refletia só o
      // fundo escuro — e sumia. Aqui ela sempre fica dentro do cone de luz.
      const k = 1 - Math.pow(0.0015, delta)
      outer.current.rotation.y += (pointer.current.x * 0.3 - outer.current.rotation.y) * k
      outer.current.rotation.x += (-pointer.current.y * 0.14 - outer.current.rotation.x) * k
    }

    // Flutuação ociosa: duas senoides de período diferente, para o movimento
    // não parecer um metrônomo.
    if (inner.current) {
      const t = state.clock.elapsedTime
      inner.current.position.y = Math.sin(t * 0.9) * 0.12
      inner.current.rotation.z = 0.06 + Math.sin(t * 0.63) * 0.05
    }
  })

  return (
    <group ref={outer} {...props}>
      <group ref={inner}>
        {/* Navalha aberta: o cabo abre em relação à lâmina, como em uso. */}
        <mesh geometry={blade} material={steel} position={[0.35, 0.42, 0]} />
        <group position={[-1.62, 0.28, 0]} rotation={[0, 0, -0.42]}>
          <mesh geometry={handle} material={darkSteel} position={[2.05, -0.62, 0]} />
        </group>
        {/* Pino do pivô */}
        <mesh position={[-1.62, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
          <cylinderGeometry args={[0.075, 0.075, 0.22, 20]} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Sombra de contato falsa: um plano com textura radial.
 * Uma sombra real exigiria shadow map e um segundo passe de render — caro para
 * um borrão que ninguém olha de perto.
 */
function ContactShadow() {
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
    gradient.addColorStop(0.45, 'rgba(0,0,0,0.22)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[11, 6]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <StudioEnvironment />
      <Razor scale={0.92} position={[0, 0.1, 0]} rotation={[0.12, -0.5, 0]} />
      <ContactShadow />
    </>
  )
}

export default function BladeScene() {
  return (
    <Canvas
      // dpr limitado: em telas 3x o custo por fragmento triplica sem ganho
      // perceptível num objeto que está sempre em movimento.
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.4, 7.2], fov: 34 }}
      style={{ pointerEvents: 'none' }}
    >
      <Scene />
    </Canvas>
  )
}
