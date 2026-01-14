import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description: "For individuals getting started",
    price: 0,
    features: [
      "Workout logging",
      "Progress tracking",
      "Exercise library",
      "Browse free plans",
      "Basic analytics",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious fitness enthusiasts",
    price: 9,
    features: [
      "Everything in Free",
      "Unlimited progress photos",
      "Advanced analytics",
      "Custom plan creation",
      "Coach connection",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Coach",
    description: "For fitness professionals",
    price: 49,
    features: [
      "Everything in Pro",
      "Unlimited clients",
      "Client management",
      "Automated check-ins",
      "Business analytics",
      "White-label options",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-20" id="pricing">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground">
            Start free, upgrade when you're ready
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-6 rounded-xl border transition-all ${
                plan.popular
                  ? "bg-card border-primary/50 shadow-lg shadow-primary/5"
                  : "bg-card/50 border-border/50 hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full">
                  <span className="text-xs font-medium text-primary-foreground">Popular</span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  size="sm"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;