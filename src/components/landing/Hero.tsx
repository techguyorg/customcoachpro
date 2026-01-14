import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardPreview } from "./DashboardPreview";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />

      <div className="container relative z-10 px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 text-xs font-medium text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Free to start • No credit card required
          </div>

          {/* Headline - Cleaner, tighter */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            Your fitness journey,{" "}
            <span className="text-gradient-primary">one platform</span>
          </h1>

          {/* Subheadline - Concise */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Track workouts, follow nutrition plans, connect with coaches, 
            or manage your coaching business — all in one place.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See how it works
                <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Trust indicators - Real avatars */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" 
                  alt="User" 
                  className="w-7 h-7 rounded-full border-2 border-background object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                  alt="User" 
                  className="w-7 h-7 rounded-full border-2 border-background object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" 
                  alt="User" 
                  className="w-7 h-7 rounded-full border-2 border-background object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" 
                  alt="User" 
                  className="w-7 h-7 rounded-full border-2 border-background object-cover"
                />
              </div>
              <span>Join 2,000+ active users</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <span>Trusted by coaches worldwide</span>
          </div>
        </div>

        {/* App preview placeholder */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-black/20">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                  app.customcoachpro.com
                </div>
              </div>
            </div>
            {/* Preview content */}
            <div className="bg-gradient-to-br from-card via-card/95 to-primary/5">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;