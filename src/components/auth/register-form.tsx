'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';

const registerSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  agency: z.string().min(1, { message: 'Please select an agency' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<Array<{ id: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  // Fetch agencies on component mount
  React.useEffect(() => {
    async function fetchAgencies() {
      try {
        const { data, error } = await supabase
          .from('agencies')
          .select('id, name')
          .order('name');

        if (error) {
          throw error;
        }

        setAgencies(data || []);
      } catch (error: any) {
        console.error('Error fetching agencies:', error.message);
      }
    }

    fetchAgencies();
  }, [supabase]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User registration failed');
      }

      // 2. Create profile in the database
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        agency_id: data.agency,
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'viewer', // Default role
      });

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        // but Supabase doesn't provide an easy way to do this from the client
        throw profileError;
      }

      // Redirect to login page with success message
      router.push('/login?registered=true');
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Join your agency&apos;s transportation planning platform
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="rounded-md shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName', { required: true })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rtpa-blue-500 focus:border-rtpa-blue-500 sm:text-sm"
              />
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName', { required: true })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rtpa-blue-500 focus:border-rtpa-blue-500 sm:text-sm"
              />
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email', { required: true })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rtpa-blue-500 focus:border-rtpa-blue-500 sm:text-sm"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password', { required: true })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rtpa-blue-500 focus:border-rtpa-blue-500 sm:text-sm"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="agency" className="block text-sm font-medium text-gray-700">
              Agency
            </label>
            <select
              id="agency"
              {...register('agency', { required: true })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rtpa-blue-500 focus:border-rtpa-blue-500 sm:text-sm"
            >
              <option value="">Select your agency</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
            {errors.agency && (
              <p className="mt-2 text-sm text-red-600">{errors.agency.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-rtpa-blue-600 hover:text-rtpa-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
