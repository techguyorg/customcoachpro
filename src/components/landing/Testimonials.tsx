import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Finally, one app for everything. I track my workouts, meals, and my coach can see my progress instantly.",
    author: "Sarah M.",
    role: "Fitness Enthusiast",
    rating: 5,
  },
  {
    quote: "Managing 30+ clients used to be chaos. Now I have everyone's progress, check-ins, and plans in one dashboard.",
    author: "Marcus T.",
    role: "Personal Trainer",
    rating: 5,
  },
  {
    quote: "The exercise library alone is worth it. Great form videos and I can build my own routines.",
    author: "David K.",
    role: "Home Gym User",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-card/30" id="testimonials">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Loved by fitness enthusiasts
          </h2>
          <p className="text-muted-foreground">
            From individual users to professional coaches
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-card border border-border/50"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div>
                <div className="font-medium text-sm">{testimonial.author}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;