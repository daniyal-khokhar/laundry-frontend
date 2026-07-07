import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

// Google se download karne ke bajaye system ke default fonts use karte hain 
// taake Turbopack crash na ho
export const metadata: Metadata = {
  title: 'Decent Laundry Management',
  description: 'Manage laundry orders smoothly',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* direct tailwind ki sans classes add kar di hain */}
      <body className="antialiased font-sans bg-gray-50/50" suppressHydrationWarning>
        <div className="flex h-screen w-screen overflow-hidden">
          
          {/* Sidebar */}
          <div className="hidden md:block shrink-0 border-r border-gray-200">
            <Sidebar />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
            {/* Top Navbar */}
            <Navbar />
            
            {/* Dynamic Pages Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}