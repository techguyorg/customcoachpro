import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import foodService from "@/services/foodService";

const PAGE_SIZE = 12;

type MacroFilter = {
  label: string;
  key: "calories" | "protein" | "carbs" | "fat";
  max: number;
  step?: number;
};

const macroConfigs: MacroFilter[] = [
  { label: "Calories", key: "calories", max: 1200, step: 10 },
  { label: "Protein", key: "protein", max: 150, step: 2 },
  { label: "Carbs", key: "carbs", max: 200, step: 5 },
  { label: "Fat", key: "fat", max: 80, step: 1 },
];

export function FoodCatalogPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [ranges, setRanges] = useState<Record<MacroFilter["key"], [number, number]>>({
    calories: [0, macroConfigs.find((cfg) => cfg.key === "calories")?.max ?? 1200],
    protein: [0, macroConfigs.find((cfg) => cfg.key === "protein")?.max ?? 150],
    carbs: [0, macroConfigs.find((cfg) => cfg.key === "carbs")?.max ?? 200],
    fat: [0, macroConfigs.find((cfg) => cfg.key === "fat")?.max ?? 80],
  });

  useEffect(() => {
    setPage(1);
  }, [search, ranges]);

  const { data, isLoading } = useQuery({
    queryKey: ["food-catalog", search, ranges, page],
    queryFn: () =>
      foodService.list({
        search: search || undefined,
        caloriesMin: ranges.calories[0],
        caloriesMax: ranges.calories[1],
        proteinMin: ranges.protein[0],
        proteinMax: ranges.protein[1],
        carbsMin: ranges.carbs[0],
        carbsMax: ranges.carbs[1],
        fatMin: ranges.fat[0],
        fatMax: ranges.fat[1],
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const foods = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;
  const isDefaultRange = macroConfigs.every(
    (config) => ranges[config.key][0] === 0 && ranges[config.key][1] === config.max
  );

  const resetFilters = () => {
    setSearch("");
    setRanges({
      calories: [0, macroConfigs.find((cfg) => cfg.key === "calories")?.max ?? 1200],
      protein: [0, macroConfigs.find((cfg) => cfg.key === "protein")?.max ?? 150],
      carbs: [0, macroConfigs.find((cfg) => cfg.key === "carbs")?.max ?? 200],
      fat: [0, macroConfigs.find((cfg) => cfg.key === "fat")?.max ?? 80],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Food catalog"
        description="Search foods and filter by macro ranges to build better meals."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/diet-plans")}>
              Manage plans
            </Button>
            <Button onClick={() => navigate("/diet-plans/new")} className="shadow-energy">
              Build diet plan
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-icon-diet" />
              Macro filters
            </CardTitle>
            <CardDescription>Dial in calorie and macro ranges to trim your results.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} disabled={search === "" && isDefaultRange}>
            Reset filters
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chicken, oats, rice..."
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {macroConfigs.map((config) => (
              <div key={config.key} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{config.label}</Badge>
                    <span className="text-muted-foreground text-xs">(per serving)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ranges[config.key][0]} - {ranges[config.key][1]}
                    {config.key === "calories" ? " kcal" : " g"}
                  </span>
                </div>
                <Slider
                  value={ranges[config.key]}
                  onValueChange={(value) => setRanges((prev) => ({ ...prev, [config.key]: value as [number, number] }))}
                  min={0}
                  max={config.max}
                  step={config.step ?? 1}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-icon-diet" />
            Foods
          </CardTitle>
          <CardDescription>Macro-friendly foods you can slot into meals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3 animate-pulse bg-muted/40" />
              ))}
            </div>
          ) : foods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No foods found. Widen your ranges to discover more options.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {foods.map((food) => (
                <div key={food.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold leading-tight">{food.name}</h3>
                      <p className="text-xs text-muted-foreground">{food.servingSize}</p>
                    </div>
                    <Badge variant="outline">{food.calories} kcal</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">Protein</div>
                      <div className="text-sm font-semibold">{food.protein}g</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">Carbs</div>
                      <div className="text-sm font-semibold">{food.carbs}g</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">Fat</div>
                      <div className="text-sm font-semibold">{food.fat}g</div>
                    </div>
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

export default FoodCatalogPage;
