import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, AuthState, AppRole, UserProfile } from "@/hooks/useAuth";

interface AuthContextType extends AuthState {
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: AppRole
  ) => Promise<{ success: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; role?: AppRole }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
