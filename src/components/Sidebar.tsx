'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoHome,
  IoAddCircle,
  IoList,
  IoBarChart,
  IoStorefront,
  IoSettings,
  IoWaterOutline
} from "react-icons/io5";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: IoHome },
  { name: 'New Order', href: '/new-order', icon: IoAddCircle },
  { name: 'All Orders', href: '/orders', icon: IoList },
  { name: 'Items', href: '/items', icon: IoBarChart },
  { name: 'Branches', href: '/branches', icon: IoStorefront },
  { name: 'Settings', href: '/settings', icon: IoSettings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-72 hidden md:flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white shadow-2xl border-r border-gray-800 shrink-0 sticky top-0">
      
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800 gap-2">
        <IoWaterOutline className="h-5 w-5 text-blue-400" />
        <h1 className="text-lg font-bold tracking-wider uppercase select-none">
          <span className="text-blue-400">Decent</span> Laundry
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-xl px-4 py-3 relative
                transition-all duration-200 border border-transparent
                ${
                  isActive
                    ? "bg-blue-600/15 text-white shadow-md border-blue-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }
              `}
            >
              {/* Left edge indicator for Active Tab */}
              {isActive && (
                <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-blue-500" />
              )}

              <item.icon
                className={`h-4.5 w-4.5 transition-colors duration-200 ${
                  isActive
                    ? "text-blue-400"
                    : "text-gray-500 group-hover:text-white"
                }`}
              />

              <span className="text-sm font-medium tracking-wide">{item.name}</span>

              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section / Footer Account Profile */}
      <div className="border-t border-gray-800 p-4 bg-gray-950/40">
        <div className="flex items-center gap-3 rounded-xl bg-gray-900/40 border border-gray-800/40 p-3 hover:bg-gray-800/50 transition duration-200 group cursor-pointer">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/10 select-none transform transition-transform group-hover:scale-105">
            M
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Admin Account</p>
            <p className="text-[11px] text-gray-500 truncate font-medium">admin@decent.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}