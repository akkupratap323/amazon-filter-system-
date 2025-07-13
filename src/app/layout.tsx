import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UltraFastFilterProvider } from '@/context/UltraFastFilterContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business Intelligence Dashboard',
  description: 'Interactive filtering and data visualization dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + ' bg-slate-50 dark:bg-gray-900 transition-colors min-h-screen'}>
        <UltraFastFilterProvider>
          <ThemeToggle />
          {children}
          {/* Footer */}
          <footer className="w-full mt-12 py-6 bg-white/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-300 text-sm shadow-inner">
            <span>Business Intelligence Dashboard &copy; {new Date().getFullYear()} &middot; Crafted with <span className="text-red-500">♥</span> by Your Team</span>
          </footer>
        </UltraFastFilterProvider>
      </body>
    </html>
  );
}
