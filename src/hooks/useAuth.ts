import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";
import { safeValidateProfileUpdate, type ProfileUpdateInput } from "@/lib/validations";

export type AppRole = "student" | "expert" | "admin";
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  institution: string | null;
  bio: string | null;
  avatar_url: string | null;
  specialization: string | null;
  verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    loading: true,
    initialized: false,
  });

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      logError("useAuth:fetchProfile", error);
      return null;
    }
    return data as UserProfile;
  }, []);

  // Fetch user role
  const fetchRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      logError("useAuth:fetchRole", error);
      return null;
    }
    return data?.role as AppRole;
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        // Defer Supabase calls with setTimeout to prevent deadlocks
        if (session?.user) {
          setTimeout(async () => {
            const [profile, role] = await Promise.all([
              fetchProfile(session.user.id),
              fetchRole(session.user.id),
            ]);
            setState(prev => ({
              ...prev,
              profile,
              role,
              initialized: true,
            }));
          }, 0);
        } else {
          setState(prev => ({
            ...prev,
            profile: null,
            role: null,
            initialized: true,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchRole(session.user.id),
        ]).then(([profile, role]) => {
          setState(prev => ({
            ...prev,
            profile,
            role,
            initialized: true,
          }));
        });
      } else {
        setState(prev => ({ ...prev, initialized: true }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchRole]);

  // Sign up with email and password
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: AppRole = "student"
  ): Promise<{ success: boolean; error?: string }> => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Signup failed. Please try again." };
    }

    return { success: true };
  };

  // Sign in with email and password
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: AppRole }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Invalid email or password" };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Login failed. Please try again." };
    }

    // Fetch the user's role
    const role = await fetchRole(data.user.id);
    
    return { success: true, role: role || "student" };
  };

  // Sign out
  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    setState({
      user: null,
      session: null,
      profile: null,
      role: null,
      loading: false,
      initialized: true,
    });

    return { success: true };
  };

  // Update profile with client-side validation
  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!state.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate input before sending to database
    const validation = safeValidateProfileUpdate(updates);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { error } = await supabase
      .from("profiles")
      .update(validation.data as ProfileUpdateInput)
      .eq("user_id", state.user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Refresh profile
    const profile = await fetchProfile(state.user.id);
    setState(prev => ({ ...prev, profile }));

    return { success: true };
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile: () => state.user && fetchProfile(state.user.id),
    refreshRole: () => state.user && fetchRole(state.user.id),
  };
}
