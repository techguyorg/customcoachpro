# CustomCoachPro - Folder Structure Guide

**Author:** Susheel Bhatt  
**Contact:** s.susheel9@gmail.com

---

## Table of Contents

1. [Project Root Overview](#project-root-overview)
2. [Source Directory (src/)](#source-directory-src)
3. [Components Directory](#components-directory)
4. [Pages Directory](#pages-directory)
5. [Hooks Directory](#hooks-directory)
6. [Supabase Directory](#supabase-directory)
7. [Configuration Files](#configuration-files)
8. [Naming Conventions](#naming-conventions)

---

## Project Root Overview

```
customcoachpro/
├── .azure/                    # Azure DevOps configuration
│   ├── azure-pipelines-pr.yml # PR validation pipeline
│   └── README.md              # Azure setup guide
├── docs/                      # Documentation (you are here)
│   ├── functional/            # Business documentation
│   └── *.md                   # Technical documentation
├── public/                    # Static public assets
│   ├── favicon.ico            # Browser favicon
│   ├── placeholder.svg        # Placeholder image
│   └── robots.txt             # Search engine directives
├── src/                       # Application source code
├── supabase/                  # Backend configuration
├── .env                       # Environment variables (auto-generated)
├── azure-pipelines.yml        # Main CI/CD pipeline
├── components.json            # shadcn/ui configuration
├── eslint.config.js           # ESLint configuration
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── README.md                  # Project readme
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite build configuration
```

---

## Source Directory (src/)

```
src/
├── assets/                    # Static assets bundled with app
│   ├── logo.png               # Application logo (PNG)
│   └── logo.svg               # Application logo (SVG)
├── components/                # React components
├── contexts/                  # React context providers
│   └── AuthContext.tsx        # Authentication context
├── data/                      # Static data and seed files
│   └── workout-templates-seed.sql
├── hooks/                     # Custom React hooks
├── integrations/              # External service integrations
│   └── supabase/              # Supabase client (auto-generated)
│       ├── client.ts          # Supabase client instance
│       └── types.ts           # Database types (auto-generated)
├── lib/                       # Utility libraries
│   ├── auth.ts                # Authentication utilities
│   └── utils.ts               # General utilities
├── pages/                     # Page components
├── App.css                    # Legacy CSS (minimal use)
├── App.tsx                    # Application root component
├── index.css                  # Global styles and Tailwind
├── main.tsx                   # Application entry point
└── vite-env.d.ts              # Vite type declarations
```

---

## Components Directory

The components directory is organized by domain and feature area:

```
src/components/
├── client/                    # Client-specific components
│   ├── AddGoalDialog.tsx      # Create fitness goals
│   ├── AddMeasurementDialog.tsx # Log body measurements
│   ├── AddPhotoDialog.tsx     # Upload progress photos
│   ├── ClientOnboardingDialog.tsx # 5-step onboarding wizard
│   ├── GoalCard.tsx           # Display individual goal
│   ├── MeasurementChart.tsx   # Measurement trend chart
│   ├── MyCoachCard.tsx        # Assigned coach display
│   └── PhotoGallery.tsx       # Progress photo gallery
│
├── coach/                     # Coach-specific components
│   ├── AddNoteDialog.tsx      # Add client notes
│   ├── AssignPlanDialog.tsx   # Assign plans to clients
│   ├── CheckinReviewSheet.tsx # Review client check-ins
│   ├── ClientCard.tsx         # Client list item
│   ├── ClientDetailSheet.tsx  # Full client details
│   ├── ClientNotesTab.tsx     # Client notes management
│   ├── InviteClientDialog.tsx # Email invitation
│   └── QuickAssignDialog.tsx  # Quick plan assignment
│
├── diet/                      # Nutrition components
│   ├── CreateDietPlanDialog.tsx # Create diet plans
│   ├── CustomFoodDialog.tsx   # Add custom foods
│   ├── DietPlanDetailSheet.tsx # View diet plan
│   ├── FoodAlternatives.tsx   # Food substitutions
│   ├── FoodSearchCombobox.tsx # Food search autocomplete
│   ├── MealFoodBuilder.tsx    # Build meals
│   ├── RecipeBuilderDialog.tsx # Create recipes
│   └── RecipeDetailSheet.tsx  # View recipe details
│
├── exercises/                 # Exercise library components
│   ├── CreateExerciseDialog.tsx # Create custom exercise
│   ├── ExerciseCard.tsx       # Exercise list item
│   ├── ExerciseDetailSheet.tsx # Exercise details
│   └── ExerciseFilters.tsx    # Filter controls
│
├── favorites/                 # Favorites functionality
│   └── FavoriteButton.tsx     # Toggle favorite button
│
├── landing/                   # Landing page sections
│   ├── CTA.tsx                # Call-to-action section
│   ├── Features.tsx           # Features showcase
│   ├── Footer.tsx             # Page footer
│   ├── Hero.tsx               # Hero banner
│   ├── Navbar.tsx             # Navigation bar
│   ├── Pricing.tsx            # Pricing section
│   └── Testimonials.tsx       # User testimonials
│
├── marketplace/               # Coach marketplace
│   ├── CoachCard.tsx          # Coach listing card
│   └── CoachDetailSheet.tsx   # Coach profile details
│
├── notifications/             # Notification system
│   └── NotificationBell.tsx   # Notification indicator
│
├── plans/                     # Shared plan components
│   └── MyPlansSection.tsx     # Active plans display
│
├── templates/                 # Workout template components
│   ├── CreateWorkoutTemplateDialog.tsx # Create program
│   ├── TemplateCard.tsx       # Program card
│   ├── TemplateDetailSheet.tsx # Program details
│   ├── TemplateFilters.tsx    # Filter controls
│   └── WorkoutProgramEditor.tsx # Edit program structure
│
├── ui/                        # shadcn/ui components (50+)
│   ├── accordion.tsx
│   ├── alert-dialog.tsx
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── progress.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── switch.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   ├── tooltip.tsx
│   └── ... (more)
│
├── NavLink.tsx                # Custom NavLink wrapper
└── ProtectedRoute.tsx         # Route protection HOC
```

### Component Categories Explained

| Directory | Purpose | Example |
|-----------|---------|---------|
| `client/` | Components only used by clients | Goal tracking, coach display |
| `coach/` | Components only used by coaches | Client management, check-in review |
| `diet/` | Nutrition-related components | Diet plans, recipes, foods |
| `exercises/` | Exercise library components | Exercise cards, filters |
| `favorites/` | Favorites functionality | Favorite toggle button |
| `landing/` | Public landing page | Hero, features, pricing |
| `marketplace/` | Coach marketplace | Coach cards, profiles |
| `notifications/` | Notification system | Bell icon, dropdown |
| `plans/` | Shared plan components | Active plans display |
| `templates/` | Workout program components | Template cards, editor |
| `ui/` | Base UI components (shadcn) | Buttons, inputs, dialogs |

---

## Pages Directory

```
src/pages/
├── admin/                     # Super admin pages
│   └── Dashboard.tsx          # Admin dashboard with nested routes
│
├── client/                    # Client pages
│   ├── CheckinsPage.tsx       # View and submit check-ins
│   ├── CoachMarketplacePage.tsx # Browse and request coaches
│   ├── Dashboard.tsx          # Client dashboard with nested routes
│   ├── DietPlansPage.tsx      # View diet plans
│   ├── FavoritesPage.tsx      # Saved favorites
│   ├── NutritionLogPage.tsx   # Daily nutrition logging
│   ├── ProfilePage.tsx        # Profile settings
│   └── ProgressPage.tsx       # Progress tracking
│
├── coach/                     # Coach pages
│   ├── AnalyticsPage.tsx      # Business analytics
│   ├── CheckinsPage.tsx       # Review client check-ins
│   ├── ClientsPage.tsx        # Client management
│   ├── Dashboard.tsx          # Coach dashboard with nested routes
│   ├── DietPlansPage.tsx      # Diet plan management
│   ├── ExercisesPage.tsx      # Exercise library
│   ├── RecipesPage.tsx        # Recipe management
│   ├── RequestsPage.tsx       # Coaching requests
│   ├── SettingsPage.tsx       # Coach settings
│   └── WorkoutProgramsPage.tsx # Workout program management
│
├── shared/                    # Shared pages (both roles)
│   ├── ExercisesPage.tsx      # Exercise browsing
│   ├── MessagesPage.tsx       # Messaging interface
│   ├── RecipesPage.tsx        # Recipe browsing
│   └── WorkoutTemplatesPage.tsx # Template browsing
│
├── ForgotPassword.tsx         # Password reset
├── Index.tsx                  # Landing page
├── Login.tsx                  # Sign in page
├── NotFound.tsx               # 404 page
└── Signup.tsx                 # Registration page
```

### Page Structure Pattern

Each dashboard page follows this pattern:

```tsx
// Example: src/pages/coach/Dashboard.tsx
const CoachDashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          {/* Navigation items */}
        </Sidebar>
        <main className="flex-1">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="programs" element={<WorkoutProgramsPage />} />
            {/* More routes */}
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};
```

---

## Hooks Directory

```
src/hooks/
├── use-mobile.tsx             # Mobile breakpoint detection
├── use-toast.ts               # Toast notifications
├── useCheckins.ts             # Check-in management
├── useClientProfile.ts        # Client profile operations
├── useClientProgress.ts       # Measurements, photos, goals
├── useCoachClients.ts         # Coach's client list
├── useCoachMarketplace.ts     # Browse and request coaches
├── useCoachNotes.ts           # Client notes CRUD
├── useCoachRequests.ts        # Coaching request management
├── useDietPlans.ts            # Diet plan CRUD
├── useExercises.ts            # Exercise library queries
├── useFavorites.ts            # Favorites management
├── useFoods.ts                # Food database queries
├── useMessages.ts             # Messaging functionality
├── useMyCoach.ts              # Client's assigned coach
├── useNotifications.ts        # Notification system
├── useNutritionLog.ts         # Daily nutrition logging
├── usePlanAssignments.ts      # Plan assignment CRUD
├── useRecipes.ts              # Recipe CRUD
├── useStartProgram.ts         # Self-start programs
└── useWorkoutTemplates.ts     # Workout template queries
```

### Hook Pattern

All data hooks follow a consistent pattern using TanStack Query:

```tsx
// Example hook structure
export function useExercises(filters?: ExerciseFilters) {
  // Query for fetching data
  const query = useQuery({
    queryKey: ['exercises', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Mutation for creating
  const createMutation = useMutation({
    mutationFn: async (exercise: NewExercise) => {
      const { data, error } = await supabase
        .from('exercises')
        .insert(exercise);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['exercises']);
    },
  });

  return {
    exercises: query.data,
    isLoading: query.isLoading,
    createExercise: createMutation.mutate,
    // ... more
  };
}
```

---

## Supabase Directory

```
supabase/
├── functions/                 # Edge functions (Deno)
│   ├── send-client-invitation/
│   │   └── index.ts           # Email invitation function
│   └── upload-progress-photo/
│       └── index.ts           # Azure Blob upload function
├── migrations/                # Database migrations (read-only)
│   └── *.sql                  # SQL migration files
└── config.toml                # Supabase configuration (auto-generated)
```

### Edge Function Structure

Each edge function follows this pattern:

```typescript
// supabase/functions/function-name/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Function logic here
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Configuration Files

### Root Configuration

| File | Purpose | Editable |
|------|---------|----------|
| `vite.config.ts` | Build configuration | Yes |
| `tailwind.config.ts` | Tailwind CSS config | Yes |
| `tsconfig.json` | TypeScript config | No |
| `eslint.config.js` | Linting rules | Yes |
| `postcss.config.js` | PostCSS plugins | No |
| `components.json` | shadcn/ui config | No |
| `package.json` | Dependencies | No (use tools) |
| `.env` | Environment vars | No (auto-generated) |

### Azure Configuration

| File | Purpose |
|------|---------|
| `azure-pipelines.yml` | Main CI/CD pipeline |
| `.azure/azure-pipelines-pr.yml` | PR validation |
| `.azure/README.md` | Setup instructions |

### Auto-Generated Files (Do Not Edit)

These files are managed automatically:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`
- `supabase/config.toml`
- `package.json`
- `package-lock.json`

---

## Naming Conventions

### Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ClientCard.tsx` |
| Hooks | camelCase with `use` prefix | `useCoachClients.ts` |
| Pages | PascalCase with `Page` suffix | `ClientsPage.tsx` |
| Utilities | camelCase | `utils.ts` |
| Types | PascalCase | `types.ts` |
| Directories | kebab-case or lowercase | `coach/`, `ui/` |

### Component Patterns

| Pattern | Naming | Example |
|---------|--------|---------|
| Dialog | `*Dialog.tsx` | `AddGoalDialog.tsx` |
| Sheet | `*Sheet.tsx` | `ClientDetailSheet.tsx` |
| Card | `*Card.tsx` | `ExerciseCard.tsx` |
| Page | `*Page.tsx` | `ProgressPage.tsx` |
| Filters | `*Filters.tsx` | `ExerciseFilters.tsx` |
| Builder | `*Builder.tsx` | `MealFoodBuilder.tsx` |

### Import Aliases

The project uses path aliases defined in `tsconfig.json`:

```typescript
// Instead of relative imports
import { Button } from '../../../components/ui/button';

// Use alias imports
import { Button } from '@/components/ui/button';
```

Available aliases:

| Alias | Path |
|-------|------|
| `@/` | `src/` |
| `@/components` | `src/components/` |
| `@/hooks` | `src/hooks/` |
| `@/lib` | `src/lib/` |
| `@/pages` | `src/pages/` |

---

*For questions, contact Susheel Bhatt at s.susheel9@gmail.com*
