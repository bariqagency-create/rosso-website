import BookingsDashboard from '@/components/BookingsDashboard';

export const metadata = {
  title: 'Bookings Dashboard',
  description: 'View and manage ROSSO service bookings.',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <BookingsDashboard />;
}
