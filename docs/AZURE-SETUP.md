# Azure Migration - Complete Setup Guide

## Pre-Requisites Checklist

### Azure Resources to Create

1. **Backend App Service** (create if not exists):
   - Name: `customcoachpro-api`
   - Runtime: Node.js 20 LTS
   - OS: Windows
   - Resource Group: `rg-customer-coach-pro-prod`

2. **Frontend App Service** (already exists):
   - Name: `customcoachpro`

3. **Azure SQL Database** (if not exists):
   - Server: `sql-ccp-prod.database.windows.net`
   - Database: `sqldb-ccp-prod`

4. **Azure DevOps Pipeline Variables** (set in pipeline or variable group):
   - `SQL_USER` - Database username
   - `SQL_PASSWORD` - Database password  
   - `JWT_SECRET` - 64-character random string
   - `GOOGLE_APP_PASSWORD` - Gmail app password
   - `AZURE_SERVICE_CONNECTION` - Your service connection name

---

## 1. DATA MIGRATION

### Step 1: Create Schema in Azure SQL
```bash
# Open Azure Data Studio, connect to your database
# Run: docs/azure-sql-schema.sql
```

### Step 2: Export Data from Supabase
```bash
# Go to Supabase Dashboard → SQL Editor
# Run each query section from: docs/data-export-queries.sql
# Copy the generated INSERT statements
```

### Step 3: Import Data to Azure SQL
```bash
# In Azure Data Studio, paste and run the INSERT statements
# Run them in this order:
# 1. exercises
# 2. workout_templates
# 3. workout_template_weeks
# 4. workout_template_days
# 5. workout_template_exercises
# 6. foods
# 7. recipes
# 8. recipe_ingredients
# 9. diet_plans
```

### Step 4: Validate Data Migration
```sql
-- Run in Azure Data Studio:
SELECT 'exercises' as table_name, COUNT(*) as row_count FROM exercises
UNION ALL SELECT 'workout_templates', COUNT(*) FROM workout_templates
UNION ALL SELECT 'workout_template_weeks', COUNT(*) FROM workout_template_weeks
UNION ALL SELECT 'workout_template_days', COUNT(*) FROM workout_template_days
UNION ALL SELECT 'workout_template_exercises', COUNT(*) FROM workout_template_exercises
UNION ALL SELECT 'foods', COUNT(*) FROM foods
UNION ALL SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL SELECT 'diet_plans', COUNT(*) FROM diet_plans;

-- Expected:
-- exercises: 148
-- workout_templates: 136
-- workout_template_weeks: 1367
-- workout_template_days: 544
-- workout_template_exercises: 206
-- foods: 448
-- recipes: 14
-- diet_plans: 7
```

---

## 2. LOCAL DEVELOPMENT & TESTING

### Prerequisites
- Node.js 20.x
- Azure Data Studio (for database)
- Git

### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd customcoachpro
npm install

cd backend
npm install
cd ..
```

### Step 2: Configure Backend Environment
Create `backend/.env` file (for local development only):
```env
SQL_USER=your_sql_username
SQL_PASSWORD=your_sql_password
JWT_SECRET=your-64-character-random-string-here-make-it-long-enough
GOOGLE_APP_PASSWORD=your_gmail_app_password
```

### Step 3: Update API URL for Local Development
Edit `src/lib/api.ts` line 4:
```typescript
const API_URL = 'http://localhost:3000'; // Already set for local
```

### Step 4: Start Backend (Terminal 1)
```bash
cd backend
npm run dev
# Runs at http://localhost:3000
# Swagger UI at http://localhost:3000/api-docs
```

### Step 5: Start Frontend (Terminal 2)
```bash
npm run dev
# Runs at http://localhost:5173
```

### Step 6: Test the Full Flow
1. Open http://localhost:5173 (frontend)
2. Open http://localhost:3000/api-docs (Swagger)
3. Test signup/login flow
4. Test exercise listing
5. Test workout templates
6. Check browser console for errors
7. Check backend terminal for request logs

### Troubleshooting Local Issues

**CORS errors:**
- Backend allows localhost:5173 by default
- Check `backend/src/index.ts` cors config

**Database connection failed:**
- Verify Azure SQL allows your IP (firewall rules)
- Check credentials in .env file

**API calls failing:**
- Check API_URL in `src/lib/api.ts`
- Verify backend is running on port 3000

---

## 3. AZURE DEPLOYMENT

### Step 1: Create Backend App Service
```bash
# Azure Portal → App Services → Create
# Name: customcoachpro-api
# Runtime: Node 20 LTS
# OS: Windows
# Region: Same as your SQL database
# Resource Group: rg-customer-coach-pro-prod
```

### Step 2: Configure App Settings
Go to Azure Portal → customcoachpro-api → Configuration → Application Settings:

| Setting | Value |
|---------|-------|
| SQL_USER | (your database username) |
| SQL_PASSWORD | (your database password) |
| JWT_SECRET | (64-char random string) |
| GOOGLE_APP_PASSWORD | (Gmail app password) |
| WEBSITE_NODE_DEFAULT_VERSION | ~20 |

### Step 3: Update Frontend API URL
Before pushing to main, update `src/lib/api.ts`:
```typescript
const API_URL = 'https://customcoachpro-api.azurewebsites.net';
```

### Step 4: Setup Azure DevOps Pipeline

1. Go to Azure DevOps → Pipelines → New Pipeline
2. Select your repo (Azure Repos Git or GitHub)
3. Select "Existing Azure Pipelines YAML file"
4. Path: `/azure-pipelines.yml`
5. Save and run

### Step 5: Configure Pipeline Variables
In Azure DevOps → Pipelines → Your Pipeline → Edit → Variables:

| Variable | Value | Secret |
|----------|-------|--------|
| AZURE_SERVICE_CONNECTION | (your service connection name) | No |
| SQL_USER | (database user) | Yes |
| SQL_PASSWORD | (database password) | Yes |
| JWT_SECRET | (64-char string) | Yes |
| GOOGLE_APP_PASSWORD | (gmail app pwd) | Yes |

### Step 6: Create Service Connection (if not exists)
Azure DevOps → Project Settings → Service Connections → New:
- Type: Azure Resource Manager
- Scope: Subscription
- Resource Group: rg-customer-coach-pro-prod
- Name: Use this name in AZURE_SERVICE_CONNECTION variable

### Step 7: Run Pipeline
```bash
git add .
git commit -m "Azure migration complete"
git push origin main
# Pipeline will automatically trigger
```

### Step 8: Verify Deployment
1. Backend: https://customcoachpro-api.azurewebsites.net/api-docs
2. Frontend: https://customcoachpro.azurewebsites.net
3. Test login flow
4. Check Application Insights for errors (if configured)

---

## Quick Validation Checklist

### Local Testing ✓
- [ ] Backend starts without errors
- [ ] Swagger UI loads at /api-docs
- [ ] Frontend starts without errors
- [ ] Can navigate to exercises page
- [ ] API calls work (check Network tab)

### Database ✓
- [ ] Schema created successfully
- [ ] All data imported
- [ ] Row counts match expected values

### Azure Deployment ✓
- [ ] Backend App Service created
- [ ] App Settings configured
- [ ] Pipeline runs successfully
- [ ] Backend API accessible
- [ ] Frontend loads
- [ ] Login/signup works

---

## File Reference

| File | Purpose |
|------|---------|
| `azure-pipelines.yml` | CI/CD pipeline definition |
| `docs/azure-sql-schema.sql` | Database schema for Azure SQL |
| `docs/data-export-queries.sql` | Supabase → Azure SQL export queries |
| `backend/` | Express.js API (replaces azure-functions/) |
| `src/lib/api.ts` | API client (change API_URL here) |
