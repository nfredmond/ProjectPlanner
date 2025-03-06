'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types';
import { createClientComponentClient } from '@/lib/supabase/client';
import {
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { NotificationBell } from './notification-bell';

interface HeaderProps {
  profile: UserProfile;
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setIsProfileMenuOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left side - Search */}
        <div className="flex-1 min-w-0 md:px-2 lg:px-0">
          <div className="max-w-lg">
            <div className="relative text-gray-500 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                type="search"
                placeholder="Search projects..."
                className="block w-full bg-gray-100 border border-transparent rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:border-rtpa-blue-500 focus:ring-1 focus:ring-rtpa-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            <span className="sr-only">View notifications</span>
            <NotificationBell userId={profile.id} />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-rtpa-blue-500"
              onClick={toggleProfileMenu}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-rtpa-blue-500 flex items-center justify-center text-white font-medium">
                {profile.first_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
              </div>
            </button>

            {/* Dropdown menu */}
            {isProfileMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1 border-b">
                  <div className="px-4 py-2 text-sm text-gray-700">
                    <div className="font-medium">{profile.first_name} {profile.last_name}</div>
                    <div className="text-gray-500 truncate">{profile.email}</div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserCircleIcon className="mr-3 h-5 w-5 text-gray-500" />
                    Your Profile
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-500" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
