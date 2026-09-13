import { Shield, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ChatDisclaimerProps {
  variant?: "header" | "inline" | "warning";
}

export function ChatDisclaimer({ variant = "header" }: ChatDisclaimerProps) {
  if (variant === "warning") {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Communication Guidelines</AlertTitle>
        <AlertDescription>
          All messages are monitored. Requests for full project completion or off-platform 
          communication will result in account suspension.
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-4">
        <Info className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Messages are project-scoped and visible to admins for quality assurance.
        </span>
      </div>
    );
  }

  return (
    <div className="border-b bg-accent/30 px-4 py-3 mb-4">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-foreground">
            Communication Guidelines
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• All communication is project-scoped and milestone-focused</li>
            <li>• Messages are monitored by administrators for quality assurance</li>
            <li>• Off-platform communication is not permitted</li>
            <li>• Focus on guidance, explanation, and learning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
