import React from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import Image from 'next/image';

export const metadata = {
  title: 'Register | RTPA Project Prioritization',
  description: 'Create an account to access your agency\'s transportation planning platform',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Image/Info (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-rtpa-green-500">
        <div className="flex flex-col justify-center items-center w-full p-12 text-white">
          <h1 className="text-4xl font-bold mb-6">Join Your Agency&apos;s Platform</h1>
          <p className="text-xl mb-8 max-w-lg text-center">
            Create an account to collaborate on transportation planning and prioritization with your team.
          </p>
          <ul className="space-y-4 max-w-md">
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Manage your transportation projects in one centralized platform</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Score and prioritize projects based on customizable criteria</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Visualize project data with interactive maps and dashboards</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Generate reports and insights with AI assistance</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Engage with community feedback in a structured way</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 py-12">
        <div className="w-full max-w-md mb-12">
          <div className="text-center">
            <Image
              src="/logo.svg"
              alt="RTPA Logo"
              width={200}
              height={60}
              className="mx-auto"
            />
          </div>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
