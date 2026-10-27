import { BUSINESS, CUTS, FAQ, GOOGLE_PROFILE, PRODUCTS, SCHEDULE, SERVICES, type Product } from './business.ts'
import { PAGINAS_CORTE, PAGINAS_SERVICO, PERGUNTAS_GERAIS, type Pergunta } from './paginas.ts'
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
const ROTAS_COM_PRODUTOS = new Set(['/', '/produtos', '/loja'])

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
  const url = `${BUSINESS.url}/produtos#${product.id}`

  return {
    '@type': 'Product',
    '@id': `${BUSINESS.url}/produtos#produto-${product.id}`,
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
          '@id': `${BUSINESS.url}/produtos#produtos`,
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

  if (rota.path === '/produtos' || rota.path === '/loja') return [trilha, ...produtos]

  // Páginas de conteúdo: cada uma marca o que mostra (serviço com preço,
  // corte com foto, perguntas abertas na tela).
  const url = canonicalFor(rota)
  const pagina = (extra: Record<string, unknown> = {}) => ({
    '@type': 'WebPage',
    '@id': `${url}#pagina`,
    url,
    name: rota.title,
    description: rota.description,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${BUSINESS.url}/#site` },
    about: { '@id': ID_NEGOCIO },
    breadcrumb: { '@id': `${url}#trilha` },
    ...extra,
  })
  const faq = (itens: Pergunta[]) => ({
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: itens.map((p) => ({ '@type': 'Question', name: p.q, acceptedAnswer: { '@type': 'Answer', text: p.a } })),
  })
  const trilha3 = (meio: [string, string], fim: string) => ({
    '@type': 'BreadcrumbList',
    '@id': `${url}#trilha`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${BUSINESS.url}/` },
      { '@type': 'ListItem', position: 2, name: meio[0], item: `${BUSINESS.url}${meio[1]}` },
      { '@type': 'ListItem', position: 3, name: fim, item: url },
    ],
  })

  const ps = PAGINAS_SERVICO.find((p) => p.path === rota.path)
  if (ps) {
    const s = ps.servico
    return [
      trilha3(['Serviços', '/servicos'], s.name),
      pagina({ mainEntity: { '@id': `${url}#servico` } }),
      {
        '@type': 'Service',
        '@id': `${url}#servico`,
        name: s.name,
        serviceType: s.name,
        description: ps.detalhe,
        provider: { '@id': ID_NEGOCIO },
        areaServed: { '@type': 'City', name: 'Goiânia' },
        ...(s.price !== null && {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'BRL',
            ...(s.fromPrice
              ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: s.price.toFixed(2), priceCurrency: 'BRL' } }
              : { price: s.price.toFixed(2) }),
            seller: { '@id': ID_NEGOCIO },
          },
        }),
      },
      faq(ps.perguntas),
    ]
  }

  const pc = PAGINAS_CORTE.find((p) => p.path === rota.path)
  if (pc) {
    return [
      trilha3(['Cortes', '/cortes'], pc.corte.name),
      pagina({ primaryImageOfPage: { '@id': `${url}#foto` } }),
      {
        '@type': 'ImageObject',
        '@id': `${url}#foto`,
        contentUrl: `${BUSINESS.url}/images/${pc.corte.image}-1280.webp`,
        caption: `Corte ${pc.corte.name} feito na ${BUSINESS.name}`,
        creditText: BUSINESS.name,
      },
      faq(pc.perguntas),
    ]
  }

  if (rota.path === '/servicos') {
    return [
      trilha,
      pagina(),
      {
        '@type': 'ItemList',
        '@id': `${url}#lista`,
        name: 'Serviços da Barbearia Silverado',
        itemListElement: PAGINAS_SERVICO.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BUSINESS.url}${p.path}`,
          name: p.servico.name,
        })),
      },
      faq(PERGUNTAS_GERAIS.slice(-3)),
    ]
  }

  if (rota.path === '/cortes') {
    return [
      trilha,
      pagina(),
      {
        '@type': 'ItemList',
        '@id': `${url}#lista`,
        name: 'Cortes feitos na Barbearia Silverado',
        itemListElement: PAGINAS_CORTE.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BUSINESS.url}${p.path}`,
          name: p.corte.name,
        })),
      },
    ]
  }

  if (rota.path === '/perguntas-frequentes') return [trilha, pagina(), faq(PERGUNTAS_GERAIS)]

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
        // E.164 legível: +55 62 99857-5858.
        telephone: `+${BUSINESS.whatsapp.slice(0, 2)} ${BUSINESS.whatsapp.slice(2, 4)} ${BUSINESS.whatsapp.slice(4, 9)}-${BUSINESS.whatsapp.slice(9)}`,
        email: BUSINESS.email,
        image: [
          `${BUSINESS.url}/og.jpg`,
          `${BUSINESS.url}/images/hero-shop.jpg`,
          ...CUTS.slice(0, 3).map((c) => `${BUSINESS.url}/images/${c.image}-1280.webp`),
        ],
        logo: `${BUSINESS.url}/images/logo-wordmark.png`,
        priceRange: 'R$ 10 a R$ 90',
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
        sameAs: [BUSINESS.instagram, BUSINESS.threads, GOOGLE_PROFILE],
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
          'Pigmentação de barba',
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
                // Só existem as versões otimizadas (o .jpg nunca foi publicado).
                contentUrl: `${BUSINESS.url}/images/${cut.image}-1280.webp`,
                url: `${BUSINESS.url}/cortes/${cut.id}`,
              })),
            },
          ]
        : []),
      ...nosDaRota(caminho),
    ],
  }
}
