import { BUSINESS, CUTS, FAQ, PRODUCTS, SCHEDULE, SERVICES } from './business.ts'
import { canonicalFor, routeFor } from './routes.ts'

/**
 * JSON-LD para o Google entender que isto é uma barbearia física em Goiânia.
 *
 * `HairSalon` é o tipo mais específico do schema.org para o ramo e herda de
 * LocalBusiness — é ele que alimenta o painel lateral da busca, o "aberto agora"
 * e o botão de rota. Serviço, FAQ e site entram como nós irmãos no mesmo @graph
 * para que o Google resolva as referências entre eles.
 */
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
 * · **ItemList em /loja** transforma seis produtos com preço em itens
 *   individuais que o Google consegue ler — em vez de um bloco de texto onde
 *   ele teria que adivinhar o que é nome e o que é valor.
 */
function nosDaRota(caminho: string) {
  const rota = routeFor(caminho)
  if (rota.path === '/') return []

  const trilha = {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalFor(rota)}#trilha`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${BUSINESS.url}/` },
      { '@type': 'ListItem', position: 2, name: rota.title.split('·')[0].trim(), item: canonicalFor(rota) },
    ],
  }

  if (rota.path === '/loja') {
    return [
      trilha,
      {
        '@type': 'ItemList',
        '@id': `${canonicalFor(rota)}#produtos`,
        name: 'Produtos à venda na Barbearia Silverado',
        numberOfItems: PRODUCTS.length,
        itemListElement: PRODUCTS.map((product, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: `${product.name} ${product.size}`,
            description: product.description,
            offers: {
              '@type': 'Offer',
              price: product.price.toFixed(2),
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStore',
              seller: { '@id': `${BUSINESS.url}/#barbearia` },
            },
          },
        })),
      },
    ]
  }

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
          provider: { '@id': `${BUSINESS.url}/#barbearia` },
        },
      },
    ]
  }

  return [trilha]
}

export function buildJsonLd(caminho = '/') {
  const id = `${BUSINESS.url}/#barbearia`

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
        '@id': id,
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
        areaServed: {
          '@type': 'City',
          name: 'Goiânia',
        },
        knowsLanguage: 'pt-BR',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Serviços da Barbearia Silverado',
          itemListElement: [
            ...SERVICES.map((service) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: service.name,
                description: service.description,
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
            ...PRODUCTS.map((product) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: `${product.name} ${product.size}`,
                description: product.description,
              },
              price: product.price.toFixed(2),
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStore',
            })),
          ],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${BUSINESS.url}/#site`,
        url: BUSINESS.url,
        name: BUSINESS.name,
        inLanguage: 'pt-BR',
        publisher: { '@id': id },
      },
      {
        '@type': 'FAQPage',
        '@id': `${BUSINESS.url}/#faq`,
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      ...nosDaRota(caminho),
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
    ],
  }
}
