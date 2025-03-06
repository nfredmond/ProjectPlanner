import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Hero section */}
      <div className="w-full max-w-7xl mb-16 text-center px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 font-heading">
          Welcome to the RTPA Project Prioritization Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
          Streamline transportation project evaluation, enhance decision-making, and engage with stakeholders.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4">
        <FeatureCard 
          title="Projects" 
          description="View and manage transportation projects."
          href="/projects"
          color="bg-rtpa-blue-500"
        />
        
        <FeatureCard 
          title="Map" 
          description="Explore projects on an interactive map."
          href="/map"
          color="bg-rtpa-green-500"
        />
        
        <FeatureCard 
          title="Prioritization" 
          description="Score and prioritize projects based on criteria."
          href="/prioritization"
          color="bg-rtpa-blue-600"
        />
        
        <FeatureCard 
          title="Community" 
          description="Engage with the community and gather feedback."
          href="/community"
          color="bg-rtpa-green-600"
        />
      </div>
    </div>
  )
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