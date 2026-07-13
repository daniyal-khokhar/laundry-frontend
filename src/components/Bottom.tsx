'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHome, IoAddCircle, IoList, IoBarChart, IoStorefront } from "react-icons/io5";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: IoHome },
  { name: 'New Order', href: '/new-order', icon: IoAddCircle },
  { name: 'Orders', href: '/orders', icon: IoList },
  { name: 'Items', href: '/items', icon: IoBarChart },
  { name: 'Branches', href: '/branches', icon: IoStorefront },
];

export default function Bottom() {
  const pathname = usePathname();

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 w-full h-16 bg-gray-950 border-t border-gray-800 px-2 z-50 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-full w-full">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-10 h-[3px] bg-blue-500 rounded-b-md shadow-[0_2px_10px_rgba(59,130,246,0.5)]" />
              )}
              <item.icon className={`h-5 w-5 ${isActive ? 'scale-110 text-blue-400' : 'text-gray-400'}`} />
              <span className="text-[10px] font-medium tracking-wide mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}