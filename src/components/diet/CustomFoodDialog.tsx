import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateFood, Food, calculateCalories } from "@/hooks/useFoods";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const SERVING_UNIT_TYPES = [
  { value: "weight", label: "Weight-based (grams, oz)", description: "Macros per 100g" },
  { value: "piece", label: "Piece/Serving", description: "Macros per piece or serving" },
] as const;

const PIECE_UNITS = [
  { value: "piece", label: "Piece (e.g., eggs, fruits)" },
  { value: "serving", label: "Serving" },
  { value: "slice", label: "Slice" },
  { value: "cup", label: "Cup" },
  { value: "tbsp", label: "Tablespoon" },
  { value: "tsp", label: "Teaspoon" },
  { value: "scoop", label: "Scoop" },
];

const WEIGHT_UNITS = [
  { value: "g", label: "Grams" },
  { value: "oz", label: "Ounces" },
  { value: "ml", label: "Milliliters" },
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  serving_unit_type: z.enum(["weight", "piece"]),
  // For weight-based: macros per 100g
  protein_per_100g: z.number().min(0).nullable(),
  carbs_per_100g: z.number().min(0).nullable(),
  fat_per_100g: z.number().min(0).nullable(),
  fiber_per_100g: z.number().min(0).nullable(),
  // For piece-based: macros per piece/serving
  protein_per_piece: z.number().min(0).nullable(),
  carbs_per_piece: z.number().min(0).nullable(),
  fat_per_piece: z.number().min(0).nullable(),
  fiber_per_piece: z.number().min(0).nullable(),
  piece_weight_grams: z.number().min(1).nullable(), // Weight of one piece in grams
  default_serving_size: z.number().min(0.1).default(100),
  default_serving_unit: z.string().default("g"),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  onFoodCreated?: (food: Food) => void;
  trigger?: React.ReactNode;
  isSystemContent?: boolean;
}

const CATEGORIES = [
  "Protein",
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Fats & Oils",
  "Snacks",
  "Beverages",
  "Condiments",
  "Supplements",
  "Prepared Foods",
  "Other",
];

export function CustomFoodDialog({ onFoodCreated, trigger, isSystemContent = false }: Props) {
  const [open, setOpen] = useState(false);
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");
  const createMutation = useCreateFood();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      serving_unit_type: "weight",
      protein_per_100g: null,
      carbs_per_100g: null,
      fat_per_100g: null,
      fiber_per_100g: null,
      protein_per_piece: null,
      carbs_per_piece: null,
      fat_per_piece: null,
      fiber_per_piece: null,
      piece_weight_grams: null,
      default_serving_size: 100,
      default_serving_unit: "g",
    },
  });

  const servingUnitType = form.watch("serving_unit_type");
  
  // Watch macros based on serving type
  const proteinWeight = form.watch("protein_per_100g") || 0;
  const carbsWeight = form.watch("carbs_per_100g") || 0;
  const fatWeight = form.watch("fat_per_100g") || 0;
  
  const proteinPiece = form.watch("protein_per_piece") || 0;
  const carbsPiece = form.watch("carbs_per_piece") || 0;
  const fatPiece = form.watch("fat_per_piece") || 0;
  const pieceWeight = form.watch("piece_weight_grams") || 0;

  // Calculate calories based on type
  const calculatedCaloriesPer100g = calculateCalories(proteinWeight, carbsWeight, fatWeight);
  const calculatedCaloriesPerPiece = calculateCalories(proteinPiece, carbsPiece, fatPiece);

  // When switching serving type, update the default unit
  useEffect(() => {
    if (servingUnitType === "weight") {
      form.setValue("default_serving_unit", "g");
      form.setValue("default_serving_size", 100);
    } else {
      form.setValue("default_serving_unit", "piece");
      form.setValue("default_serving_size", 1);
    }
  }, [servingUnitType, form]);

  const onSubmit = async (data: FormData) => {
    let protein_per_100g = data.protein_per_100g;
    let carbs_per_100g = data.carbs_per_100g;
    let fat_per_100g = data.fat_per_100g;
    let fiber_per_100g = data.fiber_per_100g;
    let calories_per_100g = calculatedCaloriesPer100g;

    // For piece-based foods, convert to per 100g if piece weight is provided
    if (data.serving_unit_type === "piece" && data.piece_weight_grams && data.piece_weight_grams > 0) {
      const multiplier = 100 / data.piece_weight_grams;
      protein_per_100g = (data.protein_per_piece || 0) * multiplier;
      carbs_per_100g = (data.carbs_per_piece || 0) * multiplier;
      fat_per_100g = (data.fat_per_piece || 0) * multiplier;
      fiber_per_100g = (data.fiber_per_piece || 0) * multiplier;
      calories_per_100g = calculateCalories(protein_per_100g, carbs_per_100g, fat_per_100g);
    } else if (data.serving_unit_type === "piece") {
      // Store per-piece macros directly scaled to 100g equivalent (treat 1 piece = 100g for calculation)
      protein_per_100g = data.protein_per_piece;
      carbs_per_100g = data.carbs_per_piece;
      fat_per_100g = data.fat_per_piece;
      fiber_per_100g = data.fiber_per_piece;
      calories_per_100g = calculatedCaloriesPerPiece;
    }

    try {
      const food = await createMutation.mutateAsync({
        name: data.name,
        category: data.category,
        protein_per_100g: protein_per_100g,
        carbs_per_100g: carbs_per_100g,
        fat_per_100g: fat_per_100g,
        fiber_per_100g: fiber_per_100g,
        calories_per_100g: calories_per_100g,
        default_serving_size: data.default_serving_size,
        default_serving_unit: data.default_serving_unit,
        subcategory: null,
        brand: null,
        barcode: null,
        sugar_per_100g: null,
        sodium_mg_per_100g: null,
        is_system: isSuperAdmin && isSystemContent,
      });
      
      toast.success("Custom food created successfully!");
      onFoodCreated?.(food);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Food creation error:", error);
      toast.error("Failed to create food. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Food
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Custom Food</DialogTitle>
          <DialogDescription>
            Create a new food item with custom nutrition values
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Homemade Granola, Egg, Banana" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Serving Unit Type Selection */}
            <FormField
              control={form.control}
              name="serving_unit_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>How is this food measured?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      {SERVING_UNIT_TYPES.map((type) => (
                        <div key={type.value} className="flex items-start space-x-2">
                          <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                          <div className="grid gap-0.5 leading-none">
                            <Label htmlFor={type.value} className="text-sm font-medium cursor-pointer">
                              {type.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight-based macros (per 100g) */}
            {servingUnitType === "weight" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="protein_per_100g"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g/100g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carbs_per_100g"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g/100g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fat_per_100g"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fat (g/100g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fiber_per_100g"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiber (g/100g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    Calculated calories: <span className="font-semibold text-foreground">{calculatedCaloriesPer100g} kcal/100g</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Protein × 4 + Carbs × 4 + Fat × 9)
                  </p>
                </div>
              </>
            )}

            {/* Piece-based macros (per piece/serving) */}
            {servingUnitType === "piece" && (
              <>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm">
                  <p className="text-amber-800 dark:text-amber-200">
                    Enter macros per single piece or serving (e.g., 1 egg, 1 banana, 1 scoop)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="protein_per_piece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g/piece)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carbs_per_piece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g/piece)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fat_per_piece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fat (g/piece)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fiber_per_piece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiber (g/piece)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="piece_weight_grams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight per piece (grams) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g., 50 for a medium egg"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Helps convert between pieces and grams
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    Calculated calories: <span className="font-semibold text-foreground">{calculatedCaloriesPerPiece} kcal/piece</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Protein × 4 + Carbs × 4 + Fat × 9)
                  </p>
                </div>
              </>
            )}

            {/* Default Serving */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="default_serving_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Serving Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_serving_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {servingUnitType === "weight" ? (
                          WEIGHT_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))
                        ) : (
                          PIECE_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Creating..." : "Create Food"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}