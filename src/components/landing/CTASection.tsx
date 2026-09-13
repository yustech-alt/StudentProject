import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-24">
      <div className="container">
        <div className="relative rounded-2xl gradient-hero overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative px-8 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Complete Your Project?
            </h2>
            <p className="text-lg text-primary-foreground/85 max-w-xl mx-auto mb-8">
              Join students who chose the right path—guided support that helps you understand and succeed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                variant="secondary"
                asChild 
                className="w-full sm:w-auto"
              >
                <Link to="/signup" className="gap-2">
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="ghost"
                asChild 
                className="w-full sm:w-auto text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}