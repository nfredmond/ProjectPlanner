import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '@/types';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get session and user on mount
    const getSessionAndUser = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch the user's profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, agencies:agency_id(name)')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile:', error);
          } else {
            setProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error in auth setup:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSessionAndUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch the user's profile when auth state changes
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, agencies:agency_id(name)')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profile);
        } else {
          setProfile(null);
        }
        
        // Force a router refresh to update server components
        router.refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
