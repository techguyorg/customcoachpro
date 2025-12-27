// src/config/api.ts

// API Configuration
// Update this URL when deploying to Azure
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5098/api";

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },

  // Profile (Settings)
  profile: {
    me: "/profile/me",
  },

  // Coach
  coach: {
    clients: "/coach/clients",
    clientById: (id: string) => `/coach/clients/${id}`,
  },

  // Client
  client: {
    coach: "/client/coach",
  },

  // Users
  users: {
    base: "/users",
    byId: (id: string) => `/users/${id}`,
  },

  // Clients
  clients: {
    base: "/clients",
    byId: (id: string) => `/clients/${id}`,
    byCoach: (coachId: string) => `/clients/coach/${coachId}`,
  },

  // Check-ins
  checkIns: {
    base: "/checkins",
    byId: (id: string) => `/checkins/${id}`,
    review: (id: string) => `/checkins/${id}/review`,
  },

  notifications: {
    base: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
  },

  // Exercises
  exercises: {
    base: "/exercises",
    byId: (id: string) => `/exercises/${id}`,
    byCoach: (coachId: string) => `/exercises/coach/${coachId}`,
  },

  // Workout Plans
  workoutPlans: {
    base: "/workout-plans",
    byId: (id: string) => `/workout-plans/${id}`,
    byCoach: (coachId: string) => `/workout-plans/coach/${coachId}`,
    assign: "/workout-plans/assign",
    duplicate: (id: string) => `/workout-plans/${id}/duplicate`,
    clientPlans: (clientId: string) => `/workout-plans/client/${clientId}`,
  },

  // Foods
  foods: {
    base: "/foods",
    byId: (id: string) => `/foods/${id}`,
    byCoach: (coachId: string) => `/foods/coach/${coachId}`,
  },

  // Meals
  meals: {
    base: "/meals",
    byId: (id: string) => `/meals/${id}`,
    byCoach: (coachId: string) => `/meals/coach/${coachId}`,
  },

  // Diet Plans
  dietPlans: {
    base: "/diet-plans",
    byId: (id: string) => `/diet-plans/${id}`,
    byCoach: (coachId: string) => `/diet-plans/coach/${coachId}`,
    templates: "/diet-plans/templates",
    assign: "/diet-plans/assign",
    clientPlans: (clientId: string) => `/diet-plans/client/${clientId}`,
  },

  // Dashboard
  dashboard: {
    coach: "/dashboard/coach",
    client: "/dashboard/client",
  },
} as const;
