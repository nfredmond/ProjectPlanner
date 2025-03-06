import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CommunityHeader from '@/components/community/community-header';
import CommunityFooter from '@/components/community/community-footer';
import { createServerComponentClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Community Engagement Portal | RTPA Project Prioritization',
  description: 'Provide feedback on transportation projects in your community',
};

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerComponentClient();
  
  // Get agency information
  const { data: agencies } = await supabase
    .from('agencies')
    .select('id, name, logo_url')
    .order('name');
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CommunityHeader agencies={agencies || []} />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      <CommunityFooter />
    </div>
  );
}
