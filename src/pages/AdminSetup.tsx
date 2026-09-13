import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { GraduationCap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, initialized } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);

  const email = useMemo(() => user?.email ?? "", [user?.email]);

  const handleMakeMeAdmin = async () => {
    if (!user?.email) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("setup-first-admin", {
        body: { email: user.email },
      });

      if (error) {
        toast({
          title: "Admin setup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: "Admin setup failed",
          description: data?.error ?? "Unable to assign admin role.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Admin access granted",
        description: "Redirecting you to the admin dashboard…",
      });

      // Navigate immediately; ProtectedRoute will re-verify role from the backend.
      navigate("/admin", { replace: true });
    } catch {
      toast({
        title: "Admin setup failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-soft flex flex-col">
      <header className="p-4">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">ProjectSupport</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-elevated animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin setup</CardTitle>
            <CardDescription className="text-base">
              This is only needed once, when no admin exists yet.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!initialized || loading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : !user ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Please log in first, then come back to this page.
                </p>
                <Button asChild className="w-full h-11">
                  <Link to="/login">Go to login</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-sm text-muted-foreground">Logged in as</p>
                  <p className="font-medium text-foreground break-all">{email}</p>
                </div>

                <Button
                  className="w-full h-11"
                  onClick={handleMakeMeAdmin}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Setting up admin…
                    </span>
                  ) : (
                    "Make this account the first admin"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  If an admin already exists, this will be blocked for security.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
