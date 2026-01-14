import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Food, calculateCalories, useUpdateFood } from "@/hooks/useFoods";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  protein_per_100g: z.number().min(0).nullable(),
  carbs_per_100g: z.number().min(0).nullable(),
  fat_per_100g: z.number().min(0).nullable(),
  fiber_per_100g: z.number().min(0).nullable(),
  default_serving_size: z.number().min(1).default(100),
  default_serving_unit: z.string().default("g"),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  food: Food | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function EditFoodDialog({ food, open, onOpenChange }: Props) {
  const updateMutation = useUpdateFood();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      protein_per_100g: null,
      carbs_per_100g: null,
      fat_per_100g: null,
      fiber_per_100g: null,
      default_serving_size: 100,
      default_serving_unit: "g",
    },
  });

  useEffect(() => {
    if (food && open) {
      form.reset({
        name: food.name,
        category: food.category || "",
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fat_per_100g: food.fat_per_100g,
        fiber_per_100g: food.fiber_per_100g,
        default_serving_size: food.default_serving_size || 100,
        default_serving_unit: food.default_serving_unit || "g",
      });
    }
  }, [food, open, form]);

  const protein = form.watch("protein_per_100g") || 0;
  const carbs = form.watch("carbs_per_100g") || 0;
  const fat = form.watch("fat_per_100g") || 0;
  const calculatedCalories = calculateCalories(protein, carbs, fat);

  const onSubmit = async (data: FormData) => {
    if (!food) return;
    
    try {
      await updateMutation.mutateAsync({
        id: food.id,
        food: {
          name: data.name,
          category: data.category,
          protein_per_100g: data.protein_per_100g,
          carbs_per_100g: data.carbs_per_100g,
          fat_per_100g: data.fat_per_100g,
          fiber_per_100g: data.fiber_per_100g,
          calories_per_100g: calculatedCalories,
          default_serving_size: data.default_serving_size,
          default_serving_unit: data.default_serving_unit,
        },
      });
      
      toast.success("Food updated successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update food");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Food</DialogTitle>
          <DialogDescription>
            Update the food item details
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
                    <Input placeholder="e.g., Chicken Breast" {...field} />
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
                Calculated calories: <span className="font-semibold text-foreground">{calculatedCalories} kcal/100g</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="default_serving_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
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
                        <SelectItem value="g">grams</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="oz">ounces</SelectItem>
                        <SelectItem value="piece">piece</SelectItem>
                        <SelectItem value="serving">serving</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
