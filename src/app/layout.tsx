import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

import { Toaster } from 'react-hot-toast';
import Bottom from '@/components/Bottom';


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
      <body className="antialiased font-sans bg-[#F4F6F9] text-gray-900" suppressHydrationWarning>
        <div className="flex h-screen w-screen overflow-hidden">
          
          {/* Sidebar - Desktop par dikhay ga, Mobile par mukammal hide */}
          <div className="hidden md:block shrink-0 border-r border-gray-200">
            <Sidebar />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
            {/* Top Navbar */}
            <Navbar />
            
            {/* Dynamic Pages Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
              {children}
            </main>

            {/* FIXED BOTTOM NAV - Isko main tag se bahar yahan hona chahiye */}
            <Bottom />
          </div>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}