import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Search, ListFilter, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import exerciseService from "@/services/exerciseService";

const PAGE_SIZE = 12;

export function ExerciseCatalogPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, muscleGroup, equipment]);

  const { data, isLoading } = useQuery({
    queryKey: ["exercise-catalog", search, muscleGroup, equipment, page],
    queryFn: () =>
      exerciseService.list({
        search: search || undefined,
        muscle: muscleGroup || undefined,
        equipment: equipment || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const exercises = data?.items ?? [];
  const muscleOptions = data?.filters.muscleGroups ?? [];
  const equipmentOptions = data?.filters.equipment ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  const resetFilters = () => {
    setSearch("");
    setMuscleGroup("");
    setEquipment("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Exercise catalog"
        description="Search and filter movements to drop into your programs."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/workout-plans")}>
              Manage plans
            </Button>
            <Button onClick={() => navigate("/workout-plans/new")} className="shadow-energy">
              Build workout plan
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-icon-workout" />
              Catalog filters
            </CardTitle>
            <CardDescription>Find exercises by name, target muscle, and available equipment.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} disabled={!search && !muscleGroup && !equipment}>
            Clear filters
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Deadlift, press, row..."
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Muscle group</label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              >
                <option value="">All</option>
                {muscleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Equipment</label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              >
                <option value="">All</option>
                {equipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-icon-workout" />
            Exercises
          </CardTitle>
          <CardDescription>Browse ready-to-use movements. Clone or link them inside workouts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3 animate-pulse bg-muted/40" />
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exercises found. Adjust your filters to see more.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold leading-tight">{exercise.name}</h3>
                      {exercise.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{exercise.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">Library</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {exercise.muscleGroups?.map((group) => (
                      <Badge key={group} variant="secondary">
                        {group}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {exercise.tags?.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2 py-1">
                        #{tag}
                      </span>
                    ))}
                    {exercise.equipment && (
                      <span className="rounded-full bg-muted px-2 py-1">Equipment: {exercise.equipment}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(Math.max(1, currentPage - 1));
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === idx + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(idx + 1);
                      }}
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(Math.min(totalPages, currentPage + 1));
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExerciseCatalogPage;
