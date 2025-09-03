'use client';

import { Inter } from 'next/font/google';
import { Navigation } from '@/components/Navigation';
import { SearchProvider } from '@/components/SearchProvider';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import '@/styles/globals.css';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Sentia Manufacturing Dashboard Documentation" />
        <title>Sentia Manufacturing Dashboard - Documentation</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-white">
        <SearchProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 min-w-0">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="prose prose-lg max-w-none">
                  {children}
                </div>
                <FeedbackWidget />
              </div>
            </main>
          </div>
        </SearchProvider>
      </body>
    </html>
  );
}