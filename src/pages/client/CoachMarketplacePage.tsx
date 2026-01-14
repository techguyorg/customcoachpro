import { useState } from "react";
import { Search, SlidersHorizontal, X, Users, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachCard } from "@/components/marketplace/CoachCard";
import { CoachDetailSheet } from "@/components/marketplace/CoachDetailSheet";
import { useMyCoach } from "@/hooks/useMyCoach";
import {
  useCoachMarketplace,
  useSpecializations,
  type CoachFilters,
  type CoachProfile,
} from "@/hooks/useCoachMarketplace";

export default function CoachMarketplacePage() {
  const [filters, setFilters] = useState<CoachFilters>({
    search: "",
    specialization: "all",
    minRating: 0,
    maxRate: null,
    acceptingOnly: true,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: coaches, isLoading, error } = useCoachMarketplace(filters);
  const { data: specializations } = useSpecializations();
  const { data: myCoach } = useMyCoach();

  const activeFilterCount = [
    filters.specialization !== "all",
    filters.minRating > 0,
    filters.maxRate !== null,
    !filters.acceptingOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      search: "",
      specialization: "all",
      minRating: 0,
      maxRate: null,
      acceptingOnly: true,
    });
  };

  const handleCoachClick = (coach: CoachProfile) => {
    setSelectedCoach(coach);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Find Your Coach
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse certified fitness coaches and find the perfect match for your goals
        </p>
      </div>

      {/* Current Coach Warning */}
      {myCoach && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            You currently have a coach ({myCoach.fullName}). Requesting a new coach will end your current relationship upon acceptance.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search coaches by name or specialty..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-9"
            />
          </div>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Specialization */}
                <div>
                  <Label className="text-sm">Specialization</Label>
                  <Select
                    value={filters.specialization}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, specialization: value }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="All specializations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specializations</SelectItem>
                      {specializations?.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Rating */}
                <div>
                  <Label className="text-sm">
                    Minimum Rating: {filters.minRating > 0 ? `${filters.minRating}+` : "Any"}
                  </Label>
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={([value]) =>
                      setFilters((prev) => ({ ...prev, minRating: value }))
                    }
                    max={5}
                    step={0.5}
                    className="mt-3"
                  />
                </div>

                {/* Max Rate */}
                <div>
                  <Label className="text-sm">
                    Max Monthly Rate: {filters.maxRate ? `$${filters.maxRate}` : "Any"}
                  </Label>
                  <Slider
                    value={[filters.maxRate || 500]}
                    onValueChange={([value]) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxRate: value === 500 ? null : value,
                      }))
                    }
                    max={500}
                    step={25}
                    className="mt-3"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    id="accepting"
                    checked={filters.acceptingOnly}
                    onCheckedChange={(checked) =>
                      setFilters((prev) => ({ ...prev, acceptingOnly: checked }))
                    }
                  />
                  <Label htmlFor="accepting" className="text-sm cursor-pointer">
                    Only show coaches accepting new clients
                  </Label>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Results count */}
      {!isLoading && coaches && (
        <p className="text-sm text-muted-foreground">
          {coaches.length} coach{coaches.length !== 1 ? "es" : ""} found
        </p>
      )}

      {/* Coach Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load coaches. Please try again.</p>
        </div>
      ) : coaches && coaches.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {coaches.map((coach) => (
              <CoachCard 
                key={coach.id} 
                coach={coach} 
                onClick={() => handleCoachClick(coach)}
              />
            ))}
          </div>
          <CoachDetailSheet 
            coach={selectedCoach} 
            open={sheetOpen} 
            onOpenChange={setSheetOpen} 
          />
        </>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No coaches found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
