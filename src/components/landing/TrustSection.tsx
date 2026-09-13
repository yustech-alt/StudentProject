import { ShieldCheck, MessageCircle, Award, FileCheck } from "lucide-react";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Verified Experts Only",
    description: "Every expert is manually verified for skills, experience, and reliability before they can assist students.",
  },
  {
    icon: FileCheck,
    title: "Original Work Guaranteed",
    description: "This is not project-buying. All work is original, explained, and created with your understanding in mind.",
  },
  {
    icon: MessageCircle,
    title: "Clear Communication",
    description: "Direct chat with your assigned expert. Ask questions, request explanations, and learn throughout the process.",
  },
  {
    icon: Award,
    title: "Milestone-Based Progress",
    description: "Track every step of your project. Nothing moves forward until you understand and confirm completion.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="py-20 md:py-24">
      <div className="container">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border bg-accent px-4 py-1.5 text-sm text-accent-foreground mb-4">
            <ShieldCheck className="h-4 w-4" />
            <span>Our Promise</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built on Trust, Not Shortcuts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We believe in guidance and education, not ghostwriting. 
            Every feature is designed to help you learn and succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {trustPoints.map((point, index) => (
            <div 
              key={index}
              className="flex gap-5 p-6 rounded-xl border bg-card hover:shadow-card transition-shadow"
            >
              <div className="flex-shrink-0 h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <point.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
