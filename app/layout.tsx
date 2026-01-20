import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HonestNomad - AI Hotel Booking Assistant',
  description: 'Tell us where you want to go. We\'ll handle the rest. AI-powered hotel booking with personalized itineraries.',
  keywords: ['hotel booking', 'AI travel', 'trip planner', 'hotel search'],
  openGraph: {
    title: 'HonestNomad - AI Hotel Booking Assistant',
    description: 'Tell us where you want to go. We\'ll handle the rest.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
