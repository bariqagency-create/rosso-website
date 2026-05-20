import InvoicePage from '@/components/InvoicePage';

export const metadata = {
  title: 'Invoice — ROSSO',
  robots: { index: false, follow: false },
};

export default function Page({ params }) {
  return <InvoicePage bookingId={params.bookingId} />;
}
