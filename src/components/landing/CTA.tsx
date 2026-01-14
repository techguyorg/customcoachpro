import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust CustomCoachPro for their fitness journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="lg">
                Create free account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Free forever • Upgrade anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;