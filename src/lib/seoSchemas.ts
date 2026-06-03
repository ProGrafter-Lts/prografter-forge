export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "ProGrafter Ltd",
  url: "https://prografter.co.uk",
  logo: "https://prografter.co.uk/og-image.png",
  image: "https://prografter.co.uk/og-image.png",
  founder: { "@type": "Person", name: "Lee Palfreeman" },
  address: {
    "@type": "PostalAddress",
    addressRegion: "Nottinghamshire",
    addressCountry: "GB",
  },
  identifier: { "@type": "PropertyValue", propertyID: "Companies House", value: "17124130" },
  areaServed: { "@type": "Country", name: "United Kingdom" },
};

export const buildServiceJsonLd = (opts: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  price?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: opts.name,
  description: opts.description,
  serviceType: opts.serviceType,
  url: opts.url,
  provider: { "@type": "Organization", name: "ProGrafter Ltd", url: "https://prografter.co.uk" },
  areaServed: { "@type": "Country", name: "United Kingdom" },
  ...(opts.price
    ? { offers: { "@type": "Offer", price: opts.price, priceCurrency: "GBP" } }
    : {}),
});

export const homepageFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does ProGrafter cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ProGrafter is free to register and free to post a job. Trades only pay 7.5% commission when a job completes, capped at £900 per job. There are no monthly fees.",
      },
    },
    {
      "@type": "Question",
      name: "How are trades verified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every trade is checked for ID, public liability insurance, and trade qualifications before being approved on the platform.",
      },
    },
    {
      "@type": "Question",
      name: "Where is ProGrafter available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ProGrafter operates across the United Kingdom, with initial coverage focused around Nottinghamshire and expanding nationally.",
      },
    },
    {
      "@type": "Question",
      name: "When do I pay?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Homeowners post jobs free. Trades pay nothing until a job is marked complete and approved — then a 7.5% commission applies, capped at £900 per job.",
      },
    },
  ],
};
