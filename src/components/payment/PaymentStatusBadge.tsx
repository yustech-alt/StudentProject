import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: "unpaid" | "paid" | "refunded";
  showIcon?: boolean;
  size?: "sm" | "default";
}

export function PaymentStatusBadge({ status, showIcon = true, size = "default" }: PaymentStatusBadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-1.5 py-0.5" : "";
  
  switch (status) {
    case "paid":
      return (
        <Badge variant="success" className={`gap-1 ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className="h-3 w-3" />}
          Paid
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="pending" className={`gap-1 ${sizeClasses}`}>
          {showIcon && <Clock className="h-3 w-3" />}
          Refunded
        </Badge>
      );
    case "unpaid":
    default:
      return (
        <Badge variant="destructive" className={`gap-1 ${sizeClasses}`}>
          {showIcon && <AlertCircle className="h-3 w-3" />}
          Pending Payment
        </Badge>
      );
  }
}
