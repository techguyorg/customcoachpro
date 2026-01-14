import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientProfileData {
  hasProfile: boolean;
  isComplete: boolean;
  missingFields: string[];
  profile: {
    height_cm: number | null;
    current_weight_kg: number | null;
    target_weight_kg: number | null;
    fitness_goals: string[] | null;
    fitness_level: string | null;
    medical_conditions: string | null;
    dietary_restrictions: string[] | null;
  } | null;
}

export function useClientProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async (): Promise<ClientProfileData> => {
      if (!user?.id) {
        return {
          hasProfile: false,
          isComplete: false,
          missingFields: [],
          profile: null,
        };
      }

      try {
        return await api.get<ClientProfileData>('/api/client/profile');
      } catch {
        return {
          hasProfile: false,
          isComplete: false,
          missingFields: ["All profile information"],
          profile: null,
        };
      }
    },
    enabled: !!user?.id,
  });
}
