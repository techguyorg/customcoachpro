import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  MUSCLE_GROUPS, 
  EQUIPMENT_TYPES, 
  DIFFICULTY_LEVELS,
  type ExerciseFilters as Filters 
} from "@/hooks/useExercises";

interface ExerciseFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const formatLabel = (value: string) => 
  value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

export function ExerciseFilters({ filters, onChange }: ExerciseFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.muscleGroup !== "all" || 
    filters.equipment !== "all" || 
    filters.difficulty !== "all";

  const clearFilters = () => {
    onChange({
      search: "",
      muscleGroup: "all",
      equipment: "all",
      difficulty: "all",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Muscle Group */}
        <Select
          value={filters.muscleGroup}
          onValueChange={(value) => onChange({ ...filters, muscleGroup: value as Filters["muscleGroup"] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Muscle Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Muscles</SelectItem>
            {MUSCLE_GROUPS.map((muscle) => (
              <SelectItem key={muscle} value={muscle}>
                {formatLabel(muscle)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Equipment */}
        <Select
          value={filters.equipment}
          onValueChange={(value) => onChange({ ...filters, equipment: value as Filters["equipment"] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            {EQUIPMENT_TYPES.map((equipment) => (
              <SelectItem key={equipment} value={equipment}>
                {formatLabel(equipment)}
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
