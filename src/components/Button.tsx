import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Magnetic } from './Magnetic'

type Variant = 'chrome' | 'outline' | 'ghost'
type Size = 'md' | 'lg'

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: Variant
  size?: Size
  className?: string
  magnetic?: boolean
  external?: boolean
  'aria-label'?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

const VARIANTS: Record<Variant, string> = {
  // Botão principal: chapa de aço polido. O brilho diagonal é um ::before que
  // atravessa no hover — mesma ideia de reflexo do logotipo.
  chrome:
    'group/btn relative overflow-hidden bg-linear-to-b from-steel-50 via-steel-200 to-steel-400 ' +
    'text-void font-semibold shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_18px_40px_-18px_rgba(210,215,222,0.55)] ' +
    'hover:from-white hover:via-steel-100 hover:to-steel-300',
  outline:
    'border border-steel-700 text-steel-200 hover:border-steel-400 hover:text-white ' +
    'bg-white/[0.02] backdrop-blur-sm',
  ghost: 'text-steel-400 hover:text-white',
}

const SIZES: Record<Size, string> = {
  md: 'h-11 px-6 text-[0.8125rem] tracking-[0.14em]',
  lg: 'h-14 px-9 text-sm tracking-[0.16em]',
}

export function Button({
  children,
  href,
  onClick,
  variant = 'chrome',
  size = 'md',
  className,
  magnetic = true,
  external = true,
  type = 'button',
  disabled,
  ...rest
}: Props) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2.5 rounded-full font-mono uppercase',
    'transition-all duration-400 ease-[var(--ease-blade)] select-none',
    'disabled:pointer-events-none disabled:opacity-40',
    VARIANTS[variant],
    SIZES[size],
    className,
  )

  const inner =
    variant === 'chrome' ? (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-100 from-transparent via-white/70 to-transparent transition-transform duration-700 ease-[var(--ease-blade)] group-hover/btn:translate-x-full"
        />
        <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
      </>
    ) : (
      children
    )

  const node = href ? (
    <a
      href={href}
      className={classes}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {inner}
    </a>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...rest}>
      {inner}
    </button>
  )

  return magnetic ? <Magnetic strength={0.22}>{node}</Magnetic> : node
}
