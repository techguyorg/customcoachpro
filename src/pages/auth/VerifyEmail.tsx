import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "@/lib/auth-azure";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleVerification = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setErrorMessage("No verification token provided");
        return;
      }

      try {
        await verifyEmail(token);
        setStatus("success");
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified.",
        });
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Failed to verify email");
        toast({
          title: "Verification failed",
          description: err.message || "Please try again or request a new verification link",
          variant: "destructive",
        });
      }
    };

    handleVerification();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="CustomCoachPro" className="w-10 h-10" />
          <span className="font-display font-bold text-xl">CustomCoachPro</span>
        </Link>

        <div className="bg-card border border-border/50 rounded-xl p-6">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h1 className="text-xl font-bold mb-2">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait while we verify your email address.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h1 className="text-xl font-bold mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-6">
                Your email has been successfully verified. You can now access all features.
              </p>
              <Button variant="hero" onClick={() => navigate("/login")} className="w-full">
                Continue to Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
                  Go to Login
                </Button>
                <p className="text-sm text-muted-foreground">
                  Need a new verification link? Log in and request one from your profile.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
