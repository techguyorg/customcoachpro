import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dumbbell, Calendar, UtensilsCrossed, ChefHat, Apple, Loader2, Plus, Trash2, Edit, MoreHorizontal, Eye, Globe, GlobeLock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

// Import filter components
import {
  ExerciseContentFilters,
  WorkoutContentFilters,
  DietContentFilters,
  RecipeContentFilters,
  FoodContentFilters,
  ContentPagination,
  defaultExerciseFilters,
  defaultWorkoutFilters,
  defaultDietFilters,
  defaultRecipeFilters,
  defaultFoodFilters,
  type ExerciseFilterState,
  type WorkoutFilterState,
  type DietFilterState,
  type RecipeFilterState,
  type FoodFilterState,
} from "./ContentFilters";

// Import dialogs for creating/editing content
import { CreateExerciseDialog } from "@/components/exercises/CreateExerciseDialog";
import { CreateWorkoutTemplateDialog } from "@/components/templates/CreateWorkoutTemplateDialog";
import { CreateDietPlanDialog } from "@/components/diet/CreateDietPlanDialog";
import { RecipeBuilderDialog } from "@/components/diet/RecipeBuilderDialog";
import { CustomFoodDialog } from "@/components/diet/CustomFoodDialog";
import { EditFoodDialog } from "@/components/diet/EditFoodDialog";

// Import detail sheets for viewing
import { ExerciseDetailSheet } from "@/components/exercises/ExerciseDetailSheet";
import { TemplateDetailSheet } from "@/components/templates/TemplateDetailSheet";
import { DietPlanDetailSheet } from "@/components/diet/DietPlanDetailSheet";
import { RecipeDetailSheet } from "@/components/diet/RecipeDetailSheet";

// Import hooks for fetching with meals
import { useDietPlanWithMeals } from "@/hooks/useDietPlans";
import { useRecipeWithIngredients } from "@/hooks/useRecipes";

const ITEMS_PER_PAGE = 25;

interface SystemContentManagerProps {
  initialTab?: string;
}

export function SystemContentManager({ initialTab = "exercises" }: SystemContentManagerProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="exercises" className="gap-2">
            <Dumbbell className="w-4 h-4" />
            <span className="hidden sm:inline">Exercises</span>
          </TabsTrigger>
          <TabsTrigger value="workouts" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Workouts</span>
          </TabsTrigger>
          <TabsTrigger value="diets" className="gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            <span className="hidden sm:inline">Diets</span>
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2">
            <ChefHat className="w-4 h-4" />
            <span className="hidden sm:inline">Recipes</span>
          </TabsTrigger>
          <TabsTrigger value="foods" className="gap-2">
            <Apple className="w-4 h-4" />
            <span className="hidden sm:inline">Foods</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="exercises"><ExercisesTab /></TabsContent>
          <TabsContent value="workouts"><WorkoutsTab /></TabsContent>
          <TabsContent value="diets"><DietsTab /></TabsContent>
          <TabsContent value="recipes"><RecipesTab /></TabsContent>
          <TabsContent value="foods"><FoodsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ExercisesTab() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ExerciseFilterState>(defaultExerciseFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: exercises, isLoading } = useQuery({
    queryKey: ["admin-exercises"],
    queryFn: async () => {
      return api.get<any[]>('/api/exercises?is_system=true');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
      toast({ title: "Exercise deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete exercise", variant: "destructive" });
    },
  });

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let result = [...(exercises || [])];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(search));
    }
    if (filters.muscleGroup !== "all") {
      result = result.filter(e => e.primary_muscle === filters.muscleGroup);
    }
    if (filters.equipment !== "all") {
      result = result.filter(e => e.equipment === filters.equipment);
    }
    if (filters.difficulty !== "all") {
      result = result.filter(e => e.difficulty === filters.difficulty);
    }
    
    result.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof typeof a];
      const bVal = b[filters.sortBy as keyof typeof b];
      const cmp = String(aVal || "").localeCompare(String(bVal || ""));
      return filters.sortOrder === "asc" ? cmp : -cmp;
    });
    
    return result;
  }, [exercises, filters]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilterChange = (newFilters: ExerciseFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Exercises</CardTitle>
            <CardDescription>Manage platform-wide exercise library</CardDescription>
          </div>
          <CreateExerciseDialog
            trigger={<Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Exercise</Button>}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ExerciseContentFilters filters={filters} onChange={handleFilterChange} />
        
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">{filteredAndSorted.length} exercises found</p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Muscle</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((ex) => (
                    <TableRow key={ex.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedExerciseId(ex.id); setSheetOpen(true); }}>
                      <TableCell className="font-medium">{ex.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{ex.primary_muscle.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="capitalize text-muted-foreground">{ex.equipment.replace("_", " ")}</TableCell>
                      <TableCell className="capitalize">{ex.difficulty}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ActionsMenu 
                          onView={() => { setSelectedExerciseId(ex.id); setSheetOpen(true); }}
                          onEdit={() => { setEditingExercise(ex); setEditDialogOpen(true); }}
                          onDelete={() => deleteMutation.mutate(ex.id)}
                          itemName={ex.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <ContentPagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage}
                totalItems={filteredAndSorted.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            )}
          </div>
        )}
      </CardContent>
      
      <ExerciseDetailSheet exerciseId={selectedExerciseId} open={sheetOpen} onOpenChange={setSheetOpen} />
      <CreateExerciseDialog initialData={editingExercise} open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingExercise(null); }} />
    </Card>
  );
}

function WorkoutsTab() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<WorkoutFilterState>(defaultWorkoutFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-workout-templates"],
    queryFn: async () => {
      return api.get<any[]>('/api/workouts/templates?is_system=true');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/workouts/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workout-templates"] });
      toast({ title: "Workout template deleted" });
    },
    onError: () => { toast({ title: "Failed to delete template", variant: "destructive" }); },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      return api.patch(`/api/workouts/templates/${id}/publish`, { is_published: isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workout-templates"] });
      toast({ title: "Publish status updated" });
    },
    onError: () => { toast({ title: "Failed to update publish status", variant: "destructive" }); },
  });

  const filteredAndSorted = useMemo(() => {
    let result = [...(templates || [])];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
    }
    if (filters.templateType !== "all") result = result.filter(t => t.template_type === filters.templateType);
    if (filters.difficulty !== "all") result = result.filter(t => t.difficulty === filters.difficulty);
    
    result.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof typeof a];
      const bVal = b[filters.sortBy as keyof typeof b];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal || "").localeCompare(String(bVal || ""));
      return filters.sortOrder === "asc" ? cmp : -cmp;
    });
    
    return result;
  }, [templates, filters]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Workout Templates</CardTitle>
            <CardDescription>Manage platform-wide workout programs</CardDescription>
          </div>
          <CreateWorkoutTemplateDialog isSystemContent={true} />
        </div>
      </CardHeader>
      <CardContent>
        <WorkoutContentFilters filters={filters} onChange={(f) => { setFilters(f); setCurrentPage(1); }} />
        
        {isLoading ? <LoadingState /> : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">{filteredAndSorted.length} templates found</p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Days/Week</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedTemplateId(t.id); setSheetOpen(true); }}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{t.template_type?.replace("_", " ") || "General"}</Badge></TableCell>
                      <TableCell>{t.days_per_week} days</TableCell>
                      <TableCell className="capitalize">{t.difficulty}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={t.is_published !== false}
                            onCheckedChange={(checked) => publishMutation.mutate({ id: t.id, isPublished: checked })}
                            disabled={publishMutation.isPending}
                          />
                          {t.is_published !== false ? (
                            <Globe className="w-4 h-4 text-success" />
                          ) : (
                            <GlobeLock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ActionsMenu 
                          onView={() => { setSelectedTemplateId(t.id); setSheetOpen(true); }}
                          onEdit={() => { setEditingTemplate(t); setEditDialogOpen(true); }}
                          onDelete={() => deleteMutation.mutate(t.id)}
                          itemName={t.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && <ContentPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredAndSorted.length} itemsPerPage={ITEMS_PER_PAGE} />}
          </div>
        )}
      </CardContent>
      
      <TemplateDetailSheet templateId={selectedTemplateId} open={sheetOpen} onOpenChange={setSheetOpen} />
      <CreateWorkoutTemplateDialog initialData={editingTemplate} open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingTemplate(null); }} isSystemContent={true} />
    </Card>
  );
}

function DietsTab() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DietFilterState>(defaultDietFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  
  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-diet-plans"],
    queryFn: async () => {
      return api.get<any[]>('/api/diet/plans?is_system=true');
    },
  });

  const { data: selectedPlan } = useDietPlanWithMeals(selectedPlanId || undefined);
  const { data: editingPlan } = useDietPlanWithMeals(editingPlanId || undefined);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/diet/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-diet-plans"] });
      toast({ title: "Diet plan deleted" });
    },
    onError: () => { toast({ title: "Failed to delete diet plan", variant: "destructive" }); },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      return api.patch(`/api/diet/plans/${id}/publish`, { is_published: isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-diet-plans"] });
      toast({ title: "Publish status updated" });
    },
    onError: () => { toast({ title: "Failed to update publish status", variant: "destructive" }); },
  });

  const filteredAndSorted = useMemo(() => {
    let result = [...(plans || [])];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(search));
    }
    if (filters.dietaryType !== "all") result = result.filter(p => p.dietary_type === filters.dietaryType);
    if (filters.goal !== "all") result = result.filter(p => p.goal === filters.goal);
    
    result.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof typeof a];
      const bVal = b[filters.sortBy as keyof typeof b];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal || "").localeCompare(String(bVal || ""));
      return filters.sortOrder === "asc" ? cmp : -cmp;
    });
    
    return result;
  }, [plans, filters]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Diet Plans</CardTitle>
            <CardDescription>Manage platform-wide diet plans</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Add Plan</Button>
          <CreateDietPlanDialog open={showCreate} onOpenChange={setShowCreate} isSystemContent={true} />
        </div>
      </CardHeader>
      <CardContent>
        <DietContentFilters filters={filters} onChange={(f) => { setFilters(f); setCurrentPage(1); }} />
        
        {isLoading ? <LoadingState /> : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">{filteredAndSorted.length} diet plans found</p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPlanId(p.id)}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{p.dietary_type || "Standard"}</Badge></TableCell>
                      <TableCell className="capitalize">{p.goal?.replace("_", " ") || "—"}</TableCell>
                      <TableCell>{p.calories_target || "—"} kcal</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={p.is_published !== false}
                            onCheckedChange={(checked) => publishMutation.mutate({ id: p.id, isPublished: checked })}
                            disabled={publishMutation.isPending}
                          />
                          {p.is_published !== false ? (
                            <Globe className="w-4 h-4 text-success" />
                          ) : (
                            <GlobeLock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ActionsMenu 
                          onView={() => setSelectedPlanId(p.id)}
                          onEdit={() => setEditingPlanId(p.id)}
                          onDelete={() => deleteMutation.mutate(p.id)}
                          itemName={p.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && <ContentPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredAndSorted.length} itemsPerPage={ITEMS_PER_PAGE} />}
          </div>
        )}
      </CardContent>
      
      <DietPlanDetailSheet plan={selectedPlan || null} onOpenChange={(open) => !open && setSelectedPlanId(null)} />
      <CreateDietPlanDialog 
        open={!!editingPlanId} 
        onOpenChange={(open) => { if (!open) setEditingPlanId(null); }} 
        editingPlan={editingPlan || null}
        isSystemContent={true}
      />
    </Card>
  );
}

function RecipesTab() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RecipeFilterState>(defaultRecipeFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  
  const { data: recipes, isLoading } = useQuery({
    queryKey: ["admin-recipes"],
    queryFn: async () => {
      return api.get<any[]>('/api/recipes?is_system=true');
    },
  });

  const { data: selectedRecipe } = useRecipeWithIngredients(selectedRecipeId || undefined);
  const { data: editingRecipe } = useRecipeWithIngredients(editingRecipeId || undefined);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });
      toast({ title: "Recipe deleted" });
    },
    onError: () => { toast({ title: "Failed to delete recipe", variant: "destructive" }); },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      return api.patch(`/api/recipes/${id}/publish`, { is_published: isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });
      toast({ title: "Publish status updated" });
    },
    onError: () => { toast({ title: "Failed to update publish status", variant: "destructive" }); },
  });

  const filteredAndSorted = useMemo(() => {
    let result = [...(recipes || [])];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(search));
    }
    if (filters.category !== "all") result = result.filter(r => r.category?.toLowerCase() === filters.category);
    
    result.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof typeof a];
      const bVal = b[filters.sortBy as keyof typeof b];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal || "").localeCompare(String(bVal || ""));
      return filters.sortOrder === "asc" ? cmp : -cmp;
    });
    
    return result;
  }, [recipes, filters]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Recipes</CardTitle>
            <CardDescription>Manage platform-wide recipe library</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Add Recipe</Button>
          <RecipeBuilderDialog open={showCreate} onOpenChange={setShowCreate} isSystemContent={true} />
        </div>
      </CardHeader>
      <CardContent>
        <RecipeContentFilters filters={filters} onChange={(f) => { setFilters(f); setCurrentPage(1); }} />
        
        {isLoading ? <LoadingState /> : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">{filteredAndSorted.length} recipes found</p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Servings</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRecipeId(r.id)}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.category || "General"}</Badge></TableCell>
                      <TableCell>{r.calories_per_serving || "—"} kcal</TableCell>
                      <TableCell>{r.servings}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={r.is_published !== false}
                            onCheckedChange={(checked) => publishMutation.mutate({ id: r.id, isPublished: checked })}
                            disabled={publishMutation.isPending}
                          />
                          {r.is_published !== false ? (
                            <Globe className="w-4 h-4 text-success" />
                          ) : (
                            <GlobeLock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ActionsMenu 
                          onView={() => setSelectedRecipeId(r.id)}
                          onEdit={() => setEditingRecipeId(r.id)}
                          onDelete={() => deleteMutation.mutate(r.id)}
                          itemName={r.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && <ContentPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredAndSorted.length} itemsPerPage={ITEMS_PER_PAGE} />}
          </div>
        )}
      </CardContent>
      
      <RecipeDetailSheet recipe={selectedRecipe || null} onOpenChange={(open) => !open && setSelectedRecipeId(null)} />
      <RecipeBuilderDialog 
        open={!!editingRecipeId} 
        onOpenChange={(open) => { if (!open) setEditingRecipeId(null); }} 
        editingRecipe={editingRecipe || null}
        isSystemContent={true}
      />
    </Card>
  );
}

function FoodsTab() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FoodFilterState>(defaultFoodFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingFood, setEditingFood] = useState<any>(null);
  
  const { data: foods, isLoading } = useQuery({
    queryKey: ["admin-foods"],
    queryFn: async () => {
      return api.get<any[]>('/api/foods?is_system=true');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/foods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-foods"] });
      toast({ title: "Food deleted" });
    },
    onError: () => { toast({ title: "Failed to delete food", variant: "destructive" }); },
  });

  const filteredAndSorted = useMemo(() => {
    let result = [...(foods || [])];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(search));
    }
    if (filters.category !== "all") result = result.filter(f => f.category === filters.category);
    
    result.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof typeof a];
      const bVal = b[filters.sortBy as keyof typeof b];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal || "").localeCompare(String(bVal || ""));
      return filters.sortOrder === "asc" ? cmp : -cmp;
    });
    
    return result;
  }, [foods, filters]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Foods</CardTitle>
            <CardDescription>Manage platform-wide food database</CardDescription>
          </div>
          <CustomFoodDialog isSystemContent={true} />
        </div>
      </CardHeader>
      <CardContent>
        <FoodContentFilters filters={filters} onChange={(f) => { setFilters(f); setCurrentPage(1); }} />
        
        {isLoading ? <LoadingState /> : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">{filteredAndSorted.length} foods found</p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Protein</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{f.category}</Badge></TableCell>
                      <TableCell>{f.calories_per_100g} /100g</TableCell>
                      <TableCell>{f.protein_per_100g}g</TableCell>
                      <TableCell>
                        <ActionsMenu 
                          onEdit={() => setEditingFood(f)}
                          onDelete={() => deleteMutation.mutate(f.id)}
                          itemName={f.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && <ContentPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredAndSorted.length} itemsPerPage={ITEMS_PER_PAGE} />}
          </div>
        )}
      </CardContent>
      
      <EditFoodDialog 
        food={editingFood} 
        open={!!editingFood} 
        onOpenChange={(open) => { if (!open) setEditingFood(null); }} 
      />
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

interface ActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  itemName: string;
}

function ActionsMenu({ onView, onEdit, onDelete, itemName }: ActionsMenuProps) {
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onView && (
            <DropdownMenuItem onClick={onView} className="gap-2">
              <Eye className="h-4 w-4" />View Details
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Edit className="h-4 w-4" />Edit
            </DropdownMenuItem>
          )}
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{itemName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this item from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
