import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  MessageSquare, 
  Shield, 
  ArrowRight,
  Milestone,
  CreditCard
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
}

const studentSteps: OnboardingStep[] = [
  {
    icon: <GraduationCap className="h-8 w-8 text-primary" />,
    title: "Welcome to ProjectSupport",
    description: "Your partner in academic project success",
    details: [
      "Get guided support from verified experts",
      "Work through milestones at your own pace",
      "Prepare confidently for your defense",
    ],
  },
  {
    icon: <Milestone className="h-8 w-8 text-primary" />,
    title: "Milestone-Based Progress",
    description: "Learn and grow with each step",
    details: [
      "Projects are broken into clear milestones",
      "Experts guide you through each phase",
      "You confirm completion before moving forward",
    ],
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "Structured Communication",
    description: "Clear guidelines for productive conversations",
    details: [
      "All chats are project-focused and milestone-specific",
      "Administrators monitor for quality assurance",
      "Focus on understanding, not just completion",
    ],
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Our Promise to You",
    description: "Built on trust, not shortcuts",
    details: [
      "This is guidance, not project outsourcing",
      "All work is explained so you understand it",
      "You'll be ready to defend your project",
    ],
  },
];

const expertSteps: OnboardingStep[] = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Welcome, Expert",
    description: "Help students succeed with integrity",
    details: [
      "Guide students through their projects",
      "Maintain academic integrity standards",
      "Build your reputation through quality support",
    ],
  },
  {
    icon: <Milestone className="h-8 w-8 text-primary" />,
    title: "Milestone Reviews",
    description: "Your role in student progress",
    details: [
      "Review and provide feedback on submissions",
      "Guide students to understand each concept",
      "Approve milestones when students are ready",
    ],
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "Communication Standards",
    description: "Professional and educational focus",
    details: [
      "All communication is logged and monitored",
      "Focus on teaching and explanation",
      "No off-platform communication permitted",
    ],
  },
  {
    icon: <CreditCard className="h-8 w-8 text-primary" />,
    title: "Payments & Recognition",
    description: "Get rewarded for quality work",
    details: [
      "Receive payment for completed milestones",
      "Build your rating through student feedback",
      "Higher ratings lead to more assignments",
    ],
  },
];

const adminSteps: OnboardingStep[] = [
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Admin Dashboard",
    description: "Oversee platform operations",
    details: [
      "Manage all projects and assignments",
      "Monitor communication for compliance",
      "Ensure quality and academic integrity",
    ],
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Expert Management",
    description: "Assign and monitor experts",
    details: [
      "Match experts to suitable projects",
      "Monitor expert capacity and performance",
      "Handle escalations and disputes",
    ],
  },
];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { currentUser } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = currentUser?.role === "expert" 
    ? expertSteps 
    : currentUser?.role === "admin" 
      ? adminSteps 
      : studentSteps;

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {step.icon}
            </div>
          </div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {step.details.map((detail, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{detail}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Progress value={progress} className="h-1.5" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button size="sm" onClick={handleNext} className="gap-1">
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
