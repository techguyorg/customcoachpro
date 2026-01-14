import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutTemplates, type TemplateFilters as Filters, TemplateWithStats } from "@/hooks/useWorkoutTemplates";
import { api } from "@/lib/api";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateFilters } from "@/components/templates/TemplateFilters";
import { TemplateDetailSheet } from "@/components/templates/TemplateDetailSheet";
import { WorkoutProgramWizard } from "@/components/templates/WorkoutProgramWizard";
import { QuickAssignDialog } from "@/components/coach/QuickAssignDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Search, Library, User } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CoachWorkoutProgramsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    templateType: "all",
    difficulty: "all",
    daysPerWeek: "all",
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-programs");
  const [assignTemplateId, setAssignTemplateId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Fetch all templates using the API hook
  const { data: allTemplates = [], isLoading } = useWorkoutTemplates(filters);

  // Filter templates based on active tab
  const myPrograms = allTemplates.filter(
    (t: TemplateWithStats) => !t.is_system && t.created_by === user?.id
  );
  const libraryPrograms = allTemplates.filter(
    (t: TemplateWithStats) => t.is_system
  );

  const templates = activeTab === "my-programs" ? myPrograms : libraryPrograms;

  const handleTemplateClick = (id: string) => {
    setSelectedTemplateId(id);
    setSheetOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await api.delete(`/api/workouts/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      toast.success("Program deleted successfully");
      setDeleteTemplateId(null);
    },
    onError: () => {
      toast.error("Failed to delete program");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-primary" />
            Workout Programs
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage workout programs for your clients
          </p>
        </div>
        <WorkoutProgramWizard />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-programs" className="gap-2">
            <User className="w-4 h-4" />
            My Programs
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <Library className="w-4 h-4" />
            Library
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <TemplateFilters filters={filters} onChange={setFilters} />

      {/* Results count */}
      {!isLoading && templates && (
        <p className="text-sm text-muted-foreground">
          {templates.length} program{templates.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template: TemplateWithStats) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => handleTemplateClick(template.id)}
              showQuickActions
              isOwner={template.created_by === user?.id}
              onAssign={() => setAssignTemplateId(template.id)}
              onDelete={() => setDeleteTemplateId(template.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">
            {activeTab === "my-programs" ? "No custom programs yet" : "No programs found"}
          </h3>
          <p className="text-muted-foreground mt-1">
            {activeTab === "my-programs"
              ? "Create your first workout program to get started"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      )}

      {/* Template Detail Sheet */}
      <TemplateDetailSheet
        templateId={selectedTemplateId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Quick Assign Dialog */}
      <QuickAssignDialog
        open={!!assignTemplateId}
        onOpenChange={(open) => !open && setAssignTemplateId(null)}
        preselectedWorkoutId={assignTemplateId || undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout program? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && deleteMutation.mutate(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
