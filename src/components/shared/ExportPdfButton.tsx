import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf-utils";
import { toast } from "sonner";

interface ExportPdfButtonProps {
  document: React.ReactElement;
  filename: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function ExportPdfButton({ 
  document, 
  filename, 
  variant = "outline",
  size = "sm",
  className = "",
  label = "Export PDF"
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadPdf(document, filename);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleExport} 
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
