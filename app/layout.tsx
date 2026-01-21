import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HonestNomad - AI Trip Planner',
  description: 'One sentence. One complete trip. Flights, hotels, and a personalized itinerary - all planned for you by AI.',
  keywords: ['trip planner', 'AI travel', 'flight booking', 'hotel booking', 'travel itinerary'],
  openGraph: {
    title: 'HonestNomad - AI Trip Planner',
    description: 'One sentence. One complete trip. Tell us where you want to go.',
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
