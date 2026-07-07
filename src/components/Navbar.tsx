"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  IoNotificationsOutline, 
  IoSearchOutline, 
  IoMenuOutline, 
  IoChevronDownOutline, 
  IoLogOutOutline, 
  IoPersonOutline, 
  IoSettingsOutline,
  IoHome,
  IoAddCircle,
  IoList,
  IoBarChart,
  IoStorefront,
  IoSettings,
  IoWaterOutline // Washing machine/laundry vibe ke liye icon
} from "react-icons/io5";

// Sidebar wale saare links yahan map karne ke liye data array
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: IoHome },
  { name: 'New Order', href: '/new-order', icon: IoAddCircle },
  { name: 'All Orders', href: '/orders', icon: IoList },
  { name: 'Reports', href: '/reports', icon: IoBarChart },
  { name: 'Branches', href: '/branches', icon: IoStorefront },
  { name: 'Settings', href: '/settings', icon: IoSettings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Dropdowns ke bahar click close handling logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic Page Titles
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Overview";
    if (pathname === "/new-order") return "Create New Order";
    if (pathname === "/orders") return "Order Management";
    if (pathname === "/reports") return "Analytics & Reports";
    if (pathname === "/branches") return "Branch Configuration";
    if (pathname === "/settings") return "System Settings";
    return "Decent Laundry";
  };

  return (
    <nav className="h-16 border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900 px-6 flex items-center justify-between shadow-xl z-20 relative">
      
      {/* Left Area: Dynamic Title & Responsive Mobile Dropdown Trigger */}
      <div className="flex items-center gap-3">
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-xl border transition-all text-gray-400 hover:text-white ${isMobileMenuOpen ? 'bg-gray-800 border-gray-700 text-white' : 'border-transparent hover:bg-gray-800/60'}`}
          >
            <IoMenuOutline className="h-6 w-6" />
          </button>

          {/* MOBILE NAVIGATION DROPDOWN (Sync with Sidebar Features) */}
          {isMobileMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl border border-gray-800 bg-gray-950 p-2 text-gray-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-30">
              <div className="px-3 py-1.5 text-xs font-bold text-gray-500 tracking-wider uppercase border-b border-gray-900 mb-1">
                Navigation Menu
              </div>
              
              <div className="space-y-0.5">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-sm font-medium
                        ${isActive 
                          ? "bg-blue-600/20 text-white border border-blue-500/30" 
                          : "text-gray-400 hover:text-white hover:bg-gray-900/80"
                        }
                      `}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-gray-500"}`} />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <h1 className="text-base font-semibold text-white tracking-wide hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center: Search Bar Component */}
      <div className="hidden md:flex items-center max-w-md w-80 relative">
        <IoSearchOutline className="absolute left-3 text-gray-500 h-4 w-4" />
        <input 
          type="text" 
          placeholder="Search orders, invoices..." 
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all text-gray-200 placeholder:text-gray-500"
        />
      </div>

      {/* Right Area: Laundry Badge, Notification, User Profile */}
      <div className="flex items-center gap-4">
        
        {/* BRAND LAUNDRY ICON BADGE */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
          <IoWaterOutline className="h-4 w-4 text-blue-400 animate-bounce" />
          <span className="text-xs font-bold text-blue-400 tracking-wider uppercase hidden xs:inline select-none">
            Decent
          </span>
        </div>

        <div className="h-6 w-[1px] bg-gray-800 hidden sm:block"></div>

        {/* Notification Bell */}
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-xl transition-all border border-transparent hover:border-gray-800">
          <IoNotificationsOutline className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-950 animate-pulse"></span>
        </button>

        {/* User Account Settings Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-800/60 border border-transparent hover:border-gray-800 transition-all text-left focus:outline-none"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 text-sm">
              A
            </div>
            <IoChevronDownOutline className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180 text-white' : ''}`} />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-800 bg-gray-950 p-1.5 text-gray-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-30">
              <div className="px-3 py-2 border-b border-gray-900 mb-1">
                <p className="text-xs text-gray-400 font-medium">Logged in as</p>
                <p className="text-sm font-semibold text-white truncate">admin@decent.com</p>
              </div>

              <button 
                onClick={() => setIsUserDropdownOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/80 transition-colors"
              >
                <IoPersonOutline className="h-4 w-4" />
                <span>My Profile</span>
              </button>

              <button 
                onClick={() => setIsUserDropdownOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/80 transition-colors"
              >
                <IoSettingsOutline className="h-4 w-4" />
                <span>Account Settings</span>
              </button>

              <div className="h-[1px] bg-gray-900 my-1"></div>

              <button 
                onClick={() => setIsUserDropdownOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <IoLogOutOutline className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}