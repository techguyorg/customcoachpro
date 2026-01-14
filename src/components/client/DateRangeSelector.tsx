import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateRangeOption = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

interface DateRangeSelectorProps {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
  className?: string;
}

const options: { value: DateRangeOption; label: string }[] = [
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "All" },
];

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  return (
    <div className={cn("flex gap-1 bg-muted rounded-lg p-1", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-7 px-3 text-xs",
            value === option.value 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function getDateRangeStart(range: DateRangeOption): Date | null {
  const now = new Date();
  switch (range) {
    case "1W":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "1M":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3M":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6M":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1Y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "ALL":
    default:
      return null;
  }
}
