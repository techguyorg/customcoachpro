# CustomCoachPro - Hooks Reference

**Author:** Susheel Bhatt  
**Contact:** s.susheel9@gmail.com

---

## Table of Contents

1. [Hook Architecture](#hook-architecture)
2. [Authentication Hooks](#authentication-hooks)
3. [Client Hooks](#client-hooks)
4. [Coach Hooks](#coach-hooks)
5. [Content Hooks](#content-hooks)
6. [Communication Hooks](#communication-hooks)
7. [Utility Hooks](#utility-hooks)
8. [Hook Patterns](#hook-patterns)

---

## Hook Architecture

### Design Principles

1. **TanStack Query** - All data fetching uses React Query
2. **Automatic Caching** - Queries are cached and deduplicated
3. **Optimistic Updates** - Mutations update UI before server confirmation
4. **Error Handling** - Consistent error handling with toast notifications
5. **Type Safety** - Full TypeScript types from Supabase

### Common Patterns

```typescript
// Typical hook structure
export function useResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query for fetching
  const query = useQuery({
    queryKey: ['resource', user?.id],
    queryFn: fetchFunction,
    enabled: !!user,
  });

  // Mutation for creating
  const createMutation = useMutation({
    mutationFn: createFunction,
    onSuccess: () => {
      queryClient.invalidateQueries(['resource']);
      toast({ title: 'Created!' });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    create: createMutation.mutate,
  };
}
```

---

## Authentication Hooks

### useAuth

Central authentication hook from AuthContext.

**Location:** `src/contexts/AuthContext.tsx`

**Returns:**
```typescript
interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  fullName: string;
}
```

**Usage:**
```tsx
const { user, isLoading, signIn, signOut } = useAuth();

if (isLoading) return <Spinner />;
if (!user) return <Navigate to="/login" />;

// Access user data
console.log(user.role); // 'coach' | 'client' | 'super_admin'
```

**Features:**
- Manages session state
- Fetches user role on auth change
- Handles sign in/out/up flows
- Password reset functionality

---

## Client Hooks

### useClientProfile

Manage client profile and onboarding status.

**Location:** `src/hooks/useClientProfile.ts`

**Returns:**
```typescript
interface UseClientProfileReturn {
  profile: ClientProfile | null;
  isLoading: boolean;
  hasProfile: boolean;
  isComplete: boolean;
  missingFields: string[];
  updateProfile: (updates: Partial<ClientProfile>) => Promise<void>;
  refetch: () => void;
}
```

**Usage:**
```tsx
const { profile, isComplete, updateProfile } = useClientProfile();

if (!isComplete) {
  return <OnboardingDialog />;
}
```

---

### useClientProgress

Comprehensive progress tracking hook.

**Location:** `src/hooks/useClientProgress.ts`

**Returns:**
```typescript
interface UseClientProgressReturn {
  // Measurements
  measurements: ClientMeasurement[];
  measurementsLoading: boolean;
  addMeasurement: (data: NewMeasurement) => void;
  deleteMeasurement: (id: string) => void;
  
  // Photos
  photos: ProgressPhoto[];
  photosLoading: boolean;
  addPhoto: (file: File, data: PhotoData) => void;
  deletePhoto: (id: string) => void;
  
  // Goals
  goals: ClientGoal[];
  goalsLoading: boolean;
  addGoal: (data: NewGoal) => void;
  updateGoal: (id: string, updates: Partial<ClientGoal>) => void;
  deleteGoal: (id: string) => void;
}
```

**Usage:**
```tsx
const { 
  measurements, 
  addMeasurement, 
  photos, 
  goals 
} = useClientProgress();

// Add new measurement
addMeasurement({
  weight_kg: 75.5,
  waist_cm: 82,
});
```

---

### useMyCoach

Get client's assigned coach information.

**Location:** `src/hooks/useMyCoach.ts`

**Returns:**
```typescript
interface UseMyCoachReturn {
  coach: CoachWithProfile | null;
  isLoading: boolean;
  hasCoach: boolean;
  relationship: CoachClientRelationship | null;
  endRelationship: () => void;
}
```

**Usage:**
```tsx
const { coach, hasCoach, endRelationship } = useMyCoach();

if (!hasCoach) {
  return <FindCoachCTA />;
}
```

---

### useNutritionLog

Daily nutrition tracking.

**Location:** `src/hooks/useNutritionLog.ts`

**Parameters:**
```typescript
useNutritionLog(date?: Date)
```

**Returns:**
```typescript
interface UseNutritionLogReturn {
  entries: NutritionLogEntry[];
  isLoading: boolean;
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  addEntry: (data: NewLogEntry) => void;
  updateEntry: (id: string, updates: Partial<LogEntry>) => void;
  deleteEntry: (id: string) => void;
}
```

**Usage:**
```tsx
const { entries, dailyTotals, addEntry } = useNutritionLog(selectedDate);

// Add food to log
addEntry({
  meal_type: 'breakfast',
  food_id: 'food-uuid',
  quantity: 1.5,
  unit: 'serving',
});
```

---

## Coach Hooks

### useCoachClients

Manage coach's client list.

**Location:** `src/hooks/useCoachClients.ts`

**Returns:**
```typescript
interface UseCoachClientsReturn {
  clients: ClientWithProfile[];
  isLoading: boolean;
  stats: {
    total: number;
    active: number;
    paused: number;
  };
  updateClientStatus: (clientId: string, status: string) => void;
  removeClient: (clientId: string) => void;
  refetch: () => void;
}
```

**Usage:**
```tsx
const { clients, stats, updateClientStatus } = useCoachClients();

// Pause a client
updateClientStatus(clientId, 'paused');
```

---

### useCoachRequests

Handle incoming coaching requests.

**Location:** `src/hooks/useCoachRequests.ts`

**Returns:**
```typescript
interface UseCoachRequestsReturn {
  requests: CoachingRequest[];
  isLoading: boolean;
  pendingCount: number;
  respondToRequest: (
    requestId: string, 
    response: 'accepted' | 'declined',
    message?: string
  ) => void;
}
```

**Usage:**
```tsx
const { requests, pendingCount, respondToRequest } = useCoachRequests();

// Accept request
respondToRequest(requestId, 'accepted', 'Welcome to my coaching!');
```

---

### useCoachNotes

Manage notes about clients.

**Location:** `src/hooks/useCoachNotes.ts`

**Parameters:**
```typescript
useCoachNotes(clientId: string)
```

**Returns:**
```typescript
interface UseCoachNotesReturn {
  notes: ClientNote[];
  isLoading: boolean;
  addNote: (data: NewNote) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
}
```

**Usage:**
```tsx
const { notes, addNote, togglePin } = useCoachNotes(clientId);

addNote({
  title: 'Progress Update',
  content: 'Client showing great improvement...',
  note_type: 'progress',
});
```

---

### useCoachMarketplace

Browse and request coaches (client-side).

**Location:** `src/hooks/useCoachMarketplace.ts`

**Returns:**
```typescript
interface UseCoachMarketplaceReturn {
  coaches: CoachWithProfile[];
  isLoading: boolean;
  filters: CoachFilters;
  setFilters: (filters: CoachFilters) => void;
  sendRequest: (coachId: string, message?: string) => void;
  cancelRequest: (requestId: string) => void;
  pendingRequests: CoachingRequest[];
}
```

**Usage:**
```tsx
const { coaches, sendRequest, filters, setFilters } = useCoachMarketplace();

// Filter coaches
setFilters({ specialization: 'weight_loss', minRating: 4 });

// Send coaching request
sendRequest(coachId, 'I would love to work with you!');
```

---

### useCheckins

Manage check-in system.

**Location:** `src/hooks/useCheckins.ts`

**Returns:**
```typescript
interface UseCheckinsReturn {
  // For clients
  checkins: ClientCheckin[];
  currentCheckin: ClientCheckin | null;
  submitCheckin: (data: CheckinData) => void;
  saveDraft: (data: Partial<CheckinData>) => void;
  
  // For coaches
  pendingReviews: ClientCheckin[];
  submitReview: (checkinId: string, feedback: string, rating?: number) => void;
  
  isLoading: boolean;
}
```

**Usage:**
```tsx
// Client submitting check-in
const { submitCheckin } = useCheckins();
submitCheckin({
  workout_adherence: 85,
  diet_adherence: 90,
  sleep_quality: 7,
  notes: 'Great week!',
});

// Coach reviewing
const { pendingReviews, submitReview } = useCheckins();
submitReview(checkinId, 'Excellent progress!', 5);
```

---

### usePlanAssignments

Manage plan assignments.

**Location:** `src/hooks/usePlanAssignments.ts`

**Returns:**
```typescript
interface UsePlanAssignmentsReturn {
  assignments: PlanAssignment[];
  isLoading: boolean;
  assignPlan: (data: NewAssignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  cancelAssignment: (id: string) => void;
  
  // For clients
  activeWorkoutPlan: PlanAssignment | null;
  activeDietPlan: PlanAssignment | null;
}
```

**Usage:**
```tsx
const { assignPlan } = usePlanAssignments();

assignPlan({
  client_id: clientId,
  workout_template_id: templateId,
  plan_type: 'workout',
  start_date: new Date().toISOString(),
});
```

---

## Content Hooks

### useExercises

Exercise library with filtering.

**Location:** `src/hooks/useExercises.ts`

**Parameters:**
```typescript
useExercises(filters?: ExerciseFilters)

interface ExerciseFilters {
  search?: string;
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType[];
  difficulty?: DifficultyLevel;
  exerciseType?: ExerciseType;
}
```

**Returns:**
```typescript
interface UseExercisesReturn {
  exercises: Exercise[];
  isLoading: boolean;
  createExercise: (data: NewExercise) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
}
```

**Usage:**
```tsx
const { exercises } = useExercises({
  muscleGroup: 'chest',
  equipment: ['barbell', 'dumbbell'],
});
```

---

### useWorkoutTemplates

Workout template library.

**Location:** `src/hooks/useWorkoutTemplates.ts`

**Parameters:**
```typescript
useWorkoutTemplates(filters?: TemplateFilters)

interface TemplateFilters {
  search?: string;
  difficulty?: DifficultyLevel;
  templateType?: TemplateType;
  daysPerWeek?: number;
  isSystem?: boolean;
}
```

**Returns:**
```typescript
interface UseWorkoutTemplatesReturn {
  templates: WorkoutTemplate[];
  isLoading: boolean;
  getTemplateDetails: (id: string) => Promise<TemplateWithDetails>;
  createTemplate: (data: NewTemplate) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  cloneTemplate: (id: string) => void;
}
```

**Usage:**
```tsx
const { templates, cloneTemplate } = useWorkoutTemplates({
  difficulty: 'intermediate',
  daysPerWeek: 4,
});
```

---

### useDietPlans

Diet plan management.

**Location:** `src/hooks/useDietPlans.ts`

**Returns:**
```typescript
interface UseDietPlansReturn {
  plans: DietPlan[];
  isLoading: boolean;
  getPlanDetails: (id: string) => Promise<PlanWithMeals>;
  createPlan: (data: NewDietPlan) => void;
  updatePlan: (id: string, updates: Partial<DietPlan>) => void;
  deletePlan: (id: string) => void;
}
```

**Usage:**
```tsx
const { plans, createPlan } = useDietPlans();

createPlan({
  name: 'High Protein Diet',
  calories_target: 2200,
  protein_grams: 180,
  // ...
});
```

---

### useFoods

Food database access.

**Location:** `src/hooks/useFoods.ts`

**Parameters:**
```typescript
useFoods(filters?: FoodFilters)

interface FoodFilters {
  search?: string;
  category?: string;
}
```

**Returns:**
```typescript
interface UseFoodsReturn {
  foods: Food[];
  isLoading: boolean;
  categories: string[];
  createFood: (data: NewFood) => void;
  searchFoods: (query: string) => Promise<Food[]>;
}
```

**Usage:**
```tsx
const { foods, searchFoods } = useFoods();

// Search for foods
const results = await searchFoods('chicken');
```

---

### useRecipes

Recipe management.

**Location:** `src/hooks/useRecipes.ts`

**Returns:**
```typescript
interface UseRecipesReturn {
  recipes: Recipe[];
  isLoading: boolean;
  getRecipeDetails: (id: string) => Promise<RecipeWithIngredients>;
  createRecipe: (data: NewRecipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
}
```

**Usage:**
```tsx
const { recipes, createRecipe } = useRecipes();

createRecipe({
  name: 'Protein Smoothie',
  servings: 2,
  ingredients: [...],
  instructions: '...',
});
```

---

### useFavorites

Manage user favorites.

**Location:** `src/hooks/useFavorites.ts`

**Returns:**
```typescript
interface UseFavoritesReturn {
  favorites: UserFavorite[];
  isLoading: boolean;
  isFavorite: (itemType: string, itemId: string) => boolean;
  toggleFavorite: (itemType: string, itemId: string) => void;
  getFavoritesByType: (type: string) => any[];
}
```

**Usage:**
```tsx
const { isFavorite, toggleFavorite, getFavoritesByType } = useFavorites();

// Check if item is favorited
const isFav = isFavorite('exercise', exerciseId);

// Toggle favorite
toggleFavorite('exercise', exerciseId);

// Get all favorite recipes
const favRecipes = getFavoritesByType('recipe');
```

---

### useStartProgram

Self-start workout/diet programs.

**Location:** `src/hooks/useStartProgram.ts`

**Returns:**
```typescript
interface UseStartProgramReturn {
  startWorkoutProgram: (templateId: string) => void;
  startDietPlan: (planId: string) => void;
  isLoading: boolean;
}
```

**Usage:**
```tsx
const { startWorkoutProgram } = useStartProgram();

// Client starts a program themselves
startWorkoutProgram(templateId);
```

---

## Communication Hooks

### useMessages

Direct messaging system.

**Location:** `src/hooks/useMessages.ts`

**Returns:**
```typescript
interface UseMessagesReturn {
  conversations: Conversation[];
  isLoading: boolean;
  getMessages: (partnerId: string) => Message[];
  sendMessage: (recipientId: string, content: string) => void;
  markAsRead: (messageId: string) => void;
  unreadCount: number;
}
```

**Usage:**
```tsx
const { conversations, sendMessage, unreadCount } = useMessages();

sendMessage(coachId, 'Hi, I have a question about my program.');
```

---

### useNotifications

Notification system.

**Location:** `src/hooks/useNotifications.ts`

**Returns:**
```typescript
interface UseNotificationsReturn {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}
```

**Usage:**
```tsx
const { notifications, unreadCount, markAsRead } = useNotifications();

// Used in NotificationBell component
```

---

## Utility Hooks

### useMobile

Detect mobile viewport.

**Location:** `src/hooks/use-mobile.tsx`

**Returns:**
```typescript
function useMobile(): boolean
```

**Usage:**
```tsx
const isMobile = useMobile();

return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

---

### useToast

Toast notification system.

**Location:** `src/hooks/use-toast.ts`

**Returns:**
```typescript
interface UseToastReturn {
  toast: (options: ToastOptions) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}
```

**Usage:**
```tsx
const { toast } = useToast();

toast({
  title: 'Success!',
  description: 'Your changes have been saved.',
});

toast({
  title: 'Error',
  description: 'Something went wrong.',
  variant: 'destructive',
});
```

---

## Hook Patterns

### Query with Filters

```typescript
export function useResource(filters?: Filters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['resource', user?.id, filters],
    queryFn: async () => {
      let query = supabase.from('table').select('*');
      
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
```

### Mutation with Optimistic Updates

```typescript
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, isFavorite }) => {
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('item_id', itemId);
      } else {
        await supabase.from('favorites').insert({ item_id: itemId });
      }
    },
    onMutate: async ({ itemId, isFavorite }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['favorites']);
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['favorites']);
      
      // Optimistically update
      queryClient.setQueryData(['favorites'], (old) => 
        isFavorite 
          ? old.filter(f => f.item_id !== itemId)
          : [...old, { item_id: itemId }]
      );
      
      return { previous };
    },
    onError: (err, vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['favorites'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['favorites']);
    },
  });
}
```

### Dependent Queries

```typescript
export function useClientDetails(clientId: string) {
  const profileQuery = useQuery({
    queryKey: ['profile', clientId],
    queryFn: () => fetchProfile(clientId),
  });
  
  const measurementsQuery = useQuery({
    queryKey: ['measurements', clientId],
    queryFn: () => fetchMeasurements(clientId),
    enabled: !!profileQuery.data, // Only fetch after profile loads
  });
  
  return {
    profile: profileQuery.data,
    measurements: measurementsQuery.data,
    isLoading: profileQuery.isLoading || measurementsQuery.isLoading,
  };
}
```

---

*For questions, contact Susheel Bhatt at s.susheel9@gmail.com*
