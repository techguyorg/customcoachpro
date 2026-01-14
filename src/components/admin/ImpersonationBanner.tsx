import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedName, impersonatedRole, stopImpersonation } = useImpersonation();

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">
            Viewing as: <strong>{impersonatedName}</strong> ({impersonatedRole})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonation}
          className="text-amber-950 hover:bg-amber-600"
        >
          <X className="h-4 w-4 mr-1" />
          Exit View
        </Button>
      </div>
    </div>
  );
}
