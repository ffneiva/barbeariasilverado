import { cn } from '@/lib/utils'
import { BUSINESS } from '@/lib/business'

/**
 * O logotipo é aplicado como **máscara**, não como imagem.
 *
 * O PNG do kit da marca (branco com alpha) decide apenas ONDE a marca aparece;
 * o que aparece é um degradê cromado em CSS. O ganho é que o brilho vira
 * código: acompanha o tema, pode animar (`animate-sheen`) e continua nítido em
 * qualquer densidade de tela — coisas que um PNG prateado achatado não faz.
 */

const CHROME_GRADIENT =
  'linear-gradient(168deg, #ffffff 0%, #d6dae1 14%, #7e848f 32%, #ffffff 46%, ' +
  '#6d7380 58%, #c9ced7 76%, #ffffff 92%, #9aa0aa 100%)'

type Props = {
  variant?: 'wordmark' | 'mark'
  className?: string
  /** Liga o reflexo que percorre o metal continuamente. */
  animated?: boolean
  title?: string
}

// Proporções medidas nos arquivos gerados por scripts/optimize-images.mjs.
// Declará-las aqui evita salto de layout: a caixa já nasce com o tamanho certo,
// antes de o PNG da máscara terminar de baixar.
const ASSETS = {
  wordmark: { src: '/images/logo-wordmark.png', aspect: 1400 / 418 },
  mark: { src: '/images/logo-mark.png', aspect: 212 / 221 },
}

export function Logo({ variant = 'wordmark', className, animated = false, title }: Props) {
  const { src, aspect } = ASSETS[variant]

  return (
    <span
      role="img"
      aria-label={title ?? BUSINESS.name}
      className={cn('block', animated && 'animate-sheen', className)}
      style={{
        aspectRatio: aspect,
        backgroundImage: CHROME_GRADIENT,
        backgroundSize: animated ? '100% 300%' : 'cover',
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}

/**
 * A navalha da marca redesenhada em SVG, para quando é preciso traçar,
 * preencher ou animar o contorno — coisas que uma máscara PNG não permite.
 * Serve de separador entre seções e de ícone dos pilares.
 */
export function BladeIcon({ className, strokeWidth = 2.4 }: { className?: string; strokeWidth?: number }) {
  return (
    // Sem tamanho padrão de propósito. A versão anterior fixava `h-full w-full`
    // e concatenava a classe do chamador, então um `h-6 w-6` virava
    // "h-full w-full h-6 w-6" — duas regras de mesma especificidade brigando,
    // e o ícone estourava para a largura inteira do container.
    <svg viewBox="0 0 100 100" fill="none" className={cn('shrink-0', className)} aria-hidden>
      <path
        d="M8 14h74c3 0 5 2 5 4s-2 4-5 4H30l42 30c3 2 3 6 0 8L20 92c-3 2-7 0-7-4 0-2 1-3 2-4l44-26L9 22c-3-2-3-8-1-8z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M8 14h74c3 0 5 2 5 4s-2 4-5 4H30l42 30c3 2 3 6 0 8L20 92c-3 2-7 0-7-4 0-2 1-3 2-4l44-26L9 22c-3-2-3-8-1-8z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="19" cy="18" r="2.6" fill="currentColor" />
    </svg>
  )
}
