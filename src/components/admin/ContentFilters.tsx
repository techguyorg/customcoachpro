import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { 
  MUSCLE_GROUPS, 
  EQUIPMENT_TYPES, 
  DIFFICULTY_LEVELS,
} from "@/hooks/useExercises";
import { TEMPLATE_TYPES } from "@/hooks/useWorkoutTemplates";

const formatLabel = (value: string) => 
  value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

// Exercise Filters
export interface ExerciseFilterState {
  search: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const defaultExerciseFilters: ExerciseFilterState = {
  search: "",
  muscleGroup: "all",
  equipment: "all",
  difficulty: "all",
  sortBy: "name",
  sortOrder: "asc",
};

interface ExerciseFiltersProps {
  filters: ExerciseFilterState;
  onChange: (filters: ExerciseFilterState) => void;
}

export function ExerciseContentFilters({ filters, onChange }: ExerciseFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.muscleGroup !== "all" || 
    filters.equipment !== "all" || 
    filters.difficulty !== "all";

  const clearFilters = () => onChange(defaultExerciseFilters);
  
  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      onChange({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" });
    } else {
      onChange({ ...filters, sortBy: field, sortOrder: "asc" });
    }
  };

  const SortIcon = filters.sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.muscleGroup} onValueChange={(v) => onChange({ ...filters, muscleGroup: v })}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Muscle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Muscles</SelectItem>
            {MUSCLE_GROUPS.map((m) => (
              <SelectItem key={m} value={m}>{formatLabel(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.equipment} onValueChange={(v) => onChange({ ...filters, equipment: v })}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            {EQUIPMENT_TYPES.map((e) => (
              <SelectItem key={e} value={e}>{formatLabel(e)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.difficulty} onValueChange={(v) => onChange({ ...filters, difficulty: v })}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={d}>{formatLabel(d)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant={filters.sortBy === "name" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("name")}
          className="gap-1"
        >
          Name {filters.sortBy === "name" && <SortIcon className="w-3 h-3" />}
        </Button>
        
        <Button 
          variant={filters.sortBy === "primary_muscle" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("primary_muscle")}
          className="gap-1"
        >
          Muscle {filters.sortBy === "primary_muscle" && <SortIcon className="w-3 h-3" />}
        </Button>
        
        <Button 
          variant={filters.sortBy === "difficulty" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("difficulty")}
          className="gap-1"
        >
          Difficulty {filters.sortBy === "difficulty" && <SortIcon className="w-3 h-3" />}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// Workout Filters
export interface WorkoutFilterState {
  search: string;
  templateType: string;
  difficulty: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const defaultWorkoutFilters: WorkoutFilterState = {
  search: "",
  templateType: "all",
  difficulty: "all",
  sortBy: "name",
  sortOrder: "asc",
};

interface WorkoutFiltersProps {
  filters: WorkoutFilterState;
  onChange: (filters: WorkoutFilterState) => void;
}

export function WorkoutContentFilters({ filters, onChange }: WorkoutFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.templateType !== "all" || 
    filters.difficulty !== "all";

  const clearFilters = () => onChange(defaultWorkoutFilters);
  
  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      onChange({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" });
    } else {
      onChange({ ...filters, sortBy: field, sortOrder: "asc" });
    }
  };

  const SortIcon = filters.sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search workout templates..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.templateType} onValueChange={(v) => onChange({ ...filters, templateType: v })}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TEMPLATE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.difficulty} onValueChange={(v) => onChange({ ...filters, difficulty: v })}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={d}>{formatLabel(d)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant={filters.sortBy === "name" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("name")}
          className="gap-1"
        >
          Name {filters.sortBy === "name" && <SortIcon className="w-3 h-3" />}
        </Button>
        
        <Button 
          variant={filters.sortBy === "days_per_week" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("days_per_week")}
          className="gap-1"
        >
          Days {filters.sortBy === "days_per_week" && <SortIcon className="w-3 h-3" />}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// Diet Plan Filters
export interface DietFilterState {
  search: string;
  dietaryType: string;
  goal: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const defaultDietFilters: DietFilterState = {
  search: "",
  dietaryType: "all",
  goal: "all",
  sortBy: "name",
  sortOrder: "asc",
};

const DIETARY_TYPES = ["standard", "vegetarian", "vegan", "keto", "paleo", "mediterranean", "low_carb", "high_protein"];
const DIET_GOALS = ["weight_loss", "muscle_gain", "maintenance", "performance", "general_health"];

interface DietFiltersProps {
  filters: DietFilterState;
  onChange: (filters: DietFilterState) => void;
}

export function DietContentFilters({ filters, onChange }: DietFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.dietaryType !== "all" || 
    filters.goal !== "all";

  const clearFilters = () => onChange(defaultDietFilters);
  
  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      onChange({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" });
    } else {
      onChange({ ...filters, sortBy: field, sortOrder: "asc" });
    }
  };

  const SortIcon = filters.sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search diet plans..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.dietaryType} onValueChange={(v) => onChange({ ...filters, dietaryType: v })}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Diet Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DIETARY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.goal} onValueChange={(v) => onChange({ ...filters, goal: v })}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Goals</SelectItem>
            {DIET_GOALS.map((g) => (
              <SelectItem key={g} value={g}>{formatLabel(g)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant={filters.sortBy === "name" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("name")}
          className="gap-1"
        >
          Name {filters.sortBy === "name" && <SortIcon className="w-3 h-3" />}
        </Button>
        
        <Button 
          variant={filters.sortBy === "calories_target" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("calories_target")}
          className="gap-1"
        >
          Calories {filters.sortBy === "calories_target" && <SortIcon className="w-3 h-3" />}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// Recipe Filters
export interface RecipeFilterState {
  search: string;
  category: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const defaultRecipeFilters: RecipeFilterState = {
  search: "",
  category: "all",
  sortBy: "name",
  sortOrder: "asc",
};

const RECIPE_CATEGORIES = ["breakfast", "lunch", "dinner", "snack", "dessert", "smoothie", "salad", "soup", "healthy", "quick"];

interface RecipeFiltersProps {
  filters: RecipeFilterState;
  onChange: (filters: RecipeFilterState) => void;
}

export function RecipeContentFilters({ filters, onChange }: RecipeFiltersProps) {
  const hasActiveFilters = filters.search || filters.category !== "all";

  const clearFilters = () => onChange(defaultRecipeFilters);
  
  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      onChange({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" });
    } else {
      onChange({ ...filters, sortBy: field, sortOrder: "asc" });
    }
  };

  const SortIcon = filters.sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.category} onValueChange={(v) => onChange({ ...filters, category: v })}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {RECIPE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant={filters.sortBy === "name" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("name")}
          className="gap-1"
        >
          Name {filters.sortBy === "name" && <SortIcon className="w-3 h-3" />}
        </Button>
        
        <Button 
          variant={filters.sortBy === "calories_per_serving" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("calories_per_serving")}
          className="gap-1"
        >
          Calories {filters.sortBy === "calories_per_serving" && <SortIcon className="w-3 h-3" />}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// Food Filters
export interface FoodFilterState {
  search: string;
  category: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const defaultFoodFilters: FoodFilterState = {
  search: "",
  category: "all",
  sortBy: "name",
  sortOrder: "asc",
};

const FOOD_CATEGORIES = ["Protein", "Vegetables", "Fruits", "Grains", "Dairy", "Fats & Oils", "Snacks", "Beverages", "Condiments", "Supplements", "Prepared Foods"];

interface FoodFiltersProps {
  filters: FoodFilterState;
  onChange: (filters: FoodFilterState) => void;
}

export function FoodContentFilters({ filters, onChange }: FoodFiltersProps) {
  const hasActiveFilters = filters.search || filters.category !== "all";

  const clearFilters = () => onChange(defaultFoodFilters);
  
  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      onChange({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" });
    } else {
      onChange({ ...filters, sortBy: field, sortOrder: "asc" });
    }
  };

  const SortIcon = filters.sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search foods..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.category} onValueChange={(v) => onChange({ ...filters, category: v })}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {FOOD_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant={filters.sortBy === "name" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("name")}
          className="gap-1"
        >
          Name {filters.sortBy === "name" && <SortIcon className="w-3 h-3" />}
        </Button>
        
        <Button 
          variant={filters.sortBy === "protein_per_100g" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("protein_per_100g")}
          className="gap-1"
        >
          Protein {filters.sortBy === "protein_per_100g" && <SortIcon className="w-3 h-3" />}
        </Button>
        
        <Button 
          variant={filters.sortBy === "calories_per_100g" ? "secondary" : "outline"} 
          size="sm" 
          onClick={() => toggleSort("calories_per_100g")}
          className="gap-1"
        >
          Calories {filters.sortBy === "calories_per_100g" && <SortIcon className="w-3 h-3" />}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function ContentPagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} items
      </span>
      <div className="flex gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page: number;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="w-8"
            >
              {page}
            </Button>
          );
        })}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
