import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { api }      from '../utils/api';

const AuthContext = createContext(null);

const INTERNAL_ROLES = ['owner', 'manager', 'staff_accountant', 'readonly_reviewer'];

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [client,      setClient]      = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile();
      else         setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setProfile(null);
          setClient(null);
          setPermissions(null);
          setLoading(false);
          return;
        }
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          await loadProfile();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.me();
      setUser(data.user);
      setProfile(data.profile);
      setClient(data.client || null);
      setPermissions(data.permissions || null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      if (err.message?.includes('Not authenticated') || err.message?.includes('Session expired')) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setClient(null);
        setPermissions(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) throw error;
  }

  async function signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Role helpers matching backend role system
  const role       = profile?.role;
  const isOwner    = role === 'owner';
  const isManager  = role === 'manager';
  const isInternal = INTERNAL_ROLES.includes(role);
  const isClient   = role === 'client';
  // Keep isAdmin as alias for isInternal (backward compat)
  const isAdmin    = isInternal;

  return (
    <AuthContext.Provider value={{
      user, profile, client, permissions, loading,
      isOwner, isManager, isInternal, isAdmin, isClient,
      signIn, signInWithGoogle, signInWithMagicLink, signOut,
      reloadProfile: loadProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
