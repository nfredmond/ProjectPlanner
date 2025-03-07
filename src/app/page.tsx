import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch projects with error handling
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">RTPA Project Prioritization</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error loading projects: {error.message}</p>
          </div>
        )}
        
        {!error && projects && projects.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {projects.map((project) => (
              <li key={project.id} className="py-3">
                <Link href={`/projects/${project.id}`} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded">
                  <span className="font-medium">{project.title}</span>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <p className="text-gray-500">No projects found. Get started by creating your first project.</p>
        ) : null}
        
        <div className="mt-4">
          <Link 
            href="/projects" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            View All Projects
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
            </li>
            <li>
              <Link href="/map" className="text-blue-600 hover:underline">Project Map</Link>
            </li>
            <li>
              <Link href="/prioritization" className="text-blue-600 hover:underline">Prioritization Tool</Link>
            </li>
            <li>
              <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
            </li>
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-600 mb-4">
            Welcome to the RTPA Project Prioritization platform. This tool helps transportation agencies manage, 
            analyze, and prioritize projects based on customizable criteria.
          </p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  color: string;
}

function FeatureCard({ title, description, href, color }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col h-full bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden border border-gray-100"
    >
      <div className={`${color} h-2 w-full`}></div>
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center font-heading">
          {title}
          <ArrowRightIcon className="ml-2 h-5 w-5 text-gray-400 group-hover:text-rtpa-blue-500 group-hover:translate-x-1 transition-all" />
        </h2>
        <p className="text-gray-600 flex-grow font-body">{description}</p>
      </div>
    </Link>
  )
} 