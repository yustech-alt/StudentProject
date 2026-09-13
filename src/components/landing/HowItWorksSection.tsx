import { FileText, Users, Rocket } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Submit Your Request",
    description: "Tell us about your project, current stage, and what kind of help you need. No pressure, just clarity.",
  },
  {
    icon: Users,
    title: "Get Matched with an Expert",
    description: "We carefully assign a verified expert who understands your project type and can guide you effectively.",
  },
  {
    icon: Rocket,
    title: "Collaborate & Learn",
    description: "Work through milestones together. Receive explanations at each step so you truly understand your project.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple, transparent process designed to help you succeed without shortcuts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative bg-card rounded-xl p-8 shadow-card border transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                {index + 1}
              </div>
              
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-5">
                <step.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
