import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Shield, Bell, Database, Loader2, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DataIntegrityTool } from "./DataIntegrityTool";

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: string | boolean | number;
  setting_type: string;
  category: string;
  description: string | null;
}

export function PlatformSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const data = await api.get<PlatformSetting[]>('/api/admin/settings');
      return data;
    },
  });

  // Local state for form
  const [features, setFeatures] = useState({
    coach_marketplace_enabled: true,
    client_self_signup_enabled: true,
    workout_logging_enabled: true,
    nutrition_logging_enabled: true,
    progress_photos_enabled: true,
    messaging_enabled: true,
  });

  const [defaults, setDefaults] = useState({
    max_clients_per_coach: "50",
    default_trial_period_days: "14",
    checkin_frequency_days: "7",
    session_timeout_hours: "24",
  });

  const [notifications, setNotifications] = useState({
    email_notifications_enabled: true,
    checkin_reminders_enabled: true,
    new_client_alerts_enabled: true,
    system_alerts_enabled: true,
  });

  // Sync settings from database to local state
  useEffect(() => {
    if (settings) {
      const newFeatures = { ...features };
      const newDefaults = { ...defaults };
      const newNotifications = { ...notifications };

      settings.forEach((s) => {
        if (s.category === "features" && s.setting_key in newFeatures) {
          (newFeatures as any)[s.setting_key] = s.setting_value === true || s.setting_value === "true";
        } else if (s.category === "defaults" && s.setting_key in newDefaults) {
          (newDefaults as any)[s.setting_key] = String(s.setting_value);
        } else if (s.category === "notifications" && s.setting_key in newNotifications) {
          (newNotifications as any)[s.setting_key] = s.setting_value === true || s.setting_value === "true";
        }
      });

      setFeatures(newFeatures);
      setDefaults(newDefaults);
      setNotifications(newNotifications);
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      await api.put(`/api/admin/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
  });

  const handleSaveFeatures = async () => {
    try {
      const updates = Object.entries(features).map(([key, value]) => 
        updateSettingMutation.mutateAsync({ key, value })
      );
      await Promise.all(updates);
      toast.success("Feature flags updated successfully");
    } catch (error) {
      toast.error("Failed to update feature flags");
    }
  };

  const handleSaveDefaults = async () => {
    try {
      const updates = Object.entries(defaults).map(([key, value]) => 
        updateSettingMutation.mutateAsync({ key, value: Number(value) })
      );
      await Promise.all(updates);
      toast.success("Default values updated successfully");
    } catch (error) {
      toast.error("Failed to update default values");
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const updates = Object.entries(notifications).map(([key, value]) => 
        updateSettingMutation.mutateAsync({ key, value })
      );
      await Promise.all(updates);
      toast.success("Notification settings updated successfully");
    } catch (error) {
      toast.error("Failed to update notification settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Platform Settings
        </h2>
        <p className="text-muted-foreground">
          Configure platform-wide settings, feature flags, and default values
        </p>
      </div>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features" className="gap-2">
            <Shield className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="defaults" className="gap-2">
            <Database className="h-4 w-4" />
            Defaults
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrity" className="gap-2">
            <Wrench className="h-4 w-4" />
            Data Integrity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable platform features globally</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Coach Marketplace</Label>
                  <p className="text-sm text-muted-foreground">Allow clients to discover and request coaches</p>
                </div>
                <Switch
                  checked={features.coach_marketplace_enabled}
                  onCheckedChange={(checked) => setFeatures({ ...features, coach_marketplace_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Client Self-Signup</Label>
                  <p className="text-sm text-muted-foreground">Allow clients to sign up without coach invitation</p>
                </div>
                <Switch
                  checked={features.client_self_signup_enabled}
                  onCheckedChange={(checked) => setFeatures({ ...features, client_self_signup_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Progress Photos</Label>
                  <p className="text-sm text-muted-foreground">Enable progress photo uploads and tracking</p>
                </div>
                <Switch
                  checked={features.progress_photos_enabled}
                  onCheckedChange={(checked) => setFeatures({ ...features, progress_photos_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nutrition Tracking</Label>
                  <p className="text-sm text-muted-foreground">Enable nutrition logging and diet plan features</p>
                </div>
                <Switch
                  checked={features.nutrition_logging_enabled}
                  onCheckedChange={(checked) => setFeatures({ ...features, nutrition_logging_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Workout Logging</Label>
                  <p className="text-sm text-muted-foreground">Enable workout tracking and exercise logging</p>
                </div>
                <Switch
                  checked={features.workout_logging_enabled}
                  onCheckedChange={(checked) => setFeatures({ ...features, workout_logging_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In-App Messaging</Label>
                  <p className="text-sm text-muted-foreground">Enable coach-client messaging</p>
                </div>
                <Switch
                  checked={features.messaging_enabled}
                  onCheckedChange={(checked) => setFeatures({ ...features, messaging_enabled: checked })}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveFeatures} disabled={updateSettingMutation.isPending}>
                  {updateSettingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Feature Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Values</CardTitle>
              <CardDescription>Configure default settings for new users and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxClients">Max Clients per Coach</Label>
                  <Input
                    id="maxClients"
                    type="number"
                    value={defaults.max_clients_per_coach}
                    onChange={(e) => setDefaults({ ...defaults, max_clients_per_coach: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Maximum clients a coach can accept</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trialDays">Default Trial Period (days)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={defaults.default_trial_period_days}
                    onChange={(e) => setDefaults({ ...defaults, default_trial_period_days: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Free trial duration for new coaching relationships</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkinFreq">Check-in Frequency (days)</Label>
                  <Input
                    id="checkinFreq"
                    type="number"
                    value={defaults.checkin_frequency_days}
                    onChange={(e) => setDefaults({ ...defaults, checkin_frequency_days: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Default days between client check-ins</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={defaults.session_timeout_hours}
                    onChange={(e) => setDefaults({ ...defaults, session_timeout_hours: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveDefaults} disabled={updateSettingMutation.isPending}>
                  {updateSettingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Default Values
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure platform-wide notification behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
                </div>
                <Switch
                  checked={notifications.email_notifications_enabled}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Check-in Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminders to clients for scheduled check-ins</p>
                </div>
                <Switch
                  checked={notifications.checkin_reminders_enabled}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, checkin_reminders_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Client Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify coaches when new clients request coaching</p>
                </div>
                <Switch
                  checked={notifications.new_client_alerts_enabled}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, new_client_alerts_enabled: checked })}
                />
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify super admins of system events</p>
                </div>
                <Switch
                  checked={notifications.system_alerts_enabled}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, system_alerts_enabled: checked })}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveNotifications} disabled={updateSettingMutation.isPending}>
                  {updateSettingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <DataIntegrityTool />
        </TabsContent>
      </Tabs>
    </div>
  );
}
