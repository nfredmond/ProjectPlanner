'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon, 
  MapIcon, 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface CommunityHeaderProps {
  agencies: {
    id: string;
    name: string;
    logo_url?: string;
  }[];
}

export default function CommunityHeader({ agencies }: CommunityHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agencyMenuOpen, setAgencyMenuOpen] = useState(false);
  
  // Navigation items
  const navigation = [
    { name: 'Home', href: '/community', icon: HomeIcon },
    { name: 'Projects', href: '/community/projects', icon: DocumentTextIcon },
    { name: 'Map', href: '/community/map', icon: MapIcon },
    { name: 'Feedback', href: '/community/feedback', icon: ChatBubbleLeftRightIcon },
  ];
  
  // Get selected agency name from local storage if available
  const getSelectedAgencyName = () => {
    if (typeof window !== 'undefined') {
      const selectedAgencyId = localStorage.getItem('selectedAgencyId');
      if (selectedAgencyId) {
        const agency = agencies.find(a => a.id === selectedAgencyId);
        return agency?.name || 'Select Agency';
      }
    }
    return 'Select Agency';
  };
  
  // Handle agency selection
  const handleAgencySelect = (agencyId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAgencyId', agencyId);
      window.location.reload(); // Reload to apply agency selection
    }
    setAgencyMenuOpen(false);
  };
  
  return (
    <header className="bg-white shadow">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
          <div className="flex items-center">
            <Link href="/community" className="flex items-center">
              <span className="sr-only">RTPA Community Portal</span>
              <div className="h-10 w-10 bg-rtpa-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                TP
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">Transportation Projects</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden ml-10 space-x-8 lg:block">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center text-sm font-medium ${
                    pathname === item.href
                      ? 'text-rtpa-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Agency Selector */}
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setAgencyMenuOpen(!agencyMenuOpen)}
              >
                <span>{getSelectedAgencyName()}</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              
              {agencyMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {agencies.map((agency) => (
                      <button
                        key={agency.id}
                        onClick={() => handleAgencySelect(agency.id)}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {agency.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Login/Register Links */}
            <Link
              href="/community/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/community/register"
              className="inline-flex items-center rounded-md border border-transparent bg-rtpa-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rtpa-blue-700"
            >
              Register
            </Link>
            
            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="lg:hidden py-4">
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50">
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={() => setMobileMenuOpen(false)} />
              <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                <div className="flex items-center justify-between">
                  <Link href="/community" className="-m-1.5 p-1.5">
                    <span className="sr-only">RTPA Community Portal</span>
                    <div className="h-8 w-8 bg-rtpa-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      TP
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="-m-2.5 rounded-md p-2.5 text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6 flow-root">
                  <div className="-my-6 divide-y divide-gray-500/10">
                    <div className="space-y-2 py-6">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                            pathname === item.href
                              ? 'bg-rtpa-blue-50 text-rtpa-blue-600'
                              : 'text-gray-900 hover:bg-gray-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-6 w-6" />
                            {item.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="py-6">
                      <Link
                        href="/community/login"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/community/register"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-rtpa-blue-600 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
