import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

// Paystack redirects the browser back here after checkout, appending its own
// ?reference=&trxref= params to whatever callback_url we gave it. There is no
// router state at this point - it's a fresh page load - so everything here
// is read from the URL and from the real project record, not from memory.
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project_id");
  const { projects, packages, refresh } = useApp();
  const [attempts, setAttempts] = useState(0);

  const project = projects.find((p) => p.id === projectId);
  const pkg = project ? packages.find((p) => p.id === project.packageType) : undefined;
  const confirmed = project?.paymentStatus === "paid";

  // The Paystack webhook usually lands within a second or two, but it's a
  // separate network call from a separate server, so we poll briefly rather
  // than assume it has already landed the instant the browser gets here.
  useEffect(() => {
    if (confirmed || attempts >= 10) return;
    const timer = setTimeout(async () => {
      await refresh();
      setAttempts((a) => a + 1);
    }, 1500);
    return () => clearTimeout(timer);
  }, [confirmed, attempts, refresh]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ProjectSupport</span>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-lg mx-auto text-center">
          {!project && attempts < 10 ? (
            <>
              <div className="flex justify-center mb-6">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Confirming your payment...</h1>
              <p className="text-muted-foreground">This usually takes just a few seconds.</p>
            </>
          ) : !confirmed ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-warning" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Still confirming</h1>
              <p className="text-muted-foreground mb-8">
                We haven't received confirmation yet. If you completed the payment, it can take a
                few minutes to reflect. Check your dashboard shortly, or contact support if this
                persists.
              </p>
              <Button asChild className="w-full gap-2">
                <Link to="/student">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Payment Confirmed!
              </h1>
              <p className="text-muted-foreground mb-8">
                Your project is now active. We're matching you with an expert.
              </p>

              <Card className="shadow-elevated mb-8 text-left">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Project</p>
                      <p className="font-medium text-foreground">{project.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Package</p>
                      <p className="font-medium text-foreground">{pkg?.title || project.packageType}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-2xl font-bold text-foreground">₦{project.amountPaid.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="text-left mb-8">
                <h2 className="font-semibold text-foreground mb-3">What happens next?</h2>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">1</span>
                    <span>An admin will review your project and match you with an expert.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">2</span>
                    <span>You'll get a notification in the app the moment an expert is assigned.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">3</span>
                    <span>Start collaborating with your expert through the project dashboard.</span>
                  </li>
                </ol>
              </div>

              <Button asChild className="w-full gap-2">
                <Link to="/student">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
