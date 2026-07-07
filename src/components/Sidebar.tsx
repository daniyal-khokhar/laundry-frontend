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
} from "react-icons/io5";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: IoHome },
  { name: 'New Order', href: '/new-order', icon: IoAddCircle },
  { name: 'All Orders', href: '/orders', icon: IoList },
  { name: 'Reports', href: '/reports', icon: IoBarChart },
  { name: 'Branches', href: '/branches', icon: IoStorefront },
  { name: 'Settings', href: '/settings', icon: IoSettings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-72 flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white shadow-2xl border-r border-gray-800">
      
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wide">
          <span className="text-blue-400">Decent</span> Laundry
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-xl px-4 py-3
                transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-600/20 text-white shadow-md border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                }
              `}
            >
              <item.icon
                className={`h-5 w-5 transition ${
                  isActive
                    ? "text-blue-400"
                    : "text-gray-500 group-hover:text-white"
                }`}
              />

              <span className="text-sm font-medium">{item.name}</span>

              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-900/50 p-3 hover:bg-gray-800 transition">
          <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Admin</p>
            <p className="text-xs text-gray-400">admin@decent.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}