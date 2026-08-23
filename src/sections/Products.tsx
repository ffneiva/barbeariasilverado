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

function ProductCard({ product, index }: { product: Product; index: number }) {
  const ref = useSpotlight<HTMLDivElement>()
  const withPhoto = HAS_IMAGE(product.image)

  return (
    <Reveal delay={0.05 * index} as="li" className="h-full">
      <div
        ref={ref}
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-sm border border-steel-900',
          'bg-white/[0.015] transition-colors duration-500 hover:border-steel-700',
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
          <div className="relative aspect-4/3 overflow-hidden border-b border-steel-900">
            <Picture
              name={product.image!}
              alt={`${product.name} — ${product.size}`}
              className="h-full w-full"
              imgClassName="transition-transform duration-[900ms] ease-[var(--ease-blade)] group-hover:scale-105"
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-void/60 to-transparent" />
          </div>
        )}

        <div className="relative flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-2xl leading-tight text-steel-100">{product.name}</h3>
            <span className="label-mono shrink-0 normal-case">{product.size}</span>
          </div>

          <p className="mt-3 flex-1 text-sm leading-relaxed text-steel-500">{product.description}</p>

          <div className="mt-6 flex items-end justify-between gap-4 border-t border-steel-900 pt-4">
            <span className={cn('font-display', withPhoto ? 'chrome text-3xl' : 'chrome text-4xl')}>
              R$ {product.price}
            </span>
            <a
              href={whatsappUrl(
                `Olá! Queria saber sobre o ${product.name} (${product.size}) que vi no site da Silverado.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.65rem] tracking-[0.16em] text-steel-500 uppercase transition-colors hover:text-steel-100"
            >
              Reservar →
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export function Products() {
  return (
    <Section id="loja">
      <div className="container-x">
        <SectionHeading
          eyebrow="06 — Na loja"
          title="Leve o que passou no seu cabelo"
          lead="Os mesmos produtos que o barbeiro usa na cadeira ficam à venda no balcão. Preço fechado, sem pacote e sem mensalidade."
        />

        <div className="mt-16 space-y-16">
          {PRODUCT_GROUPS.map((group, gi) => (
            <div key={group.title}>
              <Reveal>
                <div className="flex flex-col gap-2 border-b border-steel-900 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                  <h3 className="text-2xl text-steel-100 sm:text-3xl">{group.title}</h3>
                  <p className="max-w-md text-sm leading-relaxed text-steel-500">{group.blurb}</p>
                </div>
              </Reveal>

              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
