import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock } from "lucide-react";

interface PaymentSummaryProps {
  projectTitle: string;
  packageName: string;
  packagePrice: number;
  serviceFee?: number;
}

export function PaymentSummary({
  projectTitle,
  packageName,
  packagePrice,
  serviceFee = 0,
}: PaymentSummaryProps) {
  const total = packagePrice + serviceFee;

  return (
    <Card className="shadow-card sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Info */}
        <div>
          <p className="font-medium text-foreground">{projectTitle}</p>
          <p className="text-sm text-muted-foreground">{packageName}</p>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">₦{packagePrice.toLocaleString()}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="text-foreground">₦{serviceFee.toLocaleString()}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">₦{total.toLocaleString()}</span>
        </div>

        {/* Trust Badges */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 text-success" />
            <span>Paid securely through Paystack</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-success" />
            <span>100% money-back guarantee</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
