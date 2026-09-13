import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Outer ring */}
        <div
          className={cn(
            "rounded-full border-4 border-muted",
            sizeClasses[size],
            className
          )}
        />
        {/* Spinning gradient ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin",
            sizeClasses[size]
          )}
        />
        {/* Inner glow */}
        <div
          className={cn(
            "absolute inset-1 rounded-full bg-gradient-to-tr from-primary/20 to-transparent animate-pulse"
          )}
        />
      </div>
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

export function FullPageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner size="xl" label={label} />
    </div>
  );
}
