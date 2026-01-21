import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Vacation Setup | HonestNomad',
  description: 'Set up your travel preferences for instant vacation planning',
};

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
