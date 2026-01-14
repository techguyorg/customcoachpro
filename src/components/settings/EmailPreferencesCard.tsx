import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface EmailPreferences {
  email_checkin_reminder: boolean;
  email_checkin_submitted: boolean;
  email_checkin_reviewed: boolean;
  email_plan_assigned: boolean;
  email_coach_message: boolean;
  email_marketing: boolean;
}

const DEFAULT_PREFS: EmailPreferences = {
  email_checkin_reminder: true,
  email_checkin_submitted: true,
  email_checkin_reviewed: true,
  email_plan_assigned: true,
  email_coach_message: true,
  email_marketing: false,
};

export function EmailPreferencesCard() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<EmailPreferences>(DEFAULT_PREFS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedPrefs, isLoading } = useQuery({
    queryKey: ["email-preferences"],
    queryFn: () => api.get<EmailPreferences>("/api/users/email-preferences"),
  });

  useEffect(() => {
    if (savedPrefs) {
      setPrefs({ ...DEFAULT_PREFS, ...savedPrefs });
    }
  }, [savedPrefs]);

  const saveMutation = useMutation({
    mutationFn: (data: EmailPreferences) => 
      api.put("/api/users/email-preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
      toast.success("Email preferences saved");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("Failed to save preferences");
    },
  });

  const updatePref = (key: keyof EmailPreferences, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Email Notifications
        </CardTitle>
        <CardDescription className="text-xs">
          Control which emails you receive from CustomCoachPro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Check-in Reminders */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Check-in Reminders</p>
            <p className="text-xs text-muted-foreground truncate">Weekly reminder to submit your check-in</p>
          </div>
          <Switch
            checked={prefs.email_checkin_reminder}
            onCheckedChange={(v) => updatePref("email_checkin_reminder", v)}
          />
        </div>

        <Separator />

        {/* Check-in Submitted (Coach) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Check-in Submitted</p>
            <p className="text-xs text-muted-foreground truncate">When your client submits a check-in (coaches)</p>
          </div>
          <Switch
            checked={prefs.email_checkin_submitted}
            onCheckedChange={(v) => updatePref("email_checkin_submitted", v)}
          />
        </div>

        <Separator />

        {/* Check-in Reviewed */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Check-in Reviewed</p>
            <p className="text-xs text-muted-foreground truncate">When your coach reviews your check-in</p>
          </div>
          <Switch
            checked={prefs.email_checkin_reviewed}
            onCheckedChange={(v) => updatePref("email_checkin_reviewed", v)}
          />
        </div>

        <Separator />

        {/* Plan Assigned */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Plan Assigned</p>
            <p className="text-xs text-muted-foreground truncate">When a new workout or diet plan is assigned</p>
          </div>
          <Switch
            checked={prefs.email_plan_assigned}
            onCheckedChange={(v) => updatePref("email_plan_assigned", v)}
          />
        </div>

        <Separator />

        {/* Coach Messages */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Direct Messages</p>
            <p className="text-xs text-muted-foreground truncate">When you receive a new message</p>
          </div>
          <Switch
            checked={prefs.email_coach_message}
            onCheckedChange={(v) => updatePref("email_coach_message", v)}
          />
        </div>

        <Separator />

        {/* Marketing */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Tips & Updates</p>
            <p className="text-xs text-muted-foreground truncate">Fitness tips, platform updates, and promotions</p>
          </div>
          <Switch
            checked={prefs.email_marketing}
            onCheckedChange={(v) => updatePref("email_marketing", v)}
          />
        </div>

        {hasChanges && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={() => saveMutation.mutate(prefs)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
