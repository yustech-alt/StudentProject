import { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Computer Science Graduate",
    avatar: "",
    rating: 5,
    text: "The milestone-based approach helped me stay on track. My expert explained every concept clearly, and I felt fully prepared for my defense.",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Engineering Student",
    avatar: "",
    rating: 5,
    text: "I was struggling with my thesis until I found this platform. The structured support made all the difference in completing my project on time.",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Business Administration",
    avatar: "",
    rating: 5,
    text: "Professional, knowledgeable experts who genuinely care about your understanding. Worth every penny for the peace of mind.",
  },
  {
    id: 4,
    name: "David Okonkwo",
    role: "Data Science Graduate",
    avatar: "",
    rating: 5,
    text: "The payment protection gave me confidence, and the quality of work exceeded my expectations. Highly recommend!",
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Psychology Student",
    avatar: "",
    rating: 5,
    text: "My expert was patient and thorough. The chat system made communication easy, and I learned so much throughout the process.",
  },
];

export function TestimonialsCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api) return;

    const startAutoplay = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          api.scrollNext();
        }
      }, 4000);
    };

    startAutoplay();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [api, isPaused]);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Students Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of students who successfully completed their projects with our expert guidance.
          </p>
        </div>

        <div 
          className="max-w-5xl mx-auto px-12"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full border-border/50 bg-background">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-muted-foreground flex-grow mb-6 leading-relaxed">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={testimonial.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {testimonial.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
