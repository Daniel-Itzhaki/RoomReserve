import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

const lato = Lato({ 
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Room Reserve - Meeting Room Booking',
  description: 'Internal office meeting room booking system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={lato.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
