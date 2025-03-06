'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export function ModernNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: ClipboardDocumentListIcon },
    { name: 'Map', href: '/map', icon: MapIcon },
    { name: 'Prioritization', href: '/prioritization', icon: ClipboardDocumentListIcon },
    { name: 'Community', href: '/community', icon: UsersIcon },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm z-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16">
          {/* Logo - left aligned */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-auto relative">
                <Image 
                  src="/Green DOT Logo - Gray Text.png" 
                  alt="Company Logo" 
                  width={160} 
                  height={32} 
                  priority
                  className="object-contain"
                />
              </div>
              <span className="ml-2 text-gray-900 font-medium hidden md:block">RTPA Prioritization</span>
            </Link>
          </div>
          
          {/* Navigation - centered */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-12">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200
                    ${active 
                      ? 'border-rtpa-blue-500 text-rtpa-blue-600' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  <item.icon className={`mr-1 h-5 w-5 ${active ? 'text-rtpa-blue-500' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile menu button - right aligned */}
          <div className="md:hidden flex items-center ml-auto">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rtpa-blue-500"
            >
              <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    active
                      ? 'bg-rtpa-blue-50 border-rtpa-blue-500 text-rtpa-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${active ? 'text-rtpa-blue-500' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
} 