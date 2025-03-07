import React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

export const metadata = {
  title: 'Sign In | RTPA Project Prioritization',
  description: 'Sign in to access your agency\'s transportation planning platform',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const registeredSuccess = searchParams.registered === 'true';
  const newAgencyRequested = searchParams.newAgency === 'true';
  
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-md flex flex-col items-center justify-center mb-8">
          <div className="flex justify-center w-full mb-4">
            <Image
              src="/logo.svg"
              alt="RTPA Logo"
              width={160}
              height={60}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mt-2">Sign In</h1>
        </div>

        {registeredSuccess && (
          <div className="mb-8 p-4 bg-green-100 text-green-800 rounded-xl border border-green-200 w-full max-w-md shadow-sm">
            <div className="flex">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="font-body">
                <p className="text-sm font-medium">
                  Registration successful! Please check your email to verify your account before signing in.
                </p>
                {newAgencyRequested && (
                  <p className="text-sm mt-2">
                    Your new organization request has been submitted. An administrator will review it and set up your organization soon.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <LoginForm />
        
        <div className="mt-8 text-center text-sm text-gray-500 font-body">
          <p>Need help? Contact support at support@rtpa.gov</p>
        </div>
      </div>

      {/* Right side - Image/Info (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-rtpa-blue-500">
        <div className="flex flex-col justify-center items-center w-full p-12 text-white">
          <h1 className="text-4xl font-bold mb-6 font-heading">RTPA Project Prioritization</h1>
          <p className="text-xl mb-8 max-w-lg text-center font-body">
            A comprehensive platform for managing, analyzing, and prioritizing transportation projects.
          </p>
          <div className="grid grid-cols-2 gap-8 max-w-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 font-heading">Interactive Mapping</h3>
              <p className="text-sm text-white text-opacity-80 font-body">
                Visualize projects with powerful GIS tools
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 font-heading">AI-Powered Insights</h3>
              <p className="text-sm text-white text-opacity-80 font-body">
                LLM assistance for analyzing projects
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 font-heading">Advanced Analytics</h3>
              <p className="text-sm text-white text-opacity-80 font-body">
                Data-driven prioritization scoring
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 font-heading">Community Engagement</h3>
              <p className="text-sm text-white text-opacity-80 font-body">
                Gather and analyze public feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
