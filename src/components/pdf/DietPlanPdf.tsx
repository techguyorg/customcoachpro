import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles, formatPdfDate } from '@/lib/pdf-utils';

interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  notes?: string;
}

interface Meal {
  name: string;
  time?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  foods: FoodItem[];
  notes?: string;
  preparationTips?: string;
}

interface DietPlanData {
  name: string;
  description?: string;
  goal?: string;
  dietaryType?: string;
  caloriesTarget?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  mealsPerDay?: number;
  meals: Meal[];
  notes?: string;
  createdBy?: string;
  clientName?: string;
  waterIntake?: string;
  supplements?: string[];
}

export function DietPlanPdf({ data }: { data: DietPlanData }) {
  const totalFoods = data.meals.reduce((sum, meal) => sum + meal.foods.length, 0);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>{data.name}</Text>
          {data.goal && <Text style={pdfStyles.subtitle}>Goal: {data.goal}</Text>}
          {data.clientName && (
            <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
              Prepared for: {data.clientName}
            </Text>
          )}
          <Text style={pdfStyles.date}>Generated on {formatPdfDate(new Date())}</Text>
        </View>

        {/* Description */}
        {data.description && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Plan Description</Text>
            <Text style={{ color: '#4b5563', fontSize: 10, lineHeight: 1.5 }}>
              {data.description}
            </Text>
          </View>
        )}

        {/* Daily Macros */}
        {data.caloriesTarget && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Daily Nutrition Targets</Text>
            <View style={pdfStyles.statsGrid}>
              <View style={pdfStyles.statBox}>
                <Text style={pdfStyles.statValue}>{data.caloriesTarget}</Text>
                <Text style={pdfStyles.statLabel}>Calories (kcal)</Text>
              </View>
              <View style={pdfStyles.statBox}>
                <Text style={pdfStyles.statValue}>{data.proteinGrams || 0}g</Text>
                <Text style={pdfStyles.statLabel}>Protein</Text>
              </View>
              <View style={pdfStyles.statBox}>
                <Text style={pdfStyles.statValue}>{data.carbsGrams || 0}g</Text>
                <Text style={pdfStyles.statLabel}>Carbohydrates</Text>
              </View>
              <View style={pdfStyles.statBox}>
                <Text style={pdfStyles.statValue}>{data.fatGrams || 0}g</Text>
                <Text style={pdfStyles.statLabel}>Fat</Text>
              </View>
            </View>
            
            {/* Macro Percentages */}
            {data.caloriesTarget && (
              <View style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
                <Text style={{ fontSize: 9, color: '#0369a1', fontWeight: 'bold', marginBottom: 4 }}>
                  Macro Distribution
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={{ fontSize: 9, color: '#0369a1' }}>
                    Protein: {Math.round(((data.proteinGrams || 0) * 4 / data.caloriesTarget) * 100)}%
                  </Text>
                  <Text style={{ fontSize: 9, color: '#0369a1' }}>
                    Carbs: {Math.round(((data.carbsGrams || 0) * 4 / data.caloriesTarget) * 100)}%
                  </Text>
                  <Text style={{ fontSize: 9, color: '#0369a1' }}>
                    Fat: {Math.round(((data.fatGrams || 0) * 9 / data.caloriesTarget) * 100)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Plan Info */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Plan Details</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Dietary Type</Text>
            <Text style={pdfStyles.value}>{data.dietaryType?.replace(/_/g, ' ') || 'Standard'}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Meals Per Day</Text>
            <Text style={pdfStyles.value}>{data.mealsPerDay || data.meals.length}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Total Food Items</Text>
            <Text style={pdfStyles.value}>{totalFoods}</Text>
          </View>
          {data.waterIntake && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Recommended Water Intake</Text>
              <Text style={pdfStyles.value}>{data.waterIntake}</Text>
            </View>
          )}
        </View>

        {/* Meals */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Meal Plan Structure</Text>
          
          {data.meals.map((meal, index) => (
            <View key={index} style={pdfStyles.mealCard} wrap={false}>
              {/* Meal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6 }}>
                <View>
                  <Text style={pdfStyles.mealTitle}>{meal.name}</Text>
                  {meal.time && (
                    <Text style={pdfStyles.mealTime}>Suggested time: {meal.time}</Text>
                  )}
                </View>
                {meal.calories && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1f2937' }}>{meal.calories} kcal</Text>
                  </View>
                )}
              </View>
              
              {/* Meal Macros */}
              {(meal.protein || meal.carbs || meal.fat) && (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8, padding: 6, backgroundColor: '#f0fdf4', borderRadius: 4 }}>
                  {meal.protein !== undefined && (
                    <Text style={{ fontSize: 9, color: '#166534' }}>Protein: {meal.protein}g</Text>
                  )}
                  {meal.carbs !== undefined && (
                    <Text style={{ fontSize: 9, color: '#166534' }}>Carbs: {meal.carbs}g</Text>
                  )}
                  {meal.fat !== undefined && (
                    <Text style={{ fontSize: 9, color: '#166534' }}>Fat: {meal.fat}g</Text>
                  )}
                </View>
              )}
              
              {/* Food Items */}
              {meal.foods.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 9, color: '#374151', fontWeight: 'bold', marginBottom: 6 }}>Food Items:</Text>
                  
                  {/* Food Table Header */}
                  <View style={{ flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 4 }}>
                    <Text style={{ flex: 2, fontSize: 8, fontWeight: 'bold', color: '#374151' }}>Food</Text>
                    <Text style={{ flex: 1, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Amount</Text>
                    <Text style={{ flex: 0.7, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Cal</Text>
                    <Text style={{ flex: 0.5, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>P</Text>
                    <Text style={{ flex: 0.5, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>C</Text>
                    <Text style={{ flex: 0.5, fontSize: 8, fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>F</Text>
                  </View>
                  
                  {meal.foods.map((food, foodIndex) => (
                    <View key={foodIndex}>
                      <View style={{ flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#ffffff', marginBottom: 2, borderRadius: 2 }}>
                        <Text style={{ flex: 2, color: '#1f2937', fontSize: 9 }}>{food.name}</Text>
                        <Text style={{ flex: 1, color: '#6b7280', fontSize: 9, textAlign: 'center' }}>
                          {food.quantity} {food.unit}
                        </Text>
                        <Text style={{ flex: 0.7, color: '#6b7280', fontSize: 8, textAlign: 'center' }}>
                          {food.calories || '—'}
                        </Text>
                        <Text style={{ flex: 0.5, color: '#6b7280', fontSize: 8, textAlign: 'center' }}>
                          {food.protein !== undefined ? `${food.protein}g` : '—'}
                        </Text>
                        <Text style={{ flex: 0.5, color: '#6b7280', fontSize: 8, textAlign: 'center' }}>
                          {food.carbs !== undefined ? `${food.carbs}g` : '—'}
                        </Text>
                        <Text style={{ flex: 0.5, color: '#6b7280', fontSize: 8, textAlign: 'center' }}>
                          {food.fat !== undefined ? `${food.fat}g` : '—'}
                        </Text>
                      </View>
                      {food.notes && (
                        <Text style={{ fontSize: 7, color: '#6b7280', fontStyle: 'italic', paddingLeft: 8, marginBottom: 2 }}>
                          {food.notes}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
              
              {/* Preparation Tips */}
              {meal.preparationTips && (
                <View style={{ marginTop: 8, padding: 6, backgroundColor: '#fffbeb', borderRadius: 4 }}>
                  <Text style={{ fontSize: 8, color: '#92400e', fontWeight: 'bold' }}>Preparation Tips:</Text>
                  <Text style={{ fontSize: 8, color: '#92400e', marginTop: 2 }}>{meal.preparationTips}</Text>
                </View>
              )}
              
              {/* Meal Notes */}
              {meal.notes && (
                <Text style={{ color: '#6b7280', fontSize: 8, marginTop: 8, fontStyle: 'italic', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                  Note: {meal.notes}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Supplements */}
        {data.supplements && data.supplements.length > 0 && (
          <View style={pdfStyles.section} wrap={false}>
            <Text style={pdfStyles.sectionTitle}>Recommended Supplements</Text>
            {data.supplements.map((supplement, index) => (
              <Text key={index} style={{ fontSize: 9, color: '#4b5563', paddingVertical: 2 }}>
                • {supplement}
              </Text>
            ))}
          </View>
        )}

        {/* Shopping List - All Foods */}
        <View style={pdfStyles.section} wrap={false}>
          <Text style={pdfStyles.sectionTitle}>Shopping List</Text>
          <View style={{ marginTop: 8 }}>
            {data.meals.flatMap((meal) => 
              meal.foods.map((food) => food.name)
            ).filter((name, index, self) => self.indexOf(name) === index)
            .sort()
            .map((foodName, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
                <View style={{ width: 12, height: 12, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 2, marginRight: 8 }} />
                <Text style={{ fontSize: 9, color: '#4b5563' }}>{foodName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Additional Notes</Text>
            <Text style={{ color: '#4b5563', fontSize: 10, lineHeight: 1.5 }}>
              {data.notes}
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          CustomCoachPro - Diet Plan • {formatPdfDate(new Date())}
          {data.createdBy && ` • Created by ${data.createdBy}`}
        </Text>
      </Page>
    </Document>
  );
}