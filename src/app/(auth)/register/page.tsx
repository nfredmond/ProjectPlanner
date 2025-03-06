import React from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Register | RTPA Project Prioritization',
  description: 'Create an account to access your agency\'s transportation planning platform',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Image/Info (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-rtpa-green-500">
        <div className="flex flex-col justify-center items-center w-full p-12 text-white">
          <h1 className="text-4xl font-bold mb-6 font-heading">Join Your Agency&apos;s Platform</h1>
          <p className="text-xl mb-8 max-w-lg text-center font-body">
            Create an account to collaborate on transportation planning and prioritization with your team.
          </p>
          <ul className="space-y-4 max-w-md">
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-body">Manage your transportation projects in one centralized platform</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-body">Score and prioritize projects based on customizable criteria</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-body">Visualize project data with interactive maps and dashboards</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-body">Generate reports and insights with AI assistance</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-body">Engage with community feedback in a structured way</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-md mb-12">
          <div className="text-center">
            <Image
              src="/logo.svg"
              alt="RTPA Logo"
              width={200}
              height={60}
              className="mx-auto"
              priority
            />
          </div>
        </div>

        <RegisterForm />
        
        <div className="mt-8 text-center text-sm font-body">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-rtpa-blue-600 hover:text-rtpa-blue-800 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
