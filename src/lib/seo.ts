import { BUSINESS, CUTS, FAQ, SCHEDULE, SERVICES } from './business'

/**
 * JSON-LD para o Google entender que isto é uma barbearia física em Goiânia.
 *
 * `HairSalon` é o tipo mais específico do schema.org para o ramo e herda de
 * LocalBusiness — é ele que alimenta o painel lateral da busca, o "aberto agora"
 * e o botão de rota. Serviço, FAQ e site entram como nós irmãos no mesmo @graph
 * para que o Google resolva as referências entre eles.
 */
export function buildJsonLd() {
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
        priceRange: 'R$ 40 – R$ 90',
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
          itemListElement: SERVICES.map((service) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
              description: service.description,
            },
            ...(service.price !== null && {
              price: service.price.toFixed(2),
              priceCurrency: 'BRL',
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
      {
        '@type': 'ImageGallery',
        '@id': `${BUSINESS.url}/#cortes`,
        name: 'Cortes de assinatura da Barbearia Silverado',
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
