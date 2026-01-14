import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError("Google sign-in was cancelled");
        setIsProcessing(false);
        return;
      }

      if (!code) {
        setError("No authorization code received");
        setIsProcessing(false);
        return;
      }

      try {
        // Parse state to get role
        let role: string | undefined;
        if (state) {
          try {
            const stateData = JSON.parse(atob(state));
            role = stateData.role;
          } catch {
            // Ignore state parsing errors
          }
        }

        const { error: authError } = await signInWithGoogle(code, role);

        if (authError) {
          setError(authError.message);
          toast({
            title: "Sign-in failed",
            description: authError.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome!",
            description: "You have successfully signed in with Google.",
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to complete sign-in");
        toast({
          title: "Sign-in failed",
          description: err.message || "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, signInWithGoogle, toast]);

  // Redirect when user is set
  useEffect(() => {
    if (user && !isProcessing) {
      const dashboardMap: Record<string, string> = {
        super_admin: "/admin",
        coach: "/coach",
        client: "/client",
      };
      navigate(dashboardMap[user.role] || "/", { replace: true });
    }
  }, [user, isProcessing, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <img src={logo} alt="CustomCoachPro" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-destructive mb-2">Sign-in Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="text-primary hover:underline"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <img src={logo} alt="CustomCoachPro" className="w-16 h-16 mx-auto mb-4" />
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <h1 className="text-xl font-bold mb-2">Completing sign-in...</h1>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
