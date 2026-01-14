import { useState } from "react";
import { Plus, Trash2, ArrowLeftRight, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import { Food, calculateNutrition } from "@/hooks/useFoods";

export interface FoodAlternative {
  id: string;
  originalFood: Food;
  alternativeFood: Food;
  reason?: string;
}

interface Props {
  food: Food;
  alternatives: FoodAlternative[];
  onAddAlternative: (alternative: Food) => void;
  onRemoveAlternative: (alternativeId: string) => void;
}

export function FoodAlternativesPopover({
  food,
  alternatives,
  onAddAlternative,
  onRemoveAlternative,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const foodAlternatives = alternatives.filter((a) => a.originalFood.id === food.id);

  const handleAdd = () => {
    if (selectedFood) {
      onAddAlternative(selectedFood);
      setSelectedFood(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
        >
          <ArrowLeftRight className="h-3 w-3 mr-1" />
          {foodAlternatives.length > 0 ? `${foodAlternatives.length} alt` : "Alternatives"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm">Alternatives for {food.name}</h4>
            <p className="text-xs text-muted-foreground">
              Suggest substitute foods with similar nutrition
            </p>
          </div>

          {foodAlternatives.length > 0 && (
            <div className="space-y-2">
              {foodAlternatives.map((alt) => {
                const nutrition = calculateNutrition(alt.alternativeFood, 100, "g");
                return (
                  <div
                    key={alt.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {alt.alternativeFood.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {nutrition.calories} kcal | P:{nutrition.protein}g
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => onRemoveAlternative(alt.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <FoodSearchCombobox
                value={selectedFood}
                onSelect={setSelectedFood}
                placeholder="Search alternative..."
              />
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!selectedFood}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Alternative manager dialog for bulk editing
interface AlternativesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foods: Food[];
  alternatives: FoodAlternative[];
  onAlternativesChange: (alternatives: FoodAlternative[]) => void;
}

export function FoodAlternativesDialog({
  open,
  onOpenChange,
  foods,
  alternatives,
  onAlternativesChange,
}: AlternativesDialogProps) {
  const [selectedOriginal, setSelectedOriginal] = useState<Food | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<Food | null>(null);

  const addAlternative = () => {
    if (!selectedOriginal || !selectedAlternative) return;

    const newAlt: FoodAlternative = {
      id: crypto.randomUUID(),
      originalFood: selectedOriginal,
      alternativeFood: selectedAlternative,
    };

    onAlternativesChange([...alternatives, newAlt]);
    setSelectedAlternative(null);
  };

  const removeAlternative = (id: string) => {
    onAlternativesChange(alternatives.filter((a) => a.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Food Alternatives</DialogTitle>
          <DialogDescription>
            Add substitute foods for items in the meal plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new alternative */}
          <div className="grid grid-cols-[1fr,auto,1fr,auto] gap-2 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">Original Food</label>
              <FoodSearchCombobox
                value={selectedOriginal}
                onSelect={setSelectedOriginal}
                placeholder="Select food..."
              />
            </div>
            <div className="pb-2">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Alternative</label>
              <FoodSearchCombobox
                value={selectedAlternative}
                onSelect={setSelectedAlternative}
                placeholder="Select alternative..."
              />
            </div>
            <Button onClick={addAlternative} disabled={!selectedOriginal || !selectedAlternative}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List of alternatives */}
          {alternatives.length > 0 ? (
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {alternatives.map((alt) => (
                <div key={alt.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1">
                    <Badge variant="outline">{alt.originalFood.name}</Badge>
                  </div>
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Badge variant="secondary">{alt.alternativeFood.name}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeAlternative(alt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              No alternatives added yet
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
