# CustomCoachPro - Components Guide

**Author:** Susheel Bhatt  
**Contact:** s.susheel9@gmail.com

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Client Components](#client-components)
3. [Coach Components](#coach-components)
4. [Diet Components](#diet-components)
5. [Exercise Components](#exercise-components)
6. [Template Components](#template-components)
7. [Marketplace Components](#marketplace-components)
8. [Shared Components](#shared-components)
9. [UI Components (shadcn/ui)](#ui-components-shadcnui)
10. [Component Patterns](#component-patterns)

---

## Component Architecture

### Design Principles

1. **Single Responsibility** - Each component has one clear purpose
2. **Composition** - Complex UIs built from simple components
3. **Data Fetching in Hooks** - Components receive data via hooks
4. **Controlled Forms** - Forms use React Hook Form
5. **Semantic Tokens** - All colors use Tailwind design tokens

### Component Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Feature | `components/client/`, `components/coach/` | Role-specific features |
| Domain | `components/diet/`, `components/templates/` | Domain-specific |
| UI | `components/ui/` | Base shadcn/ui components |
| Layout | Within page files | Page structure |

---

## Client Components

### ClientOnboardingDialog

Multi-step onboarding wizard for new clients.

**Location:** `src/components/client/ClientOnboardingDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<OnboardingData>;
}
```

**Features:**
- 5-step wizard (Basic Info, Body Stats, Goals, Restrictions, Review)
- Progress indicator
- Form validation per step
- Saves to client_profiles table

**Usage:**
```tsx
<ClientOnboardingDialog 
  open={showOnboarding} 
  onOpenChange={setShowOnboarding} 
/>
```

---

### AddMeasurementDialog

Log body measurements with multiple data points.

**Location:** `src/components/client/AddMeasurementDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Features:**
- Weight (required)
- Body fat percentage
- Muscle mass
- Body circumferences (chest, waist, hips, arms, thighs, calves, neck, shoulders)
- Notes field
- Date picker

**Data Flow:**
```
User Input → React Hook Form → useClientProgress.addMeasurement → client_measurements table
```

---

### AddPhotoDialog

Upload progress photos with pose categorization.

**Location:** `src/components/client/AddPhotoDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Features:**
- File upload with preview
- Pose type selection (front, back, side)
- Date picker
- Notes field
- Privacy toggle
- Uploads to Azure Blob Storage via edge function

---

### AddGoalDialog

Create fitness goals with tracking parameters.

**Location:** `src/components/client/AddGoalDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Features:**
- Goal type selection (weight, measurement, performance, habit)
- Title and description
- Target and starting values
- Unit selection
- Target date
- Progress calculation

---

### GoalCard

Display individual goal with progress indicator.

**Location:** `src/components/client/GoalCard.tsx`

**Props:**
```typescript
interface Props {
  goal: ClientGoal;
  onUpdate?: (goalId: string, updates: Partial<ClientGoal>) => void;
  onDelete?: (goalId: string) => void;
}
```

**Features:**
- Progress bar visualization
- Status badges (active, completed, abandoned)
- Quick update current value
- Edit and delete actions
- Days remaining display

---

### MeasurementChart

Visualize measurement trends over time.

**Location:** `src/components/client/MeasurementChart.tsx`

**Props:**
```typescript
interface Props {
  measurements: ClientMeasurement[];
  metric: 'weight_kg' | 'body_fat_pct' | 'chest_cm' | /* ... */;
  title?: string;
}
```

**Features:**
- Line chart using Recharts
- Multiple metric support
- Responsive sizing
- Tooltip with details
- Custom axis formatting

---

### MyCoachCard

Display assigned coach information.

**Location:** `src/components/client/MyCoachCard.tsx`

**Props:**
```typescript
interface Props {
  coach: CoachProfile & { profile: Profile };
  onMessage?: () => void;
  onEndRelationship?: () => void;
}
```

**Features:**
- Coach avatar and name
- Specializations badges
- Rating display
- Message button
- End relationship option

---

### PhotoGallery

Grid display of progress photos with comparison.

**Location:** `src/components/client/PhotoGallery.tsx`

**Props:**
```typescript
interface Props {
  photos: ProgressPhoto[];
  onDelete?: (photoId: string) => void;
}
```

**Features:**
- Grid layout with thumbnails
- Full-size view on click
- Filter by pose type
- Date range filter
- Before/after comparison mode
- Delete functionality

---

## Coach Components

### ClientCard

Client list item with quick actions.

**Location:** `src/components/coach/ClientCard.tsx`

**Props:**
```typescript
interface Props {
  client: ClientWithProfile;
  onViewDetails?: () => void;
  onAssignPlan?: () => void;
  onMessage?: () => void;
  onUpdateStatus?: (status: 'active' | 'paused' | 'ended') => void;
}
```

**Features:**
- Client avatar and name
- Status badge (active, paused, ended)
- Last check-in date
- Quick action buttons
- Dropdown menu for more actions

---

### ClientDetailSheet

Full client details in slide-out panel.

**Location:** `src/components/coach/ClientDetailSheet.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}
```

**Features:**
- Tabbed interface (Overview, Progress, Check-ins, Notes, Plans)
- Profile information display
- Measurement history
- Goal tracking
- Photo gallery
- Notes management
- Assigned plans

---

### CheckinReviewSheet

Review and respond to client check-ins.

**Location:** `src/components/coach/CheckinReviewSheet.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkin: ClientCheckin;
  onSubmitReview?: (feedback: string, rating?: number) => void;
}
```

**Features:**
- Check-in details display
- Adherence metrics visualization
- Wellness metrics (sleep, stress, energy, mood)
- Attached photos viewer
- Feedback text area
- Rating input
- Submit review action

---

### AssignPlanDialog

Assign workout or diet plans to clients.

**Location:** `src/components/coach/AssignPlanDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}
```

**Features:**
- Plan type selection (workout/diet)
- Plan search and selection
- Start date picker
- End date picker (optional)
- Coach notes field
- Creates plan_assignments record

---

### QuickAssignDialog

Quick plan assignment from dashboard.

**Location:** `src/components/coach/QuickAssignDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedWorkoutId?: string;
  preselectedDietId?: string;
  onSuccess?: () => void;
}
```

**Features:**
- Client selection dropdown
- Pre-selected plan (from context)
- Simplified assignment flow
- Quick access from plan cards

---

### InviteClientDialog

Send email invitations to prospective clients.

**Location:** `src/components/coach/InviteClientDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Features:**
- Email input with validation
- Client name field
- Personal message field
- Triggers send-client-invitation edge function
- Success/error feedback

---

### AddNoteDialog

Add notes about clients.

**Location:** `src/components/coach/AddNoteDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}
```

**Features:**
- Title field
- Content textarea
- Note type selection
- Priority level
- Tags input
- Pin toggle
- Reference date

---

### ClientNotesTab

Manage client notes within detail sheet.

**Location:** `src/components/coach/ClientNotesTab.tsx`

**Props:**
```typescript
interface Props {
  clientId: string;
}
```

**Features:**
- Notes list with filters
- Pin/unpin functionality
- Edit inline
- Delete with confirmation
- Sort by date or priority
- Filter by type

---

## Diet Components

### CreateDietPlanDialog

Create comprehensive diet plans.

**Location:** `src/components/diet/CreateDietPlanDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editPlan?: DietPlan; // For editing existing
}
```

**Features:**
- Plan name and description
- Goal selection
- Dietary type (vegetarian, vegan, keto, etc.)
- Macro targets (calories, protein, carbs, fat)
- Meals per day
- Meal builder with foods/recipes
- Save as system or custom

---

### DietPlanDetailSheet

View diet plan details.

**Location:** `src/components/diet/DietPlanDetailSheet.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
}
```

**Features:**
- Plan overview with macros
- Meal list with timing
- Food items per meal
- Nutritional breakdown
- Assign to client action
- Clone plan action

---

### MealFoodBuilder

Build meals with foods and recipes.

**Location:** `src/components/diet/MealFoodBuilder.tsx`

**Props:**
```typescript
interface Props {
  mealId: string;
  items: MealFoodItem[];
  onChange: (items: MealFoodItem[]) => void;
}
```

**Features:**
- Food search combobox
- Recipe search
- Quantity input
- Unit selection
- Calculated macros display
- Drag to reorder
- Remove items

---

### FoodSearchCombobox

Autocomplete search for foods.

**Location:** `src/components/diet/FoodSearchCombobox.tsx`

**Props:**
```typescript
interface Props {
  value?: string;
  onSelect: (food: Food) => void;
  placeholder?: string;
}
```

**Features:**
- Debounced search
- Category grouping
- Nutritional preview
- Create custom food option
- Recent selections

---

### CustomFoodDialog

Add custom foods to database.

**Location:** `src/components/diet/CustomFoodDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (food: Food) => void;
}
```

**Features:**
- Food name and brand
- Category selection
- Nutritional information per 100g
- Serving size and unit
- Barcode input (optional)

---

### RecipeBuilderDialog

Create recipes from foods.

**Location:** `src/components/diet/RecipeBuilderDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editRecipe?: Recipe;
}
```

**Features:**
- Recipe name and description
- Category selection
- Ingredient list with food search
- Quantity and unit per ingredient
- Servings count
- Prep and cook time
- Instructions textarea
- Auto-calculated nutritional values

---

### RecipeDetailSheet

View recipe details.

**Location:** `src/components/diet/RecipeDetailSheet.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
}
```

**Features:**
- Recipe overview
- Ingredient list with amounts
- Step-by-step instructions
- Nutritional per serving
- Prep and cook times
- Add to meal action
- Clone recipe action

---

### FoodAlternatives

Display food substitution options.

**Location:** `src/components/diet/FoodAlternatives.tsx`

**Props:**
```typescript
interface Props {
  foodId: string;
  onSelect?: (alternativeId: string) => void;
}
```

**Features:**
- Alternative food list
- Nutritional comparison
- Reason for substitution
- One-click swap

---

## Exercise Components

### ExerciseCard

Display exercise in grid or list.

**Location:** `src/components/exercises/ExerciseCard.tsx`

**Props:**
```typescript
interface Props {
  exercise: Exercise;
  onClick?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}
```

**Features:**
- Exercise image/placeholder
- Name and description
- Primary muscle badge
- Equipment badge
- Difficulty indicator
- Favorite toggle

---

### ExerciseDetailSheet

Full exercise details.

**Location:** `src/components/exercises/ExerciseDetailSheet.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string;
}
```

**Features:**
- Exercise video/image
- Detailed instructions
- Tips for proper form
- Common mistakes
- Alternative exercises
- Add to workout action

---

### ExerciseFilters

Filter controls for exercise library.

**Location:** `src/components/exercises/ExerciseFilters.tsx`

**Props:**
```typescript
interface Props {
  filters: ExerciseFilters;
  onChange: (filters: ExerciseFilters) => void;
}
```

**Features:**
- Search input
- Muscle group select
- Equipment multi-select
- Difficulty select
- Exercise type select
- Clear filters button

---

### CreateExerciseDialog

Create custom exercises.

**Location:** `src/components/exercises/CreateExerciseDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Features:**
- Exercise name
- Description textarea
- Primary muscle selection
- Secondary muscles multi-select
- Equipment selection
- Difficulty level
- Exercise type
- Instructions list
- Tips list
- Video URL (optional)

---

## Template Components

### TemplateCard

Workout program card with actions.

**Location:** `src/components/templates/TemplateCard.tsx`

**Props:**
```typescript
interface Props {
  template: WorkoutTemplate;
  onClick?: () => void;
  onAssign?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}
```

**Features:**
- Template name and description
- Days per week
- Duration in weeks
- Difficulty badge
- Template type badge
- Dropdown actions menu

---

### TemplateDetailSheet

Full workout program structure.

**Location:** `src/components/templates/TemplateDetailSheet.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
}
```

**Features:**
- Program overview
- Week-by-week breakdown
- Day details with exercises
- Sets, reps, rest info
- Exercise links
- Start program action
- Assign to client action

---

### TemplateFilters

Filter controls for templates.

**Location:** `src/components/templates/TemplateFilters.tsx`

**Props:**
```typescript
interface Props {
  filters: TemplateFilters;
  onChange: (filters: TemplateFilters) => void;
}
```

**Features:**
- Search input
- Difficulty select
- Template type select
- Days per week filter
- Duration range
- System/custom toggle

---

### CreateWorkoutTemplateDialog

Create workout programs.

**Location:** `src/components/templates/CreateWorkoutTemplateDialog.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  cloneFrom?: string; // Template ID to clone
}
```

**Features:**
- Program name and description
- Goal selection
- Difficulty level
- Days per week
- Duration in weeks
- Periodization toggle
- Opens WorkoutProgramEditor on create

---

### WorkoutProgramEditor

Visual program structure editor.

**Location:** `src/components/templates/WorkoutProgramEditor.tsx`

**Props:**
```typescript
interface Props {
  templateId: string;
  onSave?: () => void;
  onCancel?: () => void;
}
```

**Features:**
- Week tabs (if periodized)
- Day cards with exercises
- Add/remove days
- Add/remove exercises
- Exercise search
- Sets, reps, rest configuration
- Drag to reorder
- Save draft functionality

---

## Marketplace Components

### CoachCard

Coach listing in marketplace.

**Location:** `src/components/marketplace/CoachCard.tsx`

**Props:**
```typescript
interface Props {
  coach: CoachWithProfile;
  onClick?: () => void;
  onRequest?: () => void;
  hasRequest?: boolean;
}
```

**Features:**
- Coach avatar and name
- Specializations
- Experience years
- Rating and reviews count
- Hourly rate
- Availability status
- Request coaching button

---

### CoachDetailSheet

Full coach profile.

**Location:** `src/components/marketplace/CoachDetailSheet.tsx`

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
}
```

**Features:**
- Full profile display
- Bio section
- Certifications list
- Specializations detail
- Pricing information
- Reviews section
- Request coaching action

---

## Shared Components

### NotificationBell

Notification indicator and dropdown.

**Location:** `src/components/notifications/NotificationBell.tsx`

**Props:**
```typescript
interface Props {
  // No props - uses useNotifications hook internally
}
```

**Features:**
- Unread count badge
- Dropdown notification list
- Mark as read on click
- Mark all as read
- Links to relevant pages
- Real-time updates

---

### FavoriteButton

Toggle favorite status.

**Location:** `src/components/favorites/FavoriteButton.tsx`

**Props:**
```typescript
interface Props {
  itemType: 'exercise' | 'recipe' | 'template';
  itemId: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Heart icon toggle
- Filled when favorited
- Optimistic updates
- Works with any favoritable item

---

### MyPlansSection

Display active plans.

**Location:** `src/components/plans/MyPlansSection.tsx`

**Props:**
```typescript
interface Props {
  userId: string;
}
```

**Features:**
- Active workout plans
- Active diet plans
- Plan details preview
- View full plan action
- Days remaining

---

### NavLink

Custom React Router NavLink wrapper.

**Location:** `src/components/NavLink.tsx`

**Props:**
```typescript
interface Props {
  to: string;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}
```

**Features:**
- Simplified active state styling
- Compatible with sidebar navigation

---

### ProtectedRoute

Route protection HOC.

**Location:** `src/components/ProtectedRoute.tsx`

**Props:**
```typescript
interface Props {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}
```

**Features:**
- Checks authentication
- Validates user role
- Shows loading state
- Redirects unauthorized users

---

## UI Components (shadcn/ui)

The project uses shadcn/ui for base components. Key components:

| Component | File | Usage |
|-----------|------|-------|
| Button | `ui/button.tsx` | All buttons |
| Card | `ui/card.tsx` | Content containers |
| Dialog | `ui/dialog.tsx` | Modal dialogs |
| Sheet | `ui/sheet.tsx` | Slide-out panels |
| Form | `ui/form.tsx` | Form fields with validation |
| Input | `ui/input.tsx` | Text inputs |
| Select | `ui/select.tsx` | Dropdown selects |
| Tabs | `ui/tabs.tsx` | Tabbed interfaces |
| Table | `ui/table.tsx` | Data tables |
| Toast | `ui/toast.tsx` | Notifications |
| Badge | `ui/badge.tsx` | Status badges |
| Avatar | `ui/avatar.tsx` | User avatars |
| Progress | `ui/progress.tsx` | Progress bars |
| Skeleton | `ui/skeleton.tsx` | Loading states |

---

## Component Patterns

### Dialog Pattern

```tsx
export function MyDialog({ open, onOpenChange }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await mutation.mutateAsync(data);
      toast({ title: "Success!" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Form fields */}
            <DialogFooter>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Sheet Pattern

```tsx
export function MySheet({ open, onOpenChange, itemId }: Props) {
  const { data, isLoading } = useQuery(['item', itemId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{data?.name}</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <div>{/* Content */}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### Card with Actions Pattern

```tsx
export function ItemCard({ item, onAction }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
      <CardFooter className="justify-between">
        <Badge>{item.status}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAction('view')}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('edit')}>
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
```

---

*For questions, contact Susheel Bhatt at s.susheel9@gmail.com*
