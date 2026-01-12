import type { Metadata } from 'next';
import { Crimson_Pro, Inter, JetBrains_Mono, Great_Vibes } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { ConfigProvider } from '@/lib/contexts/ConfigContext';
import SessionProvider from '@/components/providers/SessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import fs from 'fs';
import path from 'path';

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

const script = Great_Vibes({
  weight: '400',
  variable: '--font-script',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kingdom Mind',
  description: 'Be transformed by the renewing of your mind - Romans 12:2',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let version = 'v0.0.0';
  try {
    version = fs.readFileSync(path.join(process.cwd(), 'VERSION.txt'), 'utf8').trim();
  } catch (e) {}

  return (
    <html lang="en" suppressHydrationWarning className="h-full w-full">
      <body 
        data-km-version={version}
        className={`${serif.variable} ${sans.variable} ${mono.variable} ${script.variable} font-serif antialiased bg-background-primary text-text-primary transition-colors duration-500 h-full w-full overflow-hidden`}
      >
        <SessionProvider>
          <QueryProvider>
            <ConfigProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </ConfigProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}