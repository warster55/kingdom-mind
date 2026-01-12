import type { Metadata } from "next";
import { Crimson_Pro, Inter, JetBrains_Mono, Great_Vibes } from 'next/font/google';
import "./globals.css";
import SessionProvider from '@/components/providers/SessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import { ConfigProvider } from '@/lib/contexts/ConfigContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

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
    icon: '/favicon.ico', // Use the copied favicon.ico
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full w-full">
      <body 
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
