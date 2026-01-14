# CustomCoachPro - Configuration Guide

**Author:** Susheel Bhatt  
**Contact:** s.susheel9@gmail.com

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Secrets Management](#secrets-management)
3. [Third-Party Integrations](#third-party-integrations)
4. [Application Configuration](#application-configuration)
5. [Feature Flags](#feature-flags)
6. [Future Migration Considerations](#future-migration-considerations)

---

## Environment Variables

### Frontend Variables

These variables are available in the client-side code (prefixed with `VITE_`):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Backend API endpoint | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public API key (anon key) | `eyJhbGci...` |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier | `ojtvhevrsixwokjbidcx` |

**Note:** These are auto-generated and should not be modified manually.

### Accessing in Code

```typescript
// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

### Backend Variables (Edge Functions)

Edge functions have access to these environment variables:

| Variable | Description | Auto-Provided |
|----------|-------------|---------------|
| `SUPABASE_URL` | Backend URL | Yes |
| `SUPABASE_ANON_KEY` | Anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key | Yes |

Custom secrets (added via platform):

| Variable | Description | Service |
|----------|-------------|---------|
| `RESEND_API_KEY` | Email API key | Resend |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account | Azure |
| `AZURE_STORAGE_ACCOUNT_KEY` | Storage key | Azure |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container | Azure |

---

## Secrets Management

### Adding Secrets

1. Navigate to project settings in the platform
2. Go to Secrets section
3. Add secret name and value
4. Save

### Using Secrets in Edge Functions

```typescript
// In edge function
const apiKey = Deno.env.get('RESEND_API_KEY');

if (!apiKey) {
  throw new Error('RESEND_API_KEY not configured');
}
```

### Security Best Practices

1. **Never commit secrets** - Secrets should never appear in code
2. **Rotate regularly** - Change API keys periodically
3. **Minimal access** - Only add secrets that are needed
4. **Document requirements** - Note which secrets each function needs

---

## Third-Party Integrations

### Resend (Email Service)

**Purpose:** Send transactional emails (client invitations)

**Setup:**
1. Create account at [resend.com](https://resend.com)
2. Verify sending domain
3. Create API key
4. Add `RESEND_API_KEY` secret

**Configuration:**
```typescript
// In edge function
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'CustomCoachPro <noreply@customcoachpro.com>',
    to: recipientEmail,
    subject: 'Your Subject',
    html: '<p>Email content</p>',
  }),
});
```

**Customization Points:**
- Sender email/name
- Email templates
- Subject lines

---

### Azure Blob Storage

**Purpose:** Store client progress photos

**Setup:**
1. Create Azure Storage Account
2. Create blob container
3. Configure CORS for container
4. Get access keys
5. Add secrets:
   - `AZURE_STORAGE_ACCOUNT_NAME`
   - `AZURE_STORAGE_ACCOUNT_KEY`
   - `AZURE_STORAGE_CONTAINER_NAME`

**Container CORS Configuration:**
```json
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "PUT", "OPTIONS"],
  "AllowedHeaders": ["*"],
  "ExposedHeaders": ["*"],
  "MaxAgeInSeconds": 3600
}
```

**Container Access Level:**
- Set to "Blob" for public read access to uploaded photos
- Or "Private" if accessing through signed URLs

---

### Supabase Authentication

**Purpose:** User authentication and session management

**Configuration:**
- Auto-confirm enabled for signups
- Email/password auth enabled
- Session handling automatic

**Customization in `supabase/config.toml`:**
```toml
[auth]
enabled = true
site_url = "https://customcoachpro.com"

[auth.email]
enable_signup = true
double_confirm_changes = false
enable_confirmations = false

[auth.sms]
enable_signup = false
```

---

## Application Configuration

### Tailwind CSS

**File:** `tailwind.config.ts`

Key configurations:
```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Custom color tokens
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        // ... more colors
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### CSS Variables

**File:** `src/index.css`

Design tokens:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... more tokens */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode tokens */
}
```

### Vite Configuration

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

### TypeScript Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### shadcn/ui Configuration

**File:** `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## Feature Flags

Currently, feature flags are managed through:

1. **Database fields** - `is_system` flags on content
2. **Role checks** - Feature visibility by user role
3. **Environment detection** - Development vs production behavior

### Example Implementation

```typescript
// Feature based on role
const canCreateSystemContent = user?.role === 'super_admin';

// Feature based on database flag
const visibleTemplates = templates.filter(t => 
  t.is_system || t.created_by === user?.id
);
```

### Future Enhancement

Consider implementing a formal feature flag system:

```typescript
// Potential structure
const features = {
  ENABLE_STRIPE_PAYMENTS: false,
  ENABLE_VIDEO_CALLS: false,
  ENABLE_AI_SUGGESTIONS: true,
};

function isFeatureEnabled(feature: keyof typeof features) {
  return features[feature];
}
```

---

## Future Migration Considerations

### Migrating to Azure SQL

If moving from Supabase PostgreSQL to Azure SQL:

**Changes Required:**
1. Update `src/integrations/` with Azure SQL client
2. Modify queries for T-SQL syntax differences
3. Implement auth separately (Azure AD B2C recommended)
4. Update edge functions to Azure Functions

**Compatibility Notes:**
- Most SQL is portable
- RLS would need reimplementation
- Real-time would need SignalR or similar

### Migrating to Azure Functions

Edge functions can be converted to Azure Functions:

```typescript
// Supabase Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req) => { ... });

// Azure Function equivalent
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest) => { ... };
export default httpTrigger;
```

### Migrating Authentication

Options for auth migration:

1. **Azure AD B2C** - Enterprise-grade, complex setup
2. **Auth0** - Flexible, quick integration
3. **Firebase Auth** - Google ecosystem

**Data Migration:**
```sql
-- Export users for migration
SELECT id, email, created_at FROM auth.users;
```

### Storage Migration

Azure Blob Storage is already in use. For full Azure migration:

1. Keep existing container
2. Update edge function URLs if needed
3. Consider Azure CDN for performance

---

## Configuration Checklist

### Development Setup

- [ ] Node.js 20.x installed
- [ ] npm packages installed
- [ ] Environment file exists
- [ ] Development server starts

### Production Setup

- [ ] Azure DevOps variable group configured
- [ ] SWA deployment tokens added
- [ ] Edge function secrets added
- [ ] Custom domain configured (optional)

### Third-Party Services

- [ ] Resend account created
- [ ] Resend API key configured
- [ ] Azure Storage account created
- [ ] Azure Storage container created
- [ ] Azure Storage CORS configured
- [ ] Azure Storage keys configured

---

*For questions, contact Susheel Bhatt at s.susheel9@gmail.com*
