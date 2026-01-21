import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Vacation | HonestNomad',
  description: 'Instant vacation planning - pick your dates, swipe to book',
};

export default function FlashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
