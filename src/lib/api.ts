// API Client for CustomCoachPro Backend
// API_URL: Change to 'http://localhost:3000' for local development
// Production URL is used by default for deployment
const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'https://customcoachpro-api.azurewebsites.net';

// Token management
function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Token refresh logic
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string): void {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// Main API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } else {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers,
            });
            if (!retryResponse.ok) {
              reject(new Error(await retryResponse.text()));
            }
            resolve(await retryResponse.json());
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorText;
    } catch {
      errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

// API methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
  upload: async <T>(endpoint: string, file: File, folder?: string): Promise<T> => {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
};

// Auth functions
export const auth = {
  signup: async (email: string, password: string, fullName: string, role: 'client' | 'coach' = 'client') => {
    const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/signup', { email, password, fullName, role });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  login: async (email: string, password: string) => {
    const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/login', { email, password });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  logout: async () => {
    const refreshToken = getRefreshToken();
    try { await api.post('/api/auth/logout', { refreshToken }); } finally { clearTokens(); }
  },
  getMe: () => api.get<User>('/api/auth/me'),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/api/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.post('/api/auth/verify-email', { token }),
  resendVerification: () => api.post('/api/auth/resend-verification'),
  isAuthenticated: () => !!getAccessToken(),
  getTokens: () => ({ accessToken: getAccessToken(), refreshToken: getRefreshToken() }),
  setTokens,
  clearTokens,
};

// Types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  roles: string[];
  emailVerified: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string[];
  tips?: string[];
  common_mistakes?: string[];
  primary_muscle: string;
  secondary_muscles?: string[];
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercise_type: string;
  video_url?: string;
  is_system: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  difficulty: string;
  duration_weeks: number;
  days_per_week: number;
  goal?: string;
  category?: string;
  template_type?: string;
  is_periodized?: boolean;
  is_system: boolean;
  created_by?: string;
  weeks?: WorkoutWeek[];
  days?: WorkoutDay[];
}

export interface WorkoutWeek {
  id: string;
  week_number: number;
  name?: string;
  focus?: string;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  id: string;
  day_number: number;
  name: string;
  notes?: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  exercise_id?: string;
  exercise_name?: string;
  custom_exercise_name?: string;
  order_index: number;
  sets_min: number;
  sets_max?: number;
  reps_min: number;
  reps_max?: number;
  rest_seconds_min?: number;
  rest_seconds_max?: number;
  notes?: string;
  exercise?: {
    id: string;
    name: string;
    primary_muscle: string;
    equipment: string;
    difficulty: string;
    instructions?: string[];
  };
  // Fields from joined exercise data (flat from backend)
  primary_muscle?: string;
  equipment?: string;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_mg_per_100g?: number;
  default_serving_size: number;
  default_serving_unit: string;
  image_url?: string;
  notes?: string;
  is_system: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  category?: string;
  instructions?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings: number;
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
  fiber_per_serving?: number;
  total_weight_g?: number;
  image_url?: string;
  is_system: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id?: string;
  food_id: string;
  food_name?: string;
  quantity: number;
  unit: string;
  notes?: string;
  order_index?: number;
  food?: {
    id: string;
    name: string;
    calories_per_100g?: number;
    protein_per_100g?: number;
    carbs_per_100g?: number;
    fat_per_100g?: number;
    fiber_per_100g?: number;
    default_serving_size?: number;
  };
}

export interface DietPlan {
  id: string;
  name: string;
  description?: string;
  calories_target?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  meals_per_day?: number;
  dietary_type?: string;
  goal?: string;
  notes?: string;
  is_system: boolean;
  is_active?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  meals?: DietPlanMeal[];
}

export interface DietPlanMeal {
  id: string;
  plan_id?: string;
  meal_number: number;
  meal_name: string;
  time_suggestion?: string;
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  food_suggestions?: string[];
  notes?: string;
  created_at?: string;
  items?: MealFoodItem[];
}

export interface MealFoodItem {
  id: string;
  food_id?: string;
  recipe_id?: string;
  food_name?: string;
  recipe_name?: string;
  quantity: number;
  unit: string;
}

export interface ClientMeasurement {
  id: string;
  client_id: string;
  recorded_at: string;
  weight_kg: number;
  body_fat_pct?: number;
  waist_cm?: number;
  chest_cm?: number;
  hips_cm?: number;
  notes?: string;
}

export interface ClientGoal {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  goal_type: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  status: string;
}

export interface CheckIn {
  id: string;
  client_id: string;
  checkin_date: string;
  diet_adherence?: number;
  workout_adherence?: number;
  energy_level?: number;
  sleep_quality?: number;
  mood_rating?: number;
  stress_level?: number;
  general_notes?: string;
  wins?: string;
  challenges?: string;
  status: string;
  coach_feedback?: string;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  template_id?: string;
  template_name?: string;
  workout_date: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  notes?: string;
  perceived_effort?: number;
  exercises?: WorkoutLogExercise[];
}

export interface WorkoutLogExercise {
  id: string;
  exercise_id?: string;
  exercise_name: string;
  sets_completed: number;
  set_data?: SetData[];
  notes?: string;
}

export interface SetData {
  reps: number;
  weight?: number;
  duration_seconds?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
  data?: Record<string, unknown>;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
}

export interface CoachClient {
  relationship_id: string;
  client_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  fitness_level?: string;
  current_weight_kg?: number;
  target_weight_kg?: number;
  status: string;
  started_at?: string;
}

export default api;
