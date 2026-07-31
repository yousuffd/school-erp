import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

// DESIGN_SYSTEM.md §3: Inter for UI text, IBM Plex Mono for IDs/invoice numbers/etc.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'SchoolERP',
  description: 'Platform core & Core Admin — Phase 0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plexMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
