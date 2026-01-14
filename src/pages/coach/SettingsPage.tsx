import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, User, Award, DollarSign, Users, X, Plus, Save, Loader2, Upload, Camera, Mail } from "lucide-react";
import { toast } from "sonner";
import { ChangePasswordCard } from "@/components/shared/ChangePasswordCard";

const SPECIALIZATION_OPTIONS = [
  "Weight Loss",
  "Muscle Building", 
  "Strength Training",
  "Bodybuilding",
  "Powerlifting",
  "CrossFit",
  "HIIT",
  "Cardio",
  "Flexibility & Mobility",
  "Sports Performance",
  "Rehabilitation",
  "Senior Fitness",
  "Pre/Post Natal",
  "Nutrition Coaching",
  "Online Coaching",
];

const CERTIFICATION_OPTIONS = [
  "NASM-CPT",
  "ACE-CPT",
  "ISSA-CPT",
  "NSCA-CSCS",
  "ACSM-CPT",
  "CrossFit Level 1",
  "CrossFit Level 2",
  "Precision Nutrition",
  "NASM-CES",
  "NASM-PES",
  "RYT-200",
  "RYT-500",
  "StrongFirst",
  "USA Weightlifting",
];

interface ProfileData {
  full_name?: string;
  bio?: string;
  phone?: string;
  avatar_url?: string;
}

interface CoachProfileData {
  specializations?: string[];
  certifications?: string[];
  experience_years?: number;
  hourly_rate?: number | null;
  currency?: string;
  max_clients?: number;
  is_accepting_clients?: boolean;
  email_checkin_received?: boolean;
  email_plan_assigned?: boolean;
}

export default function CoachSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch coach profile and general profile
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["coach-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return api.get<{ profile: ProfileData; coachProfile: CoachProfileData }>("/api/coach/settings");
    },
    enabled: !!user?.id,
  });

  // Form state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [maxClients, setMaxClients] = useState<number>(50);
  const [isAcceptingClients, setIsAcceptingClients] = useState(true);

  // Email preferences
  const [emailCheckinReceived, setEmailCheckinReceived] = useState(true);
  const [emailPlanAssigned, setEmailPlanAssigned] = useState(true);

  const [newSpecialization, setNewSpecialization] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [customCertification, setCustomCertification] = useState("");
  const [uploading, setUploading] = useState(false);

  // Load data into form
  useEffect(() => {
    if (profiles) {
      setFullName(profiles.profile?.full_name || "");
      setBio(profiles.profile?.bio || "");
      setPhone(profiles.profile?.phone || "");
      setAvatarUrl(profiles.profile?.avatar_url || "");
      
      // Ensure arrays with defensive defaults
      const specs = profiles.coachProfile?.specializations;
      setSpecializations(Array.isArray(specs) ? specs : []);
      const certs = profiles.coachProfile?.certifications;
      setCertifications(Array.isArray(certs) ? certs : []);
      setExperienceYears(profiles.coachProfile?.experience_years || 0);
      setHourlyRate(profiles.coachProfile?.hourly_rate ?? null);
      setCurrency(profiles.coachProfile?.currency || "USD");
      setMaxClients(profiles.coachProfile?.max_clients || 50);
      setIsAcceptingClients(profiles.coachProfile?.is_accepting_clients ?? true);
      setEmailCheckinReceived(profiles.coachProfile?.email_checkin_received ?? true);
      setEmailPlanAssigned(profiles.coachProfile?.email_plan_assigned ?? true);
    }
  }, [profiles]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Auto-add any pending custom certification before saving
      let finalCertifications = [...certifications];
      const pendingCert = customCertification.trim();
      if (pendingCert && !finalCertifications.includes(pendingCert)) {
        finalCertifications = [...finalCertifications, pendingCert];
      }

      await api.put("/api/coach/settings", {
        profile: {
          full_name: fullName,
          bio,
          phone,
          avatar_url: avatarUrl || null,
        },
        coachProfile: {
          specializations,
          certifications: finalCertifications,
          experience_years: experienceYears,
          hourly_rate: hourlyRate,
          currency,
          max_clients: maxClients,
          is_accepting_clients: isAcceptingClients,
          email_checkin_received: emailCheckinReceived,
          email_plan_assigned: emailPlanAssigned,
        },
      });
    },
    onSuccess: () => {
      setCustomCertification(""); // Clear the input after successful save
      queryClient.invalidateQueries({ queryKey: ["coach-settings"] });
      queryClient.invalidateQueries({ queryKey: ["coach-marketplace"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save settings");
      console.error(error);
    },
  });

  const addSpecialization = (spec: string) => {
    if (spec && !specializations.includes(spec)) {
      setSpecializations([...specializations, spec]);
    }
    setNewSpecialization("");
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  const addCertification = (cert: string) => {
    if (cert && !certifications.includes(cert)) {
      setCertifications([...certifications, cert]);
    }
    setNewCertification("");
    setCustomCertification("");
  };

  const addCustomCertification = () => {
    const trimmed = customCertification.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      const updated = [...certifications, trimmed];
      setCertifications(updated);
      setCustomCertification("");
      toast.success(`Added: ${trimmed}`);
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = fullName
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "C";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          Coach Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, rates, and visibility in the coach marketplace
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            This information will be visible to clients in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Preview with Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user?.id) return;
                  
                  setUploading(true);
                  try {
                    const result = await uploadFile(file, "avatars", user.id);
                    if (result.url) {
                      setAvatarUrl(result.url);
                      toast.success("Photo uploaded successfully!");
                    } else {
                      throw new Error(result.error || "Upload failed");
                    }
                  } catch (error) {
                    console.error("Upload error:", error);
                    toast.error("Failed to upload photo. Try using a URL instead.");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar">Profile Photo</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Click the camera icon to upload, or paste a URL below
              </p>
              <Input
                id="avatar"
                placeholder="https://example.com/your-photo.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell potential clients about yourself, your coaching philosophy, and what makes you unique..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              A compelling bio helps attract the right clients
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Professional Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Professional Information
          </CardTitle>
          <CardDescription>
            Highlight your expertise and credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Specializations */}
          <div>
            <Label>Specializations</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {specializations.map((spec) => (
                <Badge key={spec} variant="secondary" className="gap-1">
                  {spec}
                  <button onClick={() => removeSpecialization(spec)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newSpecialization} onValueChange={addSpecialization}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add specialization..." />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATION_OPTIONS.filter(s => !specializations.includes(s)).map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <Label>Certifications</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {certifications.map((cert) => (
                <Badge key={cert} variant="outline" className="gap-1">
                  {cert}
                  <button onClick={() => removeCertification(cert)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newCertification} onValueChange={addCertification}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select certification..." />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATION_OPTIONS.filter(c => !certifications.includes(c)).map((cert) => (
                    <SelectItem key={cert} value={cert}>{cert}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Or type custom certification..."
                value={customCertification}
                onChange={(e) => setCustomCertification(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomCertification()}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={addCustomCertification}
                disabled={!customCertification.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Experience */}
          <div>
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              min={0}
              max={50}
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
              className="mt-1 max-w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing & Availability
          </CardTitle>
          <CardDescription>
            Set your rates and client capacity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate">Monthly Rate</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="rate"
                  type="number"
                  min={0}
                  placeholder="e.g., 200"
                  value={hourlyRate || ""}
                  onChange={(e) => setHourlyRate(e.target.value ? parseInt(e.target.value) : null)}
                  className="flex-1"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="maxClients">Maximum Clients</Label>
              <Input
                id="maxClients"
                type="number"
                min={1}
                max={500}
                value={maxClients}
                onChange={(e) => setMaxClients(parseInt(e.target.value) || 50)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Accepting New Clients</p>
              <p className="text-sm text-muted-foreground">
                Show your profile in the coach marketplace
              </p>
            </div>
            <Switch
              checked={isAcceptingClients}
              onCheckedChange={setIsAcceptingClients}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Control which emails you receive from CustomCoachPro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Check-in Received</p>
              <p className="text-sm text-muted-foreground">Get notified when a client submits a check-in</p>
            </div>
            <Switch
              checked={emailCheckinReceived}
              onCheckedChange={setEmailCheckinReceived}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Plan Assignment Confirmation</p>
              <p className="text-sm text-muted-foreground">Get confirmation when you assign a plan to a client</p>
            </div>
            <Switch
              checked={emailPlanAssigned}
              onCheckedChange={setEmailPlanAssigned}
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <ChangePasswordCard />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
