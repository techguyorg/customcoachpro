import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  showBackButton = true,
  actions 
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="space-y-4">
      {showBackButton && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
