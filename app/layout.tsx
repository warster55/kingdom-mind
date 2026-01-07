import type { Metadata } from 'next';
import { Crimson_Pro, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import SessionProvider from '@/components/providers/SessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';

const serif = Crimson_Pro({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kingdom Mind',
  description: 'Be transformed by the renewing of your mind - Romans 12:2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable} ${mono.variable} font-serif antialiased bg-background-primary text-text-primary transition-colors duration-500`}>
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}