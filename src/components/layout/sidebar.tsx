'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserProfile } from '@/types';
import Image from 'next/image';
import {
  HomeIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  profile: UserProfile & { 
    agencies: { 
      name: string;
      logo_url?: string;
    }
  };
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user has admin rights
  const isAdmin = profile.role === 'admin';
  
  // Add null checking for pathname
  const isCurrentPath = (path: string) => pathname === path;
  const pathStartsWith = (prefix: string) => pathname?.startsWith(prefix) || false;

  // Create the navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: isCurrentPath('/dashboard'),
    },
    {
      name: 'Projects',
      icon: BriefcaseIcon,
      children: [
        { name: 'All Projects', href: '/projects' },
        { name: 'Add New Project', href: '/projects/new' },
        { name: 'Prioritization', href: '/projects/prioritization' },
      ],
      current: pathStartsWith('/projects'),
      id: 'projects',
    },
    {
      name: 'Map',
      href: '/map',
      icon: MapIcon,
      current: pathStartsWith('/map'),
    },
    {
      name: 'Community',
      href: '/community',
      icon: UsersIcon,
      current: pathStartsWith('/community'),
    },
    {
      name: 'Reports',
      icon: ChartBarIcon,
      children: [
        { name: 'Score Reports', href: '/reports/scores' },
        { name: 'Project Reports', href: '/reports/projects' },
        { name: 'Community Insights', href: '/reports/community' },
      ],
      current: pathStartsWith('/reports'),
      id: 'reports',
    },
  ];

  // Add admin settings if user is admin
  if (isAdmin) {
    navigationItems.push({
      name: 'Admin',
      href: '/admin',
      icon: Cog6ToothIcon,
      current: pathStartsWith('/admin'),
    });
  }

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prevState) => {
      if (prevState.includes(menuId)) {
        return prevState.filter((id) => id !== menuId);
      } else {
        return [...prevState, menuId];
      }
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 m-4">
        <button 
          onClick={toggleMobileMenu}
          className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rtpa-blue-500 p-2 rounded-md"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar container */}
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Agency logo and name */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            {profile.agencies.logo_url ? (
              <Image 
                src={profile.agencies.logo_url} 
                alt={profile.agencies.name} 
                width={40} 
                height={40}
                className="rounded"
              />
            ) : (
              <div className="w-10 h-10 bg-rtpa-blue-100 text-rtpa-blue-700 rounded flex items-center justify-center font-bold">
                {profile.agencies.name.charAt(0)}
              </div>
            )}
            <span className="ml-3 font-medium text-gray-900 truncate max-w-[160px]">
              {profile.agencies.name}
            </span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navigationItems.map((item) => 
            item.children ? (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.id!)}
                  className={`
                    flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-sm font-medium
                    ${item.current ? 'bg-rtpa-blue-50 text-rtpa-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </div>
                  {openMenus.includes(item.id!) ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
                
                {openMenus.includes(item.id!) && (
                  <div className="pl-10 space-y-1">
                    {item.children.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`
                          block px-3 py-2 rounded-md text-sm font-medium
                          ${pathname === subItem.href 
                            ? 'bg-rtpa-blue-50 text-rtpa-blue-700' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                        `}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${item.current 
                    ? 'bg-rtpa-blue-50 text-rtpa-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          )}
        </nav>
        
        {/* User profile */}
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-rtpa-blue-500 flex items-center justify-center text-white font-medium">
                {profile.first_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[160px]">
                {profile.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
