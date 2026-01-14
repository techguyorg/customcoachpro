import { useState } from "react";
import { useWorkoutTemplates, type TemplateFilters as Filters } from "@/hooks/useWorkoutTemplates";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateFilters } from "@/components/templates/TemplateFilters";
import { TemplateDetailSheet } from "@/components/templates/TemplateDetailSheet";
import { MyPlansSection } from "@/components/plans/MyPlansSection";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QUICK_FILTERS = [
  { label: "All", value: "all" },
  { label: "Beginner Friendly", value: "beginner" },
  { label: "Strength", value: "strength" },
  { label: "Muscle Building", value: "hypertrophy" },
  { label: "Full Body", value: "full_body" },
  { label: "PPL", value: "push_pull_legs" },
  { label: "Bodyweight", value: "bodyweight" },
];

export default function WorkoutTemplatesPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    templateType: "all",
    difficulty: "all",
    daysPerWeek: "all",
  });
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState("all");

  const { data: templates, isLoading, error } = useWorkoutTemplates(filters);

  const handleTemplateClick = (id: string) => {
    setSelectedTemplateId(id);
    setSheetOpen(true);
  };

  const handleQuickFilter = (value: string) => {
    setQuickFilter(value);
    if (value === "all") {
      setFilters(prev => ({ ...prev, templateType: "all", difficulty: "all" }));
    } else if (value === "beginner") {
      setFilters(prev => ({ ...prev, templateType: "all", difficulty: "beginner" }));
    } else {
      setFilters(prev => ({ ...prev, templateType: value as Filters["templateType"], difficulty: "all" }));
    }
  };

  return (
    <div className="space-y-6">
      {/* My Active Plans */}
      <MyPlansSection planType="workout" title="My Active Programs" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-primary" />
          Workout Programs
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse our library of professionally designed workout programs
        </p>
      </div>

      {/* Quick Filter Tabs */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-2 min-w-max pb-2">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleQuickFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                quickFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
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
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load programs. Please try again.</p>
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => handleTemplateClick(template.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No programs found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Template Detail Sheet */}
      <TemplateDetailSheet
        templateId={selectedTemplateId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
