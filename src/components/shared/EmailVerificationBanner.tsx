import { useState } from "react";
import { resendVerificationEmail } from "@/lib/auth-azure";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, Loader2, CheckCircle } from "lucide-react";

const EmailVerificationBanner = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Don't show if user is verified or no user
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and click the verification link.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to send email",
        description: err.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    await refreshUser();
    if (user?.emailVerified) {
      toast({
        title: "Email verified!",
        description: "Your email has been verified successfully.",
      });
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-amber-700 dark:text-amber-400">
            Verify your email address
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Please verify your email ({user.email}) to access all features and receive important notifications.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {sent ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                Email sent! Check your inbox.
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResend}
                disabled={isSending}
                className="border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend verification email
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              className="text-muted-foreground"
            >
              I've verified, refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
