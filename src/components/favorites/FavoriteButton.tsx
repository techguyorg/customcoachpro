import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsFavorite, useToggleFavorite, FavoriteItemType } from "@/hooks/useFavorites";
import { toast } from "sonner";

interface Props {
  itemType: FavoriteItemType;
  itemId: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default";
  className?: string;
}

export function FavoriteButton({
  itemType,
  itemId,
  size = "icon",
  variant = "ghost",
  className,
}: Props) {
  const { data: isFavorite = false, isLoading: checkLoading } = useIsFavorite(itemType, itemId);
  const toggleMutation = useToggleFavorite();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleMutation.mutateAsync({ itemType, itemId, isFavorite });
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={checkLoading || toggleMutation.isPending}
      className={cn(className)}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
