// src/pages/settings/SettingsPage.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import profileService, { UpdateMyProfileRequest } from "@/services/profileService";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileService.getMe(),
    enabled: !!user && !authLoading,
    retry: 0, // IMPORTANT: prevents repeated console spam if backend is down
    refetchOnWindowFocus: false,
  });

  const [form, setForm] = useState<UpdateMyProfileRequest>({
    displayName: "",
    bio: "",
    avatarUrl: "",
    startDate: null,
    heightCm: null,
    currentWeight: null,
    targetWeight: null,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      displayName: data.profile.displayName ?? "",
      bio: data.profile.bio ?? "",
      avatarUrl: data.profile.avatarUrl ?? "",
      startDate: data.profile.startDate ?? null,
      heightCm: data.profile.heightCm ?? null,
      currentWeight: data.profile.currentWeight ?? null,
      targetWeight: data.profile.targetWeight ?? null,
    });
  }, [data]);

  const save = async () => {
    try {
      await profileService.updateMe(form);
      await qc.invalidateQueries({ queryKey: ["profile", "me"] });
      toast({ title: "Saved", description: "Your profile has been updated." });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save profile",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading settings…</div>;
  }

  if (isError) {
    return (
      <div className="p-6 space-y-2">
        <h2 className="text-lg font-semibold">Could not load profile</h2>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const isClient = user?.role === "client";

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your basic profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Input
              value={form.bio ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar URL</Label>
            <Input
              value={form.avatarUrl ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {isClient && (
        <Card>
          <CardHeader>
            <CardTitle>Fitness basics</CardTitle>
            <CardDescription>These help your dashboard and progress tracking</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate ? String(form.startDate).slice(0, 10) : ""}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value || null }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                value={form.heightCm ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, heightCm: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Current weight</Label>
              <Input
                type="number"
                value={form.currentWeight ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, currentWeight: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Target weight</Label>
              <Input
                type="number"
                value={form.targetWeight ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, targetWeight: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={save} className="shadow-energy">
          Save changes
        </Button>
      </div>
    </div>
  );
}

export default SettingsPage;
