// User Types
export type UserRole = 'coach' | 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;

  // Compatible with backend now + future
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface Coach extends User {
  role: 'coach';
  specializations?: string[];
  bio?: string;
}

export interface Client extends User {
  role: 'client';
  coachId?: string; // can be undefined for solo client
  goals?: string;
  startDate?: string;
  notes?: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
}

// Check-in Types
export interface WeightCheckIn {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  bodyFatPercentage?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  clientId: string;
  date: string;
  frontUrl?: string;
  sideUrl?: string;
  backUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkoutCheckIn {
  id: string;
  clientId: string;
  workoutPlanId: string;
  date: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface DietCheckIn {
  id: string;
  clientId: string;
  dietPlanId: string;
  date: string;
  complianceRating: number; // 1-10
  deviations?: string;
  notes?: string;
  createdAt: string;
}

// Exercise & Workout Types
export interface Exercise {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  muscleGroups: string[];
  tags: string[];
  equipment?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId?: string;
  exerciseName?: string;
  exercise?: Exercise;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  notes?: string;
  order: number;
}

export interface WorkoutDay {
  id: string;
  name: string;
  dayNumber: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  durationWeeks: number;
  days: WorkoutDay[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientWorkoutPlan {
  id: string;
  clientId: string;
  workoutPlanId: string;
  workoutPlan?: WorkoutPlan;
  startDate: string;
  endDate?: string;
  durationDays?: number | null;
  isActive: boolean;
}

// Diet & Meal Types
export interface Food {
  id: string;
  coachId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  createdAt: string;
}

export interface Meal {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  foods: MealFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
}

export interface MealFood {
  id: string;
  foodId: string;
  food?: Food;
  quantity: number;
}

export interface DietDay {
  id: string;
  dayNumber: number;
  meals: DietMeal[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface DietMeal {
  id: string;
  mealId: string;
  meal?: Meal;
  mealTime: string;
  order: number;
}

export interface DietPlan {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  days: DietDay[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientDietPlan {
  id: string;
  clientId: string;
  dietPlanId: string;
  dietPlan?: DietPlan;
  startDate: string;
  endDate?: string;
  durationDays?: number | null;
  isActive: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  readAt?: string | null;
  isRead: boolean;
  actionUrl?: string | null;
  actionId?: string | null;
}

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  createdAt: string;
  createdBy?: string;
  pinned?: boolean;
  needsAttention?: boolean;
}

// Dashboard Stats
export interface CoachDashboardStats {
  totalClients: number;
  activeClients: number;
  pendingCheckIns: number;
  workoutPlansCreated: number;
  dietPlansCreated: number;
}

export interface ClientDashboardStats {
  currentWeight: number;
  weightChange: number;
  workoutsCompleted: number;
  dietComplianceAverage: number;
  daysOnPlan: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Extract<UserRole, "coach" | "client">;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
