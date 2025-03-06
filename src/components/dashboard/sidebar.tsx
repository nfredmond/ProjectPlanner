'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  MapIcon, 
  UserGroupIcon, 
  CogIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userData?: {
    role?: string;
  };
}

export default function Sidebar({ userData }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userData?.role === 'admin';

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: ChartBarIcon,
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: ClipboardDocumentListIcon,
    },
    {
      name: 'Prioritization',
      href: '/prioritization',
      icon: CalendarIcon,
    },
    {
      name: 'Map',
      href: '/map',
      icon: MapIcon,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: DocumentTextIcon,
    },
    {
      name: 'Community',
      href: '/community/feedback',
      icon: UserGroupIcon,
    },
  ];

  const adminNavigation = [
    {
      name: 'Admin',
      href: '/admin',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 p-4">
      <div className="mb-8 px-4">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-xl font-bold">Project Planner</span>
        </Link>
      </div>
      
      <nav className="space-y-1 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {isAdmin && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Administration
          </h3>
          <nav className="mt-2 space-y-1">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
      
      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="px-4 py-2 text-sm text-gray-400">
          <div>Logged in as:</div>
          <div className="font-medium text-white">User</div>
        </div>
      </div>
    </div>
  );
} 