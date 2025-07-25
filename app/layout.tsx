import type React from 'react';
import type { Metadata } from 'next';
import { Inter, VT323 } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Header from '@/components/header';
import Providers from '@/components/privyProvider';
import { TransactionProvider } from '@/providers/TransactionProvider';

const inter = Inter({ subsets: ['latin'] });
const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
});

export const metadata: Metadata = {
  title: 'VixDex - Crypto Trading Platform',
  description: 'Advanced crypto trading and derivatives platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${vt323.variable} bg-black text-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {' '}
          <Providers>
            <TransactionProvider>
              <Header />
              <main className="">{children}</main>
            </TransactionProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
