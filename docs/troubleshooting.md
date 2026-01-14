# CustomCoachPro - Troubleshooting Guide

**Author:** Susheel Bhatt  
**Contact:** s.susheel9@gmail.com

---

## Table of Contents

1. [Development Issues](#development-issues)
2. [Build Issues](#build-issues)
3. [Authentication Issues](#authentication-issues)
4. [Database Issues](#database-issues)
5. [Edge Function Issues](#edge-function-issues)
6. [Deployment Issues](#deployment-issues)
7. [Performance Issues](#performance-issues)
8. [Common Error Messages](#common-error-messages)

---

## Development Issues

### Issue: Development Server Won't Start

**Symptoms:**
- `npm run dev` fails
- Port already in use
- Module not found errors

**Solutions:**

1. **Port in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

2. **Missing dependencies:**
```bash
# Clear and reinstall
rm -rf node_modules
npm install
```

3. **Node version mismatch:**
```bash
# Check version
node --version

# Should be 20.x or later
nvm use 20
```

### Issue: Hot Reload Not Working

**Symptoms:**
- Changes don't reflect in browser
- Need to manually refresh

**Solutions:**

1. Check if file is being watched:
```bash
# Vite should show file in console
[vite] page reload src/components/MyComponent.tsx
```

2. Clear Vite cache:
```bash
rm -rf node_modules/.vite
npm run dev
```

3. Check for syntax errors preventing compilation

---

## Build Issues

### Issue: TypeScript Errors

**Symptoms:**
- `Type 'X' is not assignable to type 'Y'`
- Build fails with TS errors

**Solutions:**

1. **Check the specific error:**
```bash
npx tsc --noEmit
```

2. **Common fixes:**
```typescript
// Add type assertion
const data = response as MyType;

// Add null check
if (data) {
  // use data
}

// Add optional chaining
const value = obj?.property?.nested;
```

### Issue: Module Not Found

**Symptoms:**
- `Cannot find module '@/components/...'`
- Import errors

**Solutions:**

1. **Check path alias:**
```typescript
// Correct
import { Button } from '@/components/ui/button';

// Wrong
import { Button } from '@components/ui/button';
```

2. **Verify file exists** at the exact path

3. **Check tsconfig.json paths:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Tailwind Classes Not Applied

**Symptoms:**
- Styles missing in production
- Classes work in dev but not prod

**Solutions:**

1. **Check content config in tailwind.config.ts:**
```typescript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

2. **Don't use dynamic class names:**
```typescript
// Wrong - won't be detected
className={`text-${color}-500`}

// Right - use complete classes
className={color === 'red' ? 'text-red-500' : 'text-blue-500'}
```

---

## Authentication Issues

### Issue: User Not Authenticated

**Symptoms:**
- Redirected to login unexpectedly
- `user` is null

**Solutions:**

1. **Check session in console:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

2. **Verify token not expired**

3. **Check AuthContext is wrapping components:**
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Issue: Sign Up Not Working

**Symptoms:**
- No error but user not created
- Email not received

**Solutions:**

1. **Check Supabase Auth settings:**
   - Email confirmations disabled (auto-confirm enabled)
   - Site URL configured correctly

2. **Check for duplicate email:**
```typescript
// Error will indicate if email exists
```

3. **Verify network request succeeds**

### Issue: Password Reset Not Working

**Symptoms:**
- Reset email not received
- Link doesn't work

**Solutions:**

1. **Check email configuration in Supabase**

2. **Verify redirect URL is correct:**
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://customcoachpro.com/reset-password',
});
```

### Issue: Role Not Assigned

**Symptoms:**
- User logged in but role is undefined
- Access to wrong dashboard

**Solutions:**

1. **Check user_roles table:**
```sql
SELECT * FROM user_roles WHERE user_id = 'uuid';
```

2. **Verify trigger created role on signup**

3. **Manually insert if missing:**
```sql
INSERT INTO user_roles (user_id, role) VALUES ('uuid', 'client');
```

---

## Database Issues

### Issue: Query Returns Empty

**Symptoms:**
- Data exists but query returns `[]`
- No error thrown

**Solutions:**

1. **Check RLS policies:**
```sql
-- Temporarily disable to test
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;

-- Query
SELECT * FROM table_name;

-- Re-enable
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

2. **Verify user meets policy conditions**

3. **Check filter conditions:**
```typescript
// Are filters correct?
.eq('column', value)
```

### Issue: Foreign Key Constraint Error

**Symptoms:**
- `violates foreign key constraint`
- Insert/update fails

**Solutions:**

1. **Verify referenced record exists:**
```sql
SELECT id FROM referenced_table WHERE id = 'uuid';
```

2. **Check order of operations:**
   - Insert parent before child
   - Delete child before parent

### Issue: RLS Policy Blocking Access

**Symptoms:**
- `new row violates row-level security policy`

**Solutions:**

1. **Check policy WITH CHECK condition:**
```sql
-- The insert must satisfy this
WITH CHECK (auth.uid() = user_id)
```

2. **Ensure user is setting correct ownership:**
```typescript
await supabase.from('table').insert({
  user_id: user.id, // Must be current user
  ...otherData,
});
```

### Issue: Data Not Updating

**Symptoms:**
- Update query succeeds but data unchanged

**Solutions:**

1. **Check if RLS allows update:**
```sql
-- Policy must allow UPDATE
CREATE POLICY "..." FOR UPDATE USING (...)
```

2. **Verify the WHERE condition matches:**
```typescript
await supabase
  .from('table')
  .update({ field: 'value' })
  .eq('id', correctId); // Is this the right ID?
```

---

## Edge Function Issues

### Issue: Function Returns 404

**Symptoms:**
- `Function not found`
- 404 error on invoke

**Solutions:**

1. **Verify function is deployed:**
   - Check function logs in platform
   - Ensure no deployment errors

2. **Check function name matches:**
```typescript
// Function folder: supabase/functions/my-function/
await supabase.functions.invoke('my-function'); // Must match
```

### Issue: Function Returns 500

**Symptoms:**
- Internal server error
- No useful error message

**Solutions:**

1. **Check function logs for error details**

2. **Add try/catch and logging:**
```typescript
try {
  // Your code
} catch (error) {
  console.error('Error:', error);
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500 }
  );
}
```

3. **Verify environment variables are set**

### Issue: CORS Errors

**Symptoms:**
- `Access to fetch blocked by CORS policy`

**Solutions:**

1. **Add CORS headers to response:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Include in all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

2. **Handle OPTIONS preflight:**
```typescript
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### Issue: Missing Environment Variable

**Symptoms:**
- `undefined` when accessing `Deno.env.get()`
- Function fails at runtime

**Solutions:**

1. **Add secret through platform settings**

2. **Check secret name matches exactly:**
```typescript
// Case-sensitive
const key = Deno.env.get('RESEND_API_KEY'); // Not 'resend_api_key'
```

---

## Deployment Issues

### Issue: Azure Pipeline Fails

**Symptoms:**
- Build stage fails
- Deploy stage fails

**Solutions:**

1. **Check build logs for specific error**

2. **Verify variable group exists and contains:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Deployment tokens

3. **Check deployment token is valid:**
   - Regenerate token in Azure Portal
   - Update in variable group

### Issue: SWA Returns 404

**Symptoms:**
- Routes work in dev but 404 in production
- Only root path works

**Solutions:**

1. **Add staticwebapp.config.json:**
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  }
}
```

2. **Verify build output is correct:**
   - Check `dist/` folder contains index.html
   - Check assets are present

### Issue: Environment Variables Missing in Production

**Symptoms:**
- Features work in dev but not prod
- API calls fail

**Solutions:**

1. **Set variables in Azure DevOps:**
   - Add to variable group
   - Reference in pipeline YAML

2. **Verify variable is used in build:**
```yaml
- script: npm run build
  env:
    VITE_SUPABASE_URL: $(VITE_SUPABASE_URL)
```

---

## Performance Issues

### Issue: Slow Initial Load

**Symptoms:**
- Long time to first render
- Large bundle size

**Solutions:**

1. **Check bundle size:**
```bash
npm run build
# Check output for chunk sizes
```

2. **Implement code splitting:**
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

3. **Optimize images**

### Issue: Slow Database Queries

**Symptoms:**
- UI feels sluggish
- Long loading spinners

**Solutions:**

1. **Add indexes:**
```sql
CREATE INDEX idx_table_column ON public.table(column);
```

2. **Limit query results:**
```typescript
.select('*')
.limit(50)
```

3. **Use query caching:**
```typescript
useQuery({
  queryKey: ['data'],
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Issue: Memory Leaks

**Symptoms:**
- App slows down over time
- Browser tab crashes

**Solutions:**

1. **Clean up subscriptions:**
```typescript
useEffect(() => {
  const channel = supabase.channel('...');
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

2. **Cancel pending queries:**
```typescript
const query = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});

// Will cancel if component unmounts
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `JWT expired` | Session timeout | Re-authenticate user |
| `Invalid API key` | Wrong key or not set | Check environment variables |
| `Row level security violation` | RLS policy blocking | Review policy conditions |
| `Foreign key violation` | Referenced row missing | Insert parent first |
| `Duplicate key value` | Unique constraint | Handle upsert or check exists |
| `Function not found` | Edge function not deployed | Check deployment status |
| `CORS error` | Missing headers | Add corsHeaders to response |

---

## Getting Help

If you can't resolve an issue:

1. **Check logs** - Console, network, function logs
2. **Search error message** - Often others have seen it
3. **Create minimal reproduction** - Isolate the issue
4. **Contact support** - s.susheel9@gmail.com

---

*For questions, contact Susheel Bhatt at s.susheel9@gmail.com*
