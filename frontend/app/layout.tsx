import type { Metadata } from 'next'
import { Oswald, Inter, Playfair_Display } from 'next/font/google'
import Providers from './components/Providers'
import SessionManager from './components/SessionManager'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '1Kappa | One Brotherhood. Infinite Impact',
  description: 'A digital home for Kappa brothers worldwide. Community, Commerce, Culture, and Contribution. Shop authentic merchandise from verified fraternity members.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-cream dark:bg-black text-midnight-navy dark:text-gray-100 transition-colors">
        <Providers>
          <SessionManager />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

