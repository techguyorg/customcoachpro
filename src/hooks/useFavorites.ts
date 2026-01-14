import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Favorite } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type FavoriteItemType = "diet_plan" | "recipe" | "workout_template" | "exercise";

export interface UserFavorite {
  id: string;
  user_id: string;
  item_type: FavoriteItemType;
  item_id: string;
  created_at: string;
}

export function useFavorites(itemType?: FavoriteItemType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", user?.id, itemType],
    queryFn: async () => {
      const endpoint = itemType 
        ? `/api/favorites?itemType=${itemType}` 
        : '/api/favorites';
      return api.get<UserFavorite[]>(endpoint);
    },
    enabled: !!user?.id,
  });
}

export function useIsFavorite(itemType: FavoriteItemType, itemId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite-check", user?.id, itemType, itemId],
    queryFn: async () => {
      try {
        const data = await api.get<{ isFavorite: boolean }>(`/api/favorites/check?itemType=${itemType}&itemId=${itemId}`);
        return data.isFavorite;
      } catch {
        return false;
      }
    },
    enabled: !!user?.id && !!itemId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
      isFavorite,
    }: {
      itemType: FavoriteItemType;
      itemId: string;
      isFavorite: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      if (isFavorite) {
        // Remove favorite
        return api.delete(`/api/favorites?itemType=${itemType}&itemId=${itemId}`);
      } else {
        // Add favorite
        return api.post('/api/favorites', { itemType, itemId });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({
        queryKey: ["favorite-check", user?.id, variables.itemType, variables.itemId],
      });
    },
  });
}

export function useFavoriteItems<T>(
  itemType: FavoriteItemType,
  fetchItems: (ids: string[]) => Promise<T[]>
) {
  const { data: favorites = [] } = useFavorites(itemType);
  const itemIds = favorites.map((f) => f.item_id);

  return useQuery({
    queryKey: ["favorite-items", itemType, itemIds],
    queryFn: () => fetchItems(itemIds),
    enabled: itemIds.length > 0,
  });
}
