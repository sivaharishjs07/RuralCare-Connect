'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/lib/types/database';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  profileError: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileError(null);
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setProfile(null);
      setProfileError('Unable to retrieve your profile. Please try again.');
      return;
    }

    if (!data) {
      setProfile(null);
      setProfileError(
        'Your account is authenticated, but no application profile was found. Please contact your administrator to be assigned a role.'
      );
      return;
    }

    setProfile(data as Profile);
    setProfileError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabaseClient.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setLoading(true);
          fetchProfile(newSession.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setProfileError(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileError(null);
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    profileError,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
