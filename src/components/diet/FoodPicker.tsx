import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Food } from "@/types";
import foodService from "@/services/foodService";

type FoodPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (food: Food) => void;
};

const PAGE_SIZE = 8;

export function FoodPicker({ open, onClose, onSelect }: FoodPickerProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [calories, setCalories] = useState<[number, number]>([0, 1200]);
  const [protein, setProtein] = useState<[number, number]>([0, 150]);
  const [carbs, setCarbs] = useState<[number, number]>([0, 200]);
  const [fat, setFat] = useState<[number, number]>([0, 80]);

  useEffect(() => {
    setPage(1);
  }, [search, calories, protein, carbs, fat]);

  const { data, isLoading } = useQuery({
    queryKey: ["food-picker", search, calories, protein, carbs, fat, page],
    queryFn: () =>
      foodService.list({
        search: search || undefined,
        caloriesMin: calories[0],
        caloriesMax: calories[1],
        proteinMin: protein[0],
        proteinMax: protein[1],
        carbsMin: carbs[0],
        carbsMax: carbs[1],
        fatMin: fat[0],
        fatMax: fat[1],
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const foods = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  const handleClose = (value: boolean) => {
    if (!value) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Pick a food
          </DialogTitle>
          <DialogDescription>Search your food catalog and link items into meals.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Search</Label>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chicken, rice, oats..."
                  className="border-0 px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Calories</Label>
                <Slider value={calories} onValueChange={(value) => setCalories(value as [number, number])} max={1200} step={10} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{calories[0]} kcal</span>
                  <span>{calories[1]} kcal</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Protein</Label>
                <Slider value={protein} onValueChange={(value) => setProtein(value as [number, number])} max={150} step={2} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{protein[0]} g</span>
                  <span>{protein[1]} g</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Carbs</Label>
                <Slider value={carbs} onValueChange={(value) => setCarbs(value as [number, number])} max={200} step={5} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{carbs[0]} g</span>
                  <span>{carbs[1]} g</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Fat</Label>
                <Slider value={fat} onValueChange={(value) => setFat(value as [number, number])} max={80} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{fat[0]} g</span>
                  <span>{fat[1]} g</span>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[360px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Loading foods...
              </div>
            ) : foods.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No foods found. Try expanding your ranges.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {foods.map((food) => (
                  <div key={food.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold leading-tight">{food.name}</h4>
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
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => onSelect(food)}>
                        Use food
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FoodPicker;
