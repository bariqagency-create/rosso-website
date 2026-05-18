import './globals.css';

export const metadata = {
  metadataBase: new URL('https://rosso.auto'),
  title: {
    default: 'ROSSO — Precision in Motion | Luxury Service for BMW, MINI, Range Rover & Jaguar',
    template: '%s | ROSSO Automotive',
  },
  description:
    'ROSSO is a premium independent service specialist for BMW, MINI, Range Rover and Jaguar. Master technicians, dealer-grade diagnostics, genuine OEM parts, and white-glove customer experience. Book your appointment online.',
  keywords: [
    'BMW service Egypt',
    'MINI service center',
    'Range Rover specialist',
    'Jaguar repair',
    'luxury car service Cairo',
    'BMW specialist New Cairo',
    'European car maintenance',
    'ROSSO automotive',
    'premium car workshop',
    'مركز خدمة بي ام دبليو',
    'صيانة ميني',
    'خدمة رينج روفر',
    'صيانة جاكوار',
  ],
  authors: [{ name: 'ROSSO Automotive' }],
  creator: 'ROSSO Automotive',
  publisher: 'ROSSO Automotive',
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_EG'],
    url: 'https://rosso.auto',
    siteName: 'ROSSO',
    title: 'ROSSO — Precision in Motion',
    description:
      'Authorized luxury service for BMW, MINI, Range Rover and Jaguar. Operated by master technicians. Engineered for those who refuse compromise.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ROSSO Automotive — Premium Service Center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ROSSO — Precision in Motion',
    description:
      'Authorized luxury service for BMW, MINI, Range Rover and Jaguar.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
    languages: { 'en-US': '/', 'ar-EG': '/ar' },
  },
  category: 'automotive',
};

export const viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// Structured data for SEO (JSON-LD)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutomotiveBusiness',
  name: 'ROSSO Automotive',
  description:
    'Premium independent service specialist for BMW, MINI, Range Rover and Jaguar.',
  image: 'https://rosso.auto/og-image.jpg',
  '@id': 'https://rosso.auto',
  url: 'https://rosso.auto',
  telephone: '+201101139997',
  priceRange: '$$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Street 3, Industrial Area, New Cairo 3',
    addressLocality: 'New Cairo',
    addressRegion: 'Cairo Governorate',
    postalCode: '11865',
    addressCountry: 'EG',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 29.9714364,
    longitude: 31.4853452,
  },
  hasMap: 'https://maps.app.goo.gl/D8RtZDZzfygNJ85D7',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    opens: '09:00',
    closes: '19:00',
  },
  sameAs: [
    'https://www.facebook.com/profile.php?id=61586938598802',
    'https://www.instagram.com/rosso_as/',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '847',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Audiowide&family=Archivo:wght@300;400;500;600;700;800;900&family=Archivo+Black&family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700;900&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-ink-300 text-white antialiased">{children}</body>
    </html>
  );
}
