import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFoods, Food, calculateNutrition } from "@/hooks/useFoods";
import { Badge } from "@/components/ui/badge";

interface Props {
  value?: Food | null;
  onSelect: (food: Food | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FoodSearchCombobox({ value, onSelect, placeholder = "Search foods...", disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: foods = [], isLoading } = useFoods(search);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? (
            <span className="truncate">{value.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search foods..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : search.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Type at least 2 characters to search
              </div>
            ) : foods.length === 0 ? (
              <CommandEmpty>No foods found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {foods.map((food) => {
                  const nutrition = calculateNutrition(food, 100, "g");
                  return (
                    <CommandItem
                      key={food.id}
                      value={food.id}
                      onSelect={() => {
                        onSelect(food);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex flex-col items-start py-3"
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.id === food.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{food.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {food.category && (
                              <Badge variant="outline" className="text-xs">
                                {food.category}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              per 100g: {nutrition.calories} kcal • P:{nutrition.protein}g • C:{nutrition.carbs}g • F:{nutrition.fat}g
                            </span>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
