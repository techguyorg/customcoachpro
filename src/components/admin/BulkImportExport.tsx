import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ContentType = "exercises" | "foods" | "recipes" | "workout_templates" | "diet_plans";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "exercises", label: "Exercises" },
  { value: "foods", label: "Foods" },
  { value: "recipes", label: "Recipes" },
  { value: "workout_templates", label: "Workout Templates" },
  { value: "diet_plans", label: "Diet Plans" },
];

const CSV_HEADERS: Record<ContentType, string[]> = {
  exercises: ["name", "description", "primary_muscle", "secondary_muscles", "equipment", "difficulty", "exercise_type", "instructions", "tips", "video_url"],
  foods: ["name", "category", "subcategory", "brand", "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g", "fiber_per_100g", "default_serving_size", "default_serving_unit"],
  recipes: ["name", "description", "category", "servings", "prep_time_minutes", "cook_time_minutes", "calories_per_serving", "protein_per_serving", "carbs_per_serving", "fat_per_serving", "instructions"],
  workout_templates: ["name", "description", "goal", "difficulty", "days_per_week", "duration_weeks", "template_type"],
  diet_plans: ["name", "description", "goal", "dietary_type", "calories_target", "protein_grams", "carbs_grams", "fat_grams", "meals_per_day"],
};

const SAMPLE_DATA: Record<ContentType, Record<string, string>[]> = {
  exercises: [
    { name: "Barbell Bench Press", description: "Classic chest exercise", primary_muscle: "chest", secondary_muscles: "triceps,shoulders", equipment: "barbell", difficulty: "intermediate", exercise_type: "compound", instructions: "Lie on bench|Lower bar to chest|Press up", tips: "Keep back flat", video_url: "" },
  ],
  foods: [
    { name: "Chicken Breast", category: "protein", subcategory: "poultry", brand: "", calories_per_100g: "165", protein_per_100g: "31", carbs_per_100g: "0", fat_per_100g: "3.6", fiber_per_100g: "0", default_serving_size: "100", default_serving_unit: "g" },
  ],
  recipes: [
    { name: "Protein Pancakes", description: "High protein breakfast", category: "breakfast", servings: "2", prep_time_minutes: "10", cook_time_minutes: "15", calories_per_serving: "250", protein_per_serving: "25", carbs_per_serving: "30", fat_per_serving: "5", instructions: "Mix ingredients|Cook on medium heat" },
  ],
  workout_templates: [
    { name: "Full Body Starter", description: "3-day full body program", goal: "Build muscle", difficulty: "beginner", days_per_week: "3", duration_weeks: "8", template_type: "full_body" },
  ],
  diet_plans: [
    { name: "Lean Bulk", description: "Moderate calorie surplus for muscle gain", goal: "muscle_gain", dietary_type: "standard", calories_target: "2800", protein_grams: "180", carbs_grams: "350", fat_grams: "80", meals_per_day: "5" },
  ],
};

export function BulkImportExport() {
  const [selectedType, setSelectedType] = useState<ContentType>("exercises");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();

  const downloadSampleCSV = () => {
    const headers = CSV_HEADERS[selectedType];
    const sampleRows = SAMPLE_DATA[selectedType];
    
    const csvContent = [
      headers.join(","),
      ...sampleRows.map(row => 
        headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sample_${selectedType}.csv`;
    link.click();
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await api.get<Record<string, unknown>[]>(`/api/admin/content/${selectedType}/export`);

      const headers = CSV_HEADERS[selectedType];
      const csvContent = [
        headers.join(","),
        ...(data || []).map(row => 
          headers.map(h => {
            const value = row[h];
            if (Array.isArray(value)) {
              return `"${value.join("|")}"`;
            }
            return `"${String(value || "").replace(/"/g, '""')}"`;
          }).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedType}_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast({ title: `Exported ${data?.length || 0} ${selectedType}` });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
    
    return lines.slice(1).map(line => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i]?.replace(/^"|"$/g, "") || "";
      });
      return row;
    });
  };

  const importData = async () => {
    if (!importFile) return;
    
    setImporting(true);
    try {
      const text = await importFile.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        throw new Error("No valid data rows found");
      }

      // Transform rows based on content type
      const transformedRows = rows.map(row => {
        const transformed: Record<string, unknown> = { is_system: true };
        
        CSV_HEADERS[selectedType].forEach(header => {
          const value = row[header];
          if (!value) return;
          
          // Handle array fields (pipe-separated)
          if (["secondary_muscles", "instructions", "tips", "common_mistakes"].includes(header)) {
            transformed[header] = value.split("|").map(v => v.trim()).filter(Boolean);
          }
          // Handle numeric fields
          else if (["calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g", "fiber_per_100g", 
                    "default_serving_size", "servings", "prep_time_minutes", "cook_time_minutes",
                    "calories_per_serving", "protein_per_serving", "carbs_per_serving", "fat_per_serving",
                    "calories_target", "protein_grams", "carbs_grams", "fat_grams", "meals_per_day",
                    "days_per_week", "duration_weeks"].includes(header)) {
            const num = parseFloat(value);
            if (!isNaN(num)) transformed[header] = num;
          }
          else {
            transformed[header] = value;
          }
        });
        
        return transformed;
      });

      await api.post(`/api/admin/content/${selectedType}/import`, { data: transformedRows });

      queryClient.invalidateQueries({ queryKey: [`admin-${selectedType}`] });
      toast({ title: `Successfully imported ${rows.length} ${selectedType}` });
      setImportFile(null);
    } catch (error: any) {
      toast({ 
        title: "Import failed", 
        description: error.message || "Check your CSV format",
        variant: "destructive" 
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Import/Export
          </CardTitle>
          <CardDescription>
            Import or export system content using CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ContentType)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <h4 className="font-medium">Export Data</h4>
            <div className="flex flex-wrap gap-3">
              <Button onClick={exportData} disabled={exporting} className="gap-2">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export {CONTENT_TYPES.find(t => t.value === selectedType)?.label}
              </Button>
              <Button variant="outline" onClick={downloadSampleCSV} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Download Sample CSV
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <h4 className="font-medium">Import Data</h4>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Download the sample CSV to see the required format. Use pipe (|) to separate multiple values in array fields like instructions.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="max-w-xs"
                />
              </div>
              <Button 
                onClick={importData} 
                disabled={!importFile || importing}
                className="gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import
              </Button>
            </div>
            
            {importFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {importFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
