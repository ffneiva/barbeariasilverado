import { useReducedMotion } from '@/hooks/useMediaQuery'
import { useScrollProgressRef } from '@/hooks/useScroll'

/**
 * Grão de filme sobre a página inteira.
 *
 * Gradientes escuros grandes sofrem de banding em telas de 8 bits — faixas
 * visíveis onde deveria haver transição contínua. Uma camada de ruído por cima
 * quebra essas faixas e, de quebra, dá a textura analógica que combina com o
 * couro. É SVG inline (feTurbulence), então não custa nenhuma requisição.
 */
export function Grain() {
  const reduced = useReducedMotion()

  const noise = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
       <filter id="n">
         <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
         <feColorMatrix type="saturate" values="0"/>
       </filter>
       <rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/>
     </svg>`.replace(/\s+/g, ' '),
  )

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-[-10%] z-[60] opacity-[0.035] mix-blend-overlay will-change-transform"
      style={{
        backgroundImage: `url("data:image/svg+xml,${noise}")`,
        animation: reduced ? undefined : 'grain-shift 800ms steps(1) infinite',
      }}
    />
  )
}

/**
 * Barra de progresso da página desenhada como o fio de uma navalha: uma linha
 * de aço que se estende no topo conforme você desce.
 *
 * O `scaleX` é escrito direto no nó (ver useScrollProgressRef) em vez de virar
 * estado do React — sessenta re-renders por segundo para mover uma linha de um
 * pixel seria um mau negócio.
 */
export function ScrollProgress() {
  const ref = useScrollProgressRef<HTMLDivElement>()

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-px bg-steel-900/60">
      <div
        ref={ref}
        className="h-full origin-left scale-x-0 bg-linear-to-r from-steel-600 via-steel-100 to-steel-400"
        style={{ boxShadow: '0 0 12px rgba(211,215,222,0.55)' }}
      />
    </div>
  )
}
