import { ShoppingBag } from 'lucide-react'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { Button } from '@/components/Button'
import { Picture } from '@/components/Picture'
import { PRODUCT_GROUPS, whatsappUrl, type Product } from '@/lib/business'
import { useSpotlight } from '@/hooks/useSpotlight'
import { cn } from '@/lib/utils'
import manifest from '@/lib/image-manifest.json'

/**
 * A loja da barbearia.
 *
 * A tabela de produtos da parede tem seis itens e um preço fechado em cada um —
 * é informação que resolve a dúvida na hora ("quanto custa a pomada que ele
 * passou?"). Copiar aquela tabela como tabela seria o caminho preguiçoso; aqui
 * ela vira duas prateleiras, agrupadas pelo problema que resolvem, que é como
 * o cliente de fato pergunta.
 *
 * Cada produto pode ou não ter foto. Sem foto, o card cai para um tratamento
 * tipográfico com o preço grande em vez de deixar um buraco cinza — então dá
 * para publicar hoje e ir fotografando o estoque depois, sem tocar no código.
 */

const HAS_IMAGE = (name?: string) => Boolean(name && name in (manifest as Record<string, unknown>))

/**
 * Mesma lógica dos serviços: linha densa no celular, card a partir de `sm`.
 * A foto, quando existe, vira uma miniatura quadrada à esquerda no mobile e o
 * topo do card no desktop.
 */
function ProductCard({ product, index }: { product: Product; index: number }) {
  const ref = useSpotlight<HTMLDivElement>()
  const withPhoto = HAS_IMAGE(product.image)

  return (
    <Reveal delay={0.04 * index} as="li" className="h-full">
      <div
        ref={ref}
        id={product.id}
        className={cn(
          'group relative flex h-full scroll-mt-28 gap-4 overflow-hidden rounded-sm border border-steel-900 p-4',
          'bg-white/[0.015] transition-colors duration-500 hover:border-steel-700',
          'sm:flex-col sm:gap-0 sm:p-0',
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(211,215,222,0.08), transparent 62%)',
          }}
        />

        {withPhoto && (
          <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-sm sm:aspect-4/3 sm:w-full sm:rounded-none sm:border-b sm:border-steel-900">
            <Picture
              name={product.image!}
              alt={`${product.name} — ${product.size}`}
              className="h-full w-full"
              imgClassName="transition-transform duration-[900ms] ease-[var(--ease-blade)] group-hover:scale-105"
              sizes="(min-width: 640px) 22rem, 5rem"
            />
            <div aria-hidden className="absolute inset-0 hidden bg-linear-to-t from-void/60 to-transparent sm:block" />
          </div>
        )}

        <div className="relative flex min-w-0 flex-1 flex-col sm:p-6 lg:p-7">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-lg leading-tight text-steel-100 sm:text-2xl">{product.name}</h3>
            <span className="label-mono shrink-0 normal-case">{product.size}</span>
          </div>

          <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-steel-500 sm:mt-3 sm:line-clamp-none sm:text-sm">
            {product.description}
          </p>

          <div className="mt-3 flex items-end justify-between gap-4 sm:mt-6 sm:border-t sm:border-steel-900 sm:pt-4">
            <span className="chrome font-display text-2xl sm:text-3xl">R$ {product.price}</span>
            <a
              href={whatsappUrl(
                `Olá! Queria saber sobre o ${product.name} (${product.size}) que vi no site da Silverado.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.6rem] tracking-[0.16em] text-steel-500 uppercase transition-colors hover:text-steel-100 sm:text-[0.65rem]"
            >
              Reservar →
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export function Products({ showHeading = true }: { showHeading?: boolean } = {}) {
  return (
    <Section id="loja">
      <div className="container-x">
        {showHeading && (
          <SectionHeading
            eyebrow="06 — Na loja"
            title="Leve o que passou no seu cabelo"
            lead="Os mesmos produtos que o barbeiro usa na cadeira ficam à venda no balcão. Preço fechado, sem pacote e sem mensalidade."
          />
        )}

        <div className={showHeading ? 'mt-10 space-y-10 sm:mt-16 sm:space-y-16' : 'space-y-10 sm:space-y-16'}>
          {PRODUCT_GROUPS.map((group, gi) => (
            <div key={group.title}>
              <Reveal>
                <div className="flex flex-col gap-2 border-b border-steel-900 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                  <h3 className="text-2xl text-steel-100 sm:text-3xl">{group.title}</h3>
                  <p className="max-w-md text-sm leading-relaxed text-steel-500">{group.blurb}</p>
                </div>
              </Reveal>

              <ul className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {group.items.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={gi * 3 + i} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col items-start gap-6 border border-steel-800 bg-white/[0.02] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="flex items-start gap-4">
              <ShoppingBag className="mt-1 h-5 w-5 shrink-0 text-steel-500" strokeWidth={1.5} />
              <p className="max-w-2xl text-sm leading-relaxed text-steel-400">
                Dá para comprar durante o atendimento, sem agendar nada a mais. Se quiser garantir
                que tem em estoque antes de vir, é só perguntar no WhatsApp.
              </p>
            </div>
            <Button
              href={whatsappUrl('Olá! Queria saber se tem produto em estoque na Silverado.')}
              variant="outline"
              magnetic={false}
              className="shrink-0"
            >
              Perguntar estoque
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
