import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { PricingCard } from "@/components/payment/PricingCard";
import { PaymentSummary } from "@/components/payment/PaymentSummary";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

// Feature bullets are cosmetic copy only. Price and milestone count always
// come from the `packages` table in the database (fetched via useApp),
// never from this list, so what's charged always matches what's shown here.
const packageFeatures: Record<string, string[]> = {
  single: [
    "1 milestone support",
    "Expert guidance & review",
    "Chat support",
    "7-day delivery",
  ],
  standard: [
    "3 milestones support",
    "Priority expert matching",
    "Chat support",
    "14-day delivery per milestone",
  ],
  full: [
    "All milestones covered",
    "Dedicated expert assigned",
    "Unlimited revisions",
    "Priority support",
    "Defense preparation included",
  ],
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser, packages, createProject, startPayment } = useApp();
  const [selectedPackage, setSelectedPackage] = useState<string>("standard");
  const [isProcessing, setIsProcessing] = useState(false);

  // Project details collected on the previous step (NewProject.tsx)
  const projectTitle = location.state?.title || "New Project";
  const projectDescription = location.state?.description || "";
  const urgency = location.state?.urgency || "moderate";

  const currentPackage = packages.find((p) => p.id === selectedPackage);

  const handlePayment = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (!currentPackage) {
      toast({ title: "Choose a package", description: "Pick a support package to continue.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    const deadline = new Date();
    if (urgency === "relaxed") deadline.setDate(deadline.getDate() + 30);
    else if (urgency === "moderate") deadline.setDate(deadline.getDate() + 21);
    else deadline.setDate(deadline.getDate() + 14);

    // Step 1: create the (unpaid) project record.
    const project = await createProject({
      title: projectTitle,
      description: projectDescription,
      packageId: selectedPackage,
      deadline: deadline.toISOString().split("T")[0],
    });

    if (!project) {
      setIsProcessing(false);
      return; // createProject already surfaced a toast on failure
    }

    // Step 2: ask the server to start a real Paystack checkout for it.
    const result = await startPayment(project.id);
    if ("error" in result) {
      toast({ title: "Couldn't start payment", description: result.error, variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    // Step 3: hand off to Paystack's own hosted, secure checkout page.
    // We never collect card details ourselves.
    window.location.href = result.authorizationUrl;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 mb-6 -ml-2" asChild>
          <Link to="/new-project">
            <ArrowLeft className="h-4 w-4" />
            Back to Project Details
          </Link>
        </Button>

        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Choose Your Support Package
            </h1>
            <p className="text-muted-foreground">
              Select a package that fits your project needs. All packages include expert guidance.
            </p>
          </div>

          {/* Trust Banner */}
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-accent/50 border border-accent mb-8">
            <Shield className="h-5 w-5 text-accent-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-accent-foreground">100% Satisfaction Guarantee:</span>{" "}
              If you're not satisfied with the support, we'll refund your payment within 7 days.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pricing Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <PricingCard
                    key={pkg.id}
                    title={pkg.title}
                    price={pkg.price}
                    description={pkg.description}
                    features={packageFeatures[pkg.id] || []}
                    recommended={pkg.id === "standard"}
                    selected={selectedPackage === pkg.id}
                    onSelect={() => setSelectedPackage(pkg.id)}
                  />
                ))}
              </div>

              <div className="rounded-lg border p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Secure checkout via Paystack</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll be taken to Paystack's secure payment page to complete your card, bank
                    transfer, or USSD payment. We never see or store your card details.
                  </p>
                </div>
                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={handlePayment}
                  disabled={isProcessing || !currentPackage}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting up your payment...
                    </>
                  ) : (
                    `Pay ₦${currentPackage?.price.toLocaleString() || 0} with Paystack`
                  )}
                </Button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <PaymentSummary
                projectTitle={projectTitle}
                packageName={currentPackage?.title || ""}
                packagePrice={currentPackage?.price || 0}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
