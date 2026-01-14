import { useState } from "react";
import { useExercises, type ExerciseFilters as Filters } from "@/hooks/useExercises";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { ExerciseFilters } from "@/components/exercises/ExerciseFilters";
import { ExerciseDetailSheet } from "@/components/exercises/ExerciseDetailSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, Search } from "lucide-react";

export default function ExercisesPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    muscleGroup: "all",
    equipment: "all",
    difficulty: "all",
  });
  
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: exercises, isLoading, error } = useExercises(filters);

  const handleExerciseClick = (id: string) => {
    setSelectedExerciseId(id);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          Exercise Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse our comprehensive database of exercises with detailed instructions
        </p>
      </div>

      {/* Filters */}
      <ExerciseFilters filters={filters} onChange={setFilters} />

      {/* Results count */}
      {!isLoading && exercises && (
        <p className="text-sm text-muted-foreground">
          {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load exercises. Please try again.</p>
        </div>
      ) : exercises && exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => handleExerciseClick(exercise.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No exercises found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exerciseId={selectedExerciseId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
