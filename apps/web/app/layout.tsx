import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: 'Claude Code Observatory',
  description: 'Monitor and analyze your Claude Code sessions, token usage, and costs',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* suppressHydrationWarning on body prevents errors from browser extensions */}
      <body
        className={`${inter.variable} ${orbitron.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Background elements */}
        <div className="retro-grid" aria-hidden="true" />
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-t from-purple-900 to-pink-600 rounded-full blur-[120px] opacity-20 -z-10 pointer-events-none"
          aria-hidden="true"
        />

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
