import { useState } from 'react'
import manifest from '@/lib/image-manifest.json'
import { cn } from '@/lib/utils'

type ManifestEntry = { widths: number[]; aspect: number; lqip: string }
const IMAGES = manifest as Record<string, ManifestEntry>

type Props = {
  /** Nome base do arquivo em /images, sem extensão nem largura. */
  name: string
  alt: string
  className?: string
  imgClassName?: string
  /** Atributo `sizes` — quanto mais honesto, menos byte o browser baixa. */
  sizes?: string
  priority?: boolean
}

/**
 * <picture> com AVIF → WebP → JPEG e placeholder embutido.
 *
 * O LQIP (20px de largura, embutido como data URI no manifest) pinta o
 * enquadramento e a cor média antes do arquivo real chegar, então a foto
 * "revela" em vez de aparecer sobre um retângulo cinza. Como ele já vem no
 * bundle JS, não custa nenhuma requisição extra.
 */
export function Picture({ name, alt, className, imgClassName, sizes = '100vw', priority = false }: Props) {
  const [loaded, setLoaded] = useState(false)
  const entry = IMAGES[name]

  if (!entry) {
    // Falha visível em desenvolvimento é melhor que uma imagem faltando em produção.
    if (import.meta.env.DEV) console.warn(`[Picture] "${name}" não existe no image-manifest.json`)
    return null
  }

  const srcSet = (ext: string) =>
    entry.widths.map((w) => `/images/${name}-${w}.${ext} ${w}w`).join(', ')

  return (
    <div
      className={cn('relative overflow-hidden bg-steel-900', className)}
      style={{
        backgroundImage: loaded ? undefined : `url(${entry.lqip})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <img
          src={`/images/${name}.jpg`}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-blade)]',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      </picture>
    </div>
  )
}
