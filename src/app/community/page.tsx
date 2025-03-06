import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createServerComponentClient } from '@/lib/supabase/server';
import { ProjectStatus } from '@/types';
import CommunityFeaturedProjects from '@/components/community/featured-projects';
import CommunityMapPreview from '@/components/community/map-preview';

export const metadata = {
  title: 'Community Engagement Portal | RTPA Project Prioritization',
  description: 'Provide feedback on transportation projects in your community',
};

export default async function CommunityHomePage() {
  const supabase = await createServerComponentClient();
  
  // Get current selected agency
  // In a real app, you might get this from a cookie or query parameter
  const defaultAgencyId = 'agency-id'; // Replace with actual logic
  
  // Fetch featured projects (active, high score, with feedback)
  const { data: featuredProjects } = await supabase
    .from('projects')
    .select('id, title, description, status, primary_category, score_total, geom')
    .eq('agency_id', defaultAgencyId)
    .in('status', ['active', 'planned'] as ProjectStatus[])
    .order('score_total', { ascending: false })
    .limit(3);
  
  // Get project count
  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact' })
    .eq('agency_id', defaultAgencyId);
  
  // Get feedback count
  const { count: feedbackCount } = await supabase
    .from('feedback')
    .select('id', { count: 'exact' })
    .eq('agency_id', defaultAgencyId);
  
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
        <div className="mx-auto">
          <div className="relative shadow-xl sm:overflow-hidden rounded-2xl">
            <div className="absolute inset-0">
              <Image
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1573979429769-4d6d8097cd3f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
                alt="Transportation infrastructure"
                fill
                priority
              />
              <div className="absolute inset-0 bg-rtpa-blue-700 mix-blend-multiply" />
            </div>
            <div className="relative px-6 py-16 sm:px-12 sm:py-24 lg:py-32 lg:px-8">
              <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Shape the Future of</span>
                <span className="block text-rtpa-blue-200">Transportation in Your Community</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
                Explore transportation projects in your area, provide valuable feedback, and help prioritize improvements that matter most to your community.
              </p>
              <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                  <Link
                    href="/community/projects"
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-rtpa-blue-700 bg-white hover:bg-rtpa-blue-50 sm:px-8"
                  >
                    View Projects
                  </Link>
                  <Link
                    href="/community/feedback"
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-rtpa-blue-500 hover:bg-rtpa-blue-600 sm:px-8"
                  >
                    Provide Feedback
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-rtpa-blue-700 rounded-lg shadow-xl overflow-hidden">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Trusted by the community
            </h2>
            <p className="mt-3 text-xl text-rtpa-blue-200 sm:mt-4">
              Join thousands of community members who are actively shaping the future of transportation
            </p>
          </div>
          <dl className="mt-10 text-center sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-rtpa-blue-200">
                Projects
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                {count || 0}
              </dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-rtpa-blue-200">
                Community Feedback
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                {feedbackCount || 0}
              </dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-rtpa-blue-200">
                Agencies
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                10+
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Featured Projects */}
      <div>
        <div className="pb-5 border-b border-gray-200 mb-8">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">Featured Projects</h2>
          <p className="mt-2 max-w-4xl text-xl text-gray-500">
            Explore current transportation projects and share your feedback
          </p>
        </div>
        
        <CommunityFeaturedProjects projects={featuredProjects || []} />

        <div className="mt-8 text-center">
          <Link
            href="/community/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700"
          >
            View All Projects
            <svg
              className="ml-2 -mr-1 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Map Preview */}
      <div>
        <div className="pb-5 border-b border-gray-200 mb-8">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">Project Map</h2>
          <p className="mt-2 max-w-4xl text-xl text-gray-500">
            Visualize projects in your area and discover what&apos;s happening near you
          </p>
        </div>
        
        <div className="bg-white rounded-lg overflow-hidden shadow-lg h-[500px]">
          <CommunityMapPreview agencyId={defaultAgencyId} />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/community/map"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-rtpa-blue-700 bg-white hover:bg-gray-50"
          >
            Explore Full Map
            <svg
              className="ml-2 -mr-1 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div>
        <div className="pb-5 border-b border-gray-200 mb-8">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">How It Works</h2>
          <p className="mt-2 max-w-4xl text-xl text-gray-500">
            Join the community in shaping the future of transportation
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rtpa-blue-100 text-rtpa-blue-600 mb-4">
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">1. Explore Projects</h3>
              <p className="mt-2 text-base text-gray-500">
                Browse current and planned transportation projects in your community. View details, locations, and existing feedback.
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rtpa-blue-100 text-rtpa-blue-600 mb-4">
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">2. Provide Feedback</h3>
              <p className="mt-2 text-base text-gray-500">
                Share your thoughts, concerns, and suggestions about specific projects or general transportation needs in your area.
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-rtpa-blue-100 text-rtpa-blue-600 mb-4">
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">3. Make an Impact</h3>
              <p className="mt-2 text-base text-gray-500">
                Your feedback helps agencies prioritize and improve transportation projects. Together, we can create a better transportation system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-rtpa-blue-700 rounded-lg shadow-xl overflow-hidden">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get involved?</span>
            <span className="block text-rtpa-blue-200">Join the conversation today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/community/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-rtpa-blue-700 bg-white hover:bg-rtpa-blue-50"
              >
                Register Now
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/community/projects"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-rtpa-blue-500 hover:bg-rtpa-blue-600"
              >
                Browse Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
