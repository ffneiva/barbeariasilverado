import { BUSINESS, CUTS, FAQ, PRODUCTS, SCHEDULE, SERVICES, type Product } from './business.ts'
import { canonicalFor, routeFor } from './routes.ts'

/**
 * JSON-LD para o Google entender que isto é uma barbearia física em Goiânia.
 *
 * `HairSalon` é o tipo mais específico do schema.org para o ramo e herda de
 * LocalBusiness — é ele que alimenta o painel lateral da busca, o "aberto agora"
 * e o botão de rota. Serviço, FAQ e site entram como nós irmãos no mesmo @graph
 * para que o Google resolva as referências entre eles.
 *
 * Uma regra atravessa o arquivo inteiro: **um nó só é emitido na rota que
 * mostra aquele conteúdo**. Marcar FAQ numa página sem FAQ é violação explícita
 * das diretrizes de dados estruturados, e o custo não é teórico — é a página
 * perder a elegibilidade a resultado rico.
 */

const ID_NEGOCIO = `${BUSINESS.url}/#barbearia`

/** Rotas que renderizam a seção de produtos (ver App.tsx e pages/Loja.tsx). */
const ROTAS_COM_PRODUTOS = new Set(['/', '/loja'])

/**
 * Um produto como o Google espera ler.
 *
 * O erro crítico que o Search Console apontava nos seis produtos ("Especifique
 * offers, review ou aggregateRating") nascia de um detalhe de aninhamento: os
 * produtos moravam dentro do `hasOfferCatalog` do salão, como `itemOffered` de
 * uma Offer, e o preço ficava na Offer **de fora**. O validador de Product lê o
 * nó Product isolado — e ali, de fato, não havia preço nenhum.
 *
 * Aqui o Product carrega a própria oferta. `InStoreOnly` descreve a verdade: o
 * preço é firme, mas a venda é no balcão, não pelo site.
 */
function produtoJsonLd(product: Product) {
  // Âncora do próprio card (ver sections/Products.tsx), não da seção. Uma URL
  // que leva ao item exato é o que o Google espera em `Offer.url` — e de quebra
  // dá um link para mandar no WhatsApp quando alguém pergunta o preço de um.
  const url = `${BUSINESS.url}/loja#${product.id}`

  return {
    '@type': 'Product',
    '@id': `${BUSINESS.url}/loja#produto-${product.id}`,
    name: `${product.name} ${product.size}`,
    description: product.description,
    sku: product.id,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    offers: {
      '@type': 'Offer',
      url,
      price: product.price.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStoreOnly',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ID_NEGOCIO },
      areaServed: { '@type': 'City', name: 'Goiânia' },
    },
  }
}

/**
 * Nós extras de cada rota.
 *
 * A home carrega o perfil do negócio inteiro; /agendar e /loja ganham o que é
 * específico delas. Duas coisas em jogo:
 *
 * · **BreadcrumbList** diz ao Google que a página é filha da home. Sem isso,
 *   /agendar e /loja aparecem na busca como URLs soltas, sem a trilha que
 *   ajuda a entender a estrutura do site.
 *
 * · **ItemList de produtos** transforma seis itens com preço em entidades que o
 *   Google consegue ler — em vez de um bloco de texto onde ele teria que
 *   adivinhar o que é nome e o que é valor.
 */
function nosDaRota(caminho: string) {
  const rota = routeFor(caminho)

  const produtos = ROTAS_COM_PRODUTOS.has(rota.path)
    ? [
        {
          '@type': 'ItemList',
          '@id': `${BUSINESS.url}/loja#produtos`,
          name: 'Produtos à venda na Barbearia Silverado',
          numberOfItems: PRODUCTS.length,
          itemListOrder: 'https://schema.org/ItemListUnordered',
          itemListElement: PRODUCTS.map((product, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: produtoJsonLd(product),
          })),
        },
      ]
    : []

  if (rota.path === '/') return produtos

  const trilha = {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalFor(rota)}#trilha`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${BUSINESS.url}/` },
      { '@type': 'ListItem', position: 2, name: rota.title.split('·')[0].trim(), item: canonicalFor(rota) },
    ],
  }

  if (rota.path === '/loja') return [trilha, ...produtos]

  if (rota.path === '/agendar') {
    return [
      trilha,
      {
        '@type': 'WebPage',
        '@id': `${canonicalFor(rota)}#pagina`,
        url: canonicalFor(rota),
        name: rota.title,
        description: rota.description,
        // Declara que daqui se marca horário, e por qual canal. É o que
        // permite ao Google entender a página como ponto de agendamento.
        potentialAction: {
          '@type': 'ReserveAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `https://wa.me/${BUSINESS.whatsapp}`,
            inLanguage: 'pt-BR',
            actionPlatform: [
              'https://schema.org/DesktopWebPlatform',
              'https://schema.org/MobileWebPlatform',
            ],
          },
          result: { '@type': 'Reservation', name: 'Horário na Barbearia Silverado' },
          provider: { '@id': ID_NEGOCIO },
        },
      },
    ]
  }

  return [trilha]
}

export function buildJsonLd(caminho = '/') {
  const rota = routeFor(caminho)

  const openingHoursSpecification = SCHEDULE.flatMap((day, index) =>
    day.shifts.map((shift) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]
      }`,
      opens: shift.open,
      closes: shift.close,
    })),
  )

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HairSalon',
        '@id': ID_NEGOCIO,
        // schema.org não tem um tipo "barbearia"; HairSalon é o mais próximo.
        // O identificador do Wikidata desfaz a ambiguidade e liga o negócio à
        // entidade "barbershop" no grafo de conhecimento do Google.
        additionalType: 'https://www.wikidata.org/wiki/Q1075443',
        name: BUSINESS.name,
        alternateName: BUSINESS.shortName,
        slogan: BUSINESS.tagline,
        description: BUSINESS.description,
        url: BUSINESS.url,
        telephone: `+${BUSINESS.whatsapp}`,
        email: BUSINESS.email,
        image: `${BUSINESS.url}/og.jpg`,
        logo: `${BUSINESS.url}/images/logo-wordmark.png`,
        priceRange: 'R$ 10 – R$ 90',
        currenciesAccepted: 'BRL',
        paymentAccepted: 'Pix, Dinheiro, Cartão de débito, Cartão de crédito',
        address: {
          '@type': 'PostalAddress',
          streetAddress: BUSINESS.address.street,
          addressLocality: BUSINESS.address.city,
          addressRegion: BUSINESS.address.state,
          postalCode: BUSINESS.address.zip,
          addressCountry: BUSINESS.address.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: BUSINESS.geo.lat,
          longitude: BUSINESS.geo.lng,
        },
        hasMap: BUSINESS.mapsLink,
        openingHoursSpecification,
        sameAs: [BUSINESS.instagram, BUSINESS.threads],
        // O bairro entra junto com a cidade: quase toda busca que importa aqui
        // é "barbearia + bairro", e "Goiânia" sozinho é largo demais para dizer
        // alguma coisa sobre uma barbearia de rua.
        areaServed: [
          { '@type': 'City', name: 'Goiânia' },
          { '@type': 'Place', name: 'Jardim América, Goiânia' },
          { '@type': 'Place', name: 'Setor Bueno, Goiânia' },
          { '@type': 'Place', name: 'Setor Marista, Goiânia' },
          { '@type': 'Place', name: 'Setor Oeste, Goiânia' },
          { '@type': 'Place', name: 'Jardim Goiás, Goiânia' },
        ],
        // Os termos que o cliente digita e que a página de fato cobre. Sai da
        // lista de serviços para não virar uma segunda fonte de verdade que
        // envelhece sozinha.
        knowsAbout: [
          ...SERVICES.map((service) => service.name),
          'Degradê',
          'Fade',
          'Acabamento na navalha',
          'Corte de cabelo masculino',
        ],
        knowsLanguage: 'pt-BR',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Serviços da Barbearia Silverado',
          itemListElement: SERVICES.map((service) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
              description: service.description,
              serviceType: service.name,
              provider: { '@id': ID_NEGOCIO },
            },
            ...(service.price !== null && {
              price: service.price.toFixed(2),
              priceCurrency: 'BRL',
              // A tabela marca selagem e botox como piso; o schema tem um campo
              // próprio para isso, e usá-lo evita anunciar um preço que pode subir.
              ...(service.fromPrice
                ? {
                    priceSpecification: {
                      '@type': 'PriceSpecification',
                      minPrice: service.price.toFixed(2),
                      priceCurrency: 'BRL',
                    },
                  }
                : {}),
            }),
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${BUSINESS.url}/#site`,
        url: BUSINESS.url,
        name: BUSINESS.name,
        inLanguage: 'pt-BR',
        publisher: { '@id': ID_NEGOCIO },
      },
      // FAQ e galeria de cortes só na home, que é a única página que os mostra.
      ...(rota.path === '/'
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${BUSINESS.url}/#faq`,
              mainEntity: FAQ.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            },
            {
              '@type': 'ImageGallery',
              '@id': `${BUSINESS.url}/#cortes`,
              name: 'Cortes feitos na Barbearia Silverado',
              associatedMedia: CUTS.map((cut) => ({
                '@type': 'ImageObject',
                name: cut.name,
                caption: cut.blurb,
                contentUrl: `${BUSINESS.url}/images/${cut.image}.jpg`,
              })),
            },
          ]
        : []),
      ...nosDaRota(caminho),
    ],
  }
}
