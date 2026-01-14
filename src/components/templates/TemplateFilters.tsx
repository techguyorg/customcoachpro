import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  TEMPLATE_TYPES, 
  DAYS_PER_WEEK_OPTIONS,
  type TemplateFilters as Filters 
} from "@/hooks/useWorkoutTemplates";
import { DIFFICULTY_LEVELS } from "@/hooks/useExercises";

interface TemplateFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const formatLabel = (value: string) => 
  value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

export function TemplateFilters({ filters, onChange }: TemplateFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.templateType !== "all" || 
    filters.difficulty !== "all" ||
    filters.daysPerWeek !== "all";

  const clearFilters = () => {
    onChange({
      search: "",
      templateType: "all",
      difficulty: "all",
      daysPerWeek: "all",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search programs by name, goal, or description..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Template Type */}
        <Select
          value={filters.templateType}
          onValueChange={(value) => onChange({ ...filters, templateType: value as Filters["templateType"] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Program Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TEMPLATE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {formatLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty */}
        <Select
          value={filters.difficulty}
          onValueChange={(value) => onChange({ ...filters, difficulty: value as Filters["difficulty"] })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {DIFFICULTY_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {formatLabel(level)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Days Per Week */}
        <Select
          value={filters.daysPerWeek === "all" ? "all" : String(filters.daysPerWeek)}
          onValueChange={(value) => onChange({ 
            ...filters, 
            daysPerWeek: value === "all" ? "all" : parseInt(value) 
          })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Days/Week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Schedule</SelectItem>
            {DAYS_PER_WEEK_OPTIONS.map((days) => (
              <SelectItem key={days} value={String(days)}>
                {days} days/week
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
