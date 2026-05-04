import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Montreal in an Hour',
  description:
    'See everywhere reachable in under one hour on the STM metro and bus network.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
