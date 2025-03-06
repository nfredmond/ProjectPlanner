import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Montserrat } from 'next/font/google';
import Image from 'next/image';
import { ModernNavbar } from '@/components/layout/modern-navbar';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RTPA Project Prioritization',
  description: 'A tool for Regional Transportation Planning Agencies to manage and prioritize transportation projects',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${montserrat.variable} ${inter.variable} font-sans antialiased h-full bg-gray-50`}>
        <div className="min-h-screen flex flex-col">
          <ModernNavbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center">
                <div className="mb-2">
                  <Image 
                    src="/Green DOT Logo - All Dark Gray Text.png" 
                    alt="Company Logo" 
                    width={120} 
                    height={24} 
                    className="object-contain"
                  />
                </div>
                <p className="text-center text-sm text-gray-500">
                  © {new Date().getFullYear()} RTPA Project Prioritization Platform
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
