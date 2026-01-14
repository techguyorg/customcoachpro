import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 9, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using CustomCoachPro ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              CustomCoachPro is a fitness platform that connects coaches with clients, provides workout and diet plan management, progress tracking, and communication tools. The platform serves fitness enthusiasts, professional coaches, and clients seeking personalized fitness guidance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">To use our services, you must:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Be at least 16 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Roles and Responsibilities</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">For Coaches:</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must have appropriate qualifications and certifications for fitness coaching</li>
              <li>You are responsible for the accuracy and safety of plans you create</li>
              <li>You must maintain professional conduct with clients</li>
              <li>You acknowledge that fitness advice does not constitute medical advice</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">For Clients:</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You should consult a healthcare provider before starting any fitness program</li>
              <li>You are responsible for accurately reporting your health information</li>
              <li>You understand that results may vary based on individual circumstances</li>
              <li>You agree to communicate honestly with your coach about your progress</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the platform for any unlawful purpose</li>
              <li>Share false or misleading information</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to the platform</li>
              <li>Interfere with the proper functioning of the service</li>
              <li>Scrape or collect user data without permission</li>
              <li>Use the platform to promote competing services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Content Ownership</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Your Content:</strong> You retain ownership of content you create (workout logs, progress photos, notes). By uploading content, you grant us a license to use it to provide our services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Platform Content:</strong> System workout templates, exercises, and diet plans created by CustomCoachPro remain our intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Health Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              CustomCoachPro provides fitness and nutrition information for educational purposes only. This information is not intended as medical advice. Always consult with qualified healthcare professionals before making changes to your diet or exercise routine, especially if you have any medical conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, CustomCoachPro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform. This includes any injuries that may occur from following workout or diet plans.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Subscription and Payments</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Certain features may require a paid subscription. By subscribing:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You authorize us to charge your payment method</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Refunds are handled according to our refund policy</li>
              <li>Prices may change with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account for violations of these terms. You may also delete your account at any time through your profile settings. Upon termination, your right to use the platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms of Service at any time. We will notify users of significant changes via email or platform notification. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@customcoachpro.com" className="text-primary hover:underline">
                legal@customcoachpro.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
