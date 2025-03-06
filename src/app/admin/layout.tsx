import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Settings, 
  BarChart, 
  FileText, 
  Home, 
  Mail, 
  Bell, 
  Database,
  Link as LinkIcon
} from 'lucide-react';

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Projects",
    href: "/admin/projects",
    icon: FileText,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Email Templates",
    href: "/admin/email-templates",
    icon: Mail,
  },
  {
    title: "Integrations",
    href: "/admin/integrations",
    icon: LinkIcon,
  },
  {
    title: "Database",
    href: "/admin/database",
    icon: Database,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerComponentClient();

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your agency settings and users</p>
      </div>
      
      {/* Admin Navigation */}
      <nav className="flex flex-wrap gap-2 mb-6">
        {adminNavItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {item.title}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
} 