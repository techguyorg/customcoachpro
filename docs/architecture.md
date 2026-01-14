# CustomCoachPro - Architecture Overview

**Author:** Susheel Bhatt  
**Contact:** s.susheel9@gmail.com

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Flow](#data-flow)
6. [Authentication Flow](#authentication-flow)
7. [Real-time Architecture](#real-time-architecture)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        SPA[React SPA]
    end
    
    subgraph "CDN / Hosting"
        ASWA[Azure Static Web Apps]
    end
    
    subgraph "Backend Services"
        subgraph "Supabase Platform"
            Auth[Supabase Auth]
            DB[(PostgreSQL Database)]
            Realtime[Realtime Subscriptions]
            Edge[Edge Functions - Deno]
        end
    end
    
    subgraph "External Services"
        Azure[Azure Blob Storage]
        Resend[Resend Email API]
    end
    
    Browser --> ASWA
    ASWA --> SPA
    SPA --> Auth
    SPA --> DB
    SPA --> Realtime
    SPA --> Edge
    Edge --> Azure
    Edge --> Resend
    Edge --> DB
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 5.x | Build tool and dev server |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| shadcn/ui | Latest | Pre-built UI components |
| TanStack Query | 5.x | Server state management |
| React Router | 6.x | Client-side routing |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| Recharts | 2.x | Data visualization |
| Lucide React | Latest | Icon library |
| Framer Motion | (via shadcn) | Animations |

### Backend Technologies

| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service platform |
| PostgreSQL | Relational database |
| Supabase Auth | Authentication and authorization |
| Edge Functions | Serverless functions (Deno runtime) |
| Row Level Security | Database access control |

### External Services

| Service | Purpose |
|---------|---------|
| Azure Blob Storage | Progress photo storage |
| Resend | Transactional emails |
| Azure Static Web Apps | Frontend hosting |
| Azure DevOps | CI/CD pipelines |

---

## Frontend Architecture

### Application Structure

```mermaid
graph TD
    subgraph "Entry Point"
        Main[main.tsx]
    end
    
    subgraph "Providers"
        QC[QueryClientProvider]
        Router[BrowserRouter]
        AuthProv[AuthProvider]
        Tooltip[TooltipProvider]
    end
    
    subgraph "Routing"
        Routes[Routes]
        Public[Public Routes]
        Protected[Protected Routes]
    end
    
    subgraph "Pages"
        Landing[Landing Page]
        Login[Login/Signup]
        AdminDash[Admin Dashboard]
        CoachDash[Coach Dashboard]
        ClientDash[Client Dashboard]
    end
    
    Main --> QC
    QC --> Router
    Router --> AuthProv
    AuthProv --> Tooltip
    Tooltip --> Routes
    Routes --> Public
    Routes --> Protected
    Public --> Landing
    Public --> Login
    Protected --> AdminDash
    Protected --> CoachDash
    Protected --> ClientDash
```

### Component Hierarchy

```
App
├── QueryClientProvider (TanStack Query)
│   └── BrowserRouter (React Router)
│       └── AuthProvider (Custom Context)
│           └── TooltipProvider (shadcn/ui)
│               └── Routes
│                   ├── Public Routes
│                   │   ├── Index (Landing Page)
│                   │   ├── Login
│                   │   ├── Signup
│                   │   └── ForgotPassword
│                   └── Protected Routes (ProtectedRoute wrapper)
│                       ├── /admin/* → AdminDashboard
│                       ├── /coach/* → CoachDashboard
│                       └── /client/* → ClientDashboard
```

### State Management Strategy

| State Type | Solution | Use Case |
|------------|----------|----------|
| Server State | TanStack Query | API data, caching, synchronization |
| Auth State | React Context | User session, role information |
| Form State | React Hook Form | Form inputs, validation |
| UI State | React useState | Local component state |
| URL State | React Router | Navigation, route params |

---

## Backend Architecture

### Supabase Services

```mermaid
graph LR
    subgraph "Supabase Platform"
        subgraph "Authentication"
            Auth[Supabase Auth]
            JWT[JWT Tokens]
        end
        
        subgraph "Database"
            PG[(PostgreSQL)]
            RLS[Row Level Security]
        end
        
        subgraph "Realtime"
            WS[WebSocket Server]
            Changes[Postgres Changes]
        end
        
        subgraph "Edge Functions"
            Deno[Deno Runtime]
            Funcs[Custom Functions]
        end
    end
    
    Auth --> JWT
    JWT --> RLS
    RLS --> PG
    PG --> Changes
    Changes --> WS
    Funcs --> PG
```

### Edge Functions Architecture

| Function | Trigger | Purpose |
|----------|---------|---------|
| send-client-invitation | HTTP POST | Send email invitations to clients |
| upload-progress-photo | HTTP POST | Upload photos to Azure Blob Storage |

### Database Architecture

- **34 Tables** across multiple domains
- **Row Level Security** on all tables
- **Custom Functions** for role checking
- **Triggers** for automatic timestamp updates
- **Enums** for type safety

See [Database Schema](./database-schema.md) for complete details.

---

## Data Flow

### Typical Read Operation

```mermaid
sequenceDiagram
    participant User
    participant React
    participant TanStack as TanStack Query
    participant Supabase as Supabase Client
    participant RLS
    participant DB as PostgreSQL
    
    User->>React: View Page
    React->>TanStack: useQuery hook
    TanStack->>Supabase: fetch data
    Supabase->>RLS: Apply policies
    RLS->>DB: Execute query
    DB-->>RLS: Return rows
    RLS-->>Supabase: Filtered data
    Supabase-->>TanStack: Response
    TanStack-->>React: Cached data
    React-->>User: Render UI
```

### Typical Write Operation

```mermaid
sequenceDiagram
    participant User
    participant Form as React Hook Form
    participant TanStack as TanStack Query
    participant Supabase as Supabase Client
    participant RLS
    participant DB as PostgreSQL
    
    User->>Form: Submit form
    Form->>Form: Validate (Zod)
    Form->>TanStack: useMutation
    TanStack->>Supabase: insert/update
    Supabase->>RLS: Check policies
    RLS->>DB: Execute mutation
    DB-->>RLS: Success/Error
    RLS-->>Supabase: Result
    Supabase-->>TanStack: Response
    TanStack->>TanStack: Invalidate queries
    TanStack-->>Form: Success
    Form-->>User: Toast notification
```

---

## Authentication Flow

### Sign Up Flow

```mermaid
sequenceDiagram
    participant User
    participant SignupPage
    participant AuthContext
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    
    User->>SignupPage: Enter details + role
    SignupPage->>Supabase: signUp(email, password, metadata)
    Supabase->>Supabase: Create auth.users record
    Supabase->>DB: Trigger: create profile
    Supabase->>DB: Trigger: create user_role
    alt Role is Coach
        Supabase->>DB: Trigger: create coach_profile
    else Role is Client
        Supabase->>DB: Trigger: create client_profile
    end
    Supabase-->>SignupPage: Session + User
    SignupPage->>AuthContext: Update state
    AuthContext-->>User: Redirect to dashboard
```

### Sign In Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthContext
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    
    User->>LoginPage: Enter credentials
    LoginPage->>Supabase: signInWithPassword
    Supabase->>Supabase: Verify credentials
    Supabase-->>LoginPage: Session + User
    LoginPage->>AuthContext: fetchUserRole()
    AuthContext->>DB: Query user_roles
    DB-->>AuthContext: Role (admin/coach/client)
    AuthContext->>AuthContext: Set user with role
    AuthContext-->>User: Redirect based on role
```

### Protected Route Flow

```mermaid
sequenceDiagram
    participant User
    participant Router
    participant ProtectedRoute
    participant AuthContext
    
    User->>Router: Navigate to /coach/clients
    Router->>ProtectedRoute: Render
    ProtectedRoute->>AuthContext: Check user & role
    alt Loading
        ProtectedRoute-->>User: Show spinner
    else Not authenticated
        ProtectedRoute-->>Router: Redirect to /login
    else Wrong role
        ProtectedRoute-->>Router: Redirect to correct dashboard
    else Authorized
        ProtectedRoute-->>User: Render children
    end
```

---

## Real-time Architecture

### Subscription Setup

```typescript
// Example: Real-time message subscription
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${userId}`
    },
    (payload) => {
      // Handle new/updated message
      queryClient.invalidateQueries(['messages']);
    }
  )
  .subscribe();
```

### Real-time Data Flow

```mermaid
sequenceDiagram
    participant Client1 as Coach Browser
    participant WS as WebSocket Server
    participant DB as PostgreSQL
    participant Client2 as Client Browser
    
    Client1->>WS: Subscribe to messages
    Client2->>WS: Subscribe to messages
    Client1->>DB: Send message
    DB->>WS: Postgres NOTIFY
    WS->>Client2: Push update
    Client2->>Client2: Update UI
```

---

## Deployment Architecture

### CI/CD Pipeline

```mermaid
graph LR
    subgraph "Source Control"
        GH[GitHub Repository]
    end
    
    subgraph "Azure DevOps"
        Build[Build Stage]
        DeployDev[Deploy Dev]
        DeployProd[Deploy Prod]
    end
    
    subgraph "Azure"
        SWA_Dev[Static Web App - Dev]
        SWA_Prod[Static Web App - Prod]
    end
    
    GH -->|develop branch| Build
    GH -->|main branch| Build
    Build -->|develop| DeployDev
    Build -->|main| DeployProd
    DeployDev --> SWA_Dev
    DeployProd --> SWA_Prod
```

### Environment Strategy

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | develop | dev.customcoachpro.com | Testing and QA |
| Production | main | customcoachpro.com | Live users |

---

## Security Architecture

### Defense Layers

1. **Authentication** - Supabase Auth with JWT tokens
2. **Authorization** - Role-based access control
3. **Row Level Security** - Database-level access control
4. **API Security** - HTTPS, CORS policies
5. **Input Validation** - Zod schemas
6. **Environment Secrets** - Secure secret management

See [Security & RLS](./security-rls.md) for detailed policies.

---

## Performance Considerations

### Caching Strategy

| Data Type | Cache Time | Invalidation |
|-----------|------------|--------------|
| User Profile | 5 minutes | On update |
| Exercise List | 10 minutes | Rarely changes |
| Messages | 1 minute | Real-time updates |
| Notifications | 30 seconds | Real-time updates |

### Optimization Techniques

1. **TanStack Query** - Automatic caching and deduplication
2. **Code Splitting** - Route-based lazy loading
3. **Image Optimization** - Thumbnails for progress photos
4. **Database Indexes** - On frequently queried columns
5. **Edge Functions** - Serverless scaling

---

*For questions, contact Susheel Bhatt at s.susheel9@gmail.com*
