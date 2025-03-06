'use client';

import React from 'react';
import Link from 'next/link';
import { 
  BellIcon, 
  UserIcon, 
  Bars3Icon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  toggleSidebar?: () => void;
  userData?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export default function Header({ toggleSidebar, userData }: HeaderProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between">
      <div className="flex items-center lg:hidden">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleSidebar}
          className="mr-2 h-9 w-9 p-0"
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="hidden md:block text-sm text-left">
                <div className="font-medium">
                  {userData?.first_name && userData?.last_name 
                    ? `${userData.first_name} ${userData.last_name}`
                    : 'User Profile'}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[150px]">
                  {userData?.email || 'user@example.com'}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 