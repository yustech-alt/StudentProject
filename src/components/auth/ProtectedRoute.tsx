import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";
import { FullPageSpinner } from "@/components/ui/spinner";
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  allowedRoles?: AppRole[];
}

/**
 * ProtectedRoute component that verifies authentication and role on both client and server side.
 * 
 * - Checks Supabase session validity (server-side verification)
 * - Verifies user role from database (not just client state)
 * - Redirects to login if not authenticated
 * - Redirects to appropriate dashboard if role doesn't match
 */
export function ProtectedRoute({ 
  children, 
  requiredRole,
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, role, loading, initialized } = useAuthContext();
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [serverRole, setServerRole] = useState<AppRole | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!initialized) return;
      
      if (!user) {
        setVerifying(false);
        setVerified(false);
        return;
      }

      try {
        // Verify session is still valid with Supabase (server-side check)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setVerifying(false);
          setVerified(false);
          return;
        }

        // Verify role from database (not client state)
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError || !roleData) {
          logError('ProtectedRoute:verifyRole', roleError);
          setVerifying(false);
          setVerified(false);
          return;
        }

        setServerRole(roleData.role as AppRole);
        setVerified(true);
        setVerifying(false);
      } catch (error) {
        logError('ProtectedRoute:verifySession', error);
        setVerifying(false);
        setVerified(false);
      }
    };

    verifySession();
  }, [user, initialized]);

  // Show loading state while checking auth
  if (loading || !initialized || verifying) {
    return <FullPageSpinner label="Verifying access..." />;
  }

  // Not authenticated - redirect to login
  if (!user || !verified) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  const effectiveRole = serverRole || role;
  
  if (requiredRole && effectiveRole !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    const redirectPath = effectiveRole === 'admin' 
      ? '/admin' 
      : effectiveRole === 'expert' 
        ? '/expert' 
        : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    const redirectPath = effectiveRole === 'admin' 
      ? '/admin' 
      : effectiveRole === 'expert' 
        ? '/expert' 
        : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
