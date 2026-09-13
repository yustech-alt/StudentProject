import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
  selected?: boolean;
  onSelect: () => void;
}

export function PricingCard({
  title,
  price,
  description,
  features,
  recommended = false,
  selected = false,
  onSelect,
}: PricingCardProps) {
  return (
    <Card
      className={`relative cursor-pointer transition-all hover:shadow-elevated ${
        selected
          ? "border-primary ring-2 ring-primary shadow-elevated"
          : "border-border hover:border-primary/50"
      } ${recommended ? "scale-[1.02]" : ""}`}
      onClick={onSelect}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-sm">
            Recommended
          </Badge>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">₦{price.toLocaleString()}</span>
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={selected ? "default" : "outline"}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {selected ? "Selected" : "Select Package"}
        </Button>
      </CardContent>
    </Card>
  );
}
