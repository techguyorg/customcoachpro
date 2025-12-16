# FitCoach Pro - .NET 8 Backend API

## Prerequisites

- .NET 8 SDK
- SQL Server (local or Azure SQL)
- Azure Storage Account (for photo uploads)

## Setup Instructions

### 1. Update Connection String

Edit `appsettings.Development.json` and update the connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FitCoachPro;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

For Azure SQL:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:your-server.database.windows.net,1433;Initial Catalog=FitCoachPro;Persist Security Info=False;User ID=your-user;Password=your-password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

### 2. Update JWT Settings

Generate a secure secret key and update `appsettings.json`:

```json
{
  "Jwt": {
    "Secret": "your-secure-secret-key-at-least-32-characters-long",
    "Issuer": "FitCoachPro",
    "Audience": "FitCoachPro",
    "ExpirationInMinutes": 60
  }
}
```

### 3. Update Azure Storage (Optional)

For photo uploads, configure Azure Blob Storage:

```json
{
  "AzureStorage": {
    "ConnectionString": "your-azure-storage-connection-string",
    "ContainerName": "photos"
  }
}
```

### 4. Run Database Migrations

```bash
cd FitCoachPro.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Run the API

```bash
dotnet run
```

The API will be available at:
- HTTPS: https://localhost:7001
- HTTP: http://localhost:5000
- Swagger UI: https://localhost:7001/swagger

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/{id}` - Get client by ID
- `GET /api/clients/coach/{coachId}` - Get clients by coach
- `POST /api/clients` - Create client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Check-ins
- `GET /api/checkins/weight/client/{clientId}` - Get weight check-ins
- `POST /api/checkins/weight` - Create weight check-in
- `GET /api/checkins/photos/client/{clientId}` - Get photo check-ins
- `POST /api/checkins/photos` - Create photo check-in
- `GET /api/checkins/workout/client/{clientId}` - Get workout check-ins
- `POST /api/checkins/workout` - Create workout check-in
- `GET /api/checkins/diet/client/{clientId}` - Get diet check-ins
- `POST /api/checkins/diet` - Create diet check-in

### Exercises
- `GET /api/exercises` - Get all exercises
- `GET /api/exercises/{id}` - Get exercise by ID
- `GET /api/exercises/coach/{coachId}` - Get exercises by coach
- `POST /api/exercises` - Create exercise
- `PUT /api/exercises/{id}` - Update exercise
- `DELETE /api/exercises/{id}` - Delete exercise

### Workout Plans
- `GET /api/workout-plans` - Get all workout plans
- `GET /api/workout-plans/{id}` - Get workout plan by ID
- `GET /api/workout-plans/coach/{coachId}` - Get workout plans by coach
- `GET /api/workout-plans/client/{clientId}` - Get client's workout plans
- `POST /api/workout-plans` - Create workout plan
- `PUT /api/workout-plans/{id}` - Update workout plan
- `DELETE /api/workout-plans/{id}` - Delete workout plan
- `POST /api/workout-plans/assign` - Assign plan to client
- `POST /api/workout-plans/{id}/days` - Add workout day
- `POST /api/workout-plans/days/{dayId}/exercises` - Add exercise to day

### Foods
- `GET /api/foods` - Get all foods
- `GET /api/foods/{id}` - Get food by ID
- `GET /api/foods/coach/{coachId}` - Get foods by coach
- `POST /api/foods` - Create food
- `PUT /api/foods/{id}` - Update food
- `DELETE /api/foods/{id}` - Delete food

### Meals
- `GET /api/meals` - Get all meals
- `GET /api/meals/{id}` - Get meal by ID
- `GET /api/meals/coach/{coachId}` - Get meals by coach
- `POST /api/meals` - Create meal
- `PUT /api/meals/{id}` - Update meal
- `DELETE /api/meals/{id}` - Delete meal
- `POST /api/meals/{id}/foods` - Add food to meal

### Diet Plans
- `GET /api/diet-plans` - Get all diet plans
- `GET /api/diet-plans/{id}` - Get diet plan by ID
- `GET /api/diet-plans/coach/{coachId}` - Get diet plans by coach
- `GET /api/diet-plans/client/{clientId}` - Get client's diet plans
- `POST /api/diet-plans` - Create diet plan
- `PUT /api/diet-plans/{id}` - Update diet plan
- `DELETE /api/diet-plans/{id}` - Delete diet plan
- `POST /api/diet-plans/assign` - Assign plan to client
- `POST /api/diet-plans/{id}/meals` - Add meal to plan

### Dashboard
- `GET /api/dashboard/coach` - Get coach dashboard data
- `GET /api/dashboard/client` - Get client dashboard data

## Deployment to Azure

### 1. Create Azure Resources

```bash
# Create resource group
az group create --name FitCoachPro-RG --location eastus

# Create App Service Plan
az appservice plan create --name FitCoachPro-Plan --resource-group FitCoachPro-RG --sku B1 --is-linux

# Create Web App
az webapp create --name fitcoachpro-api --resource-group FitCoachPro-RG --plan FitCoachPro-Plan --runtime "DOTNET|8.0"

# Create SQL Server
az sql server create --name fitcoachpro-sql --resource-group FitCoachPro-RG --location eastus --admin-user adminuser --admin-password YourPassword123!

# Create SQL Database
az sql db create --resource-group FitCoachPro-RG --server fitcoachpro-sql --name FitCoachPro --service-objective S0
```

### 2. Configure App Settings

```bash
az webapp config appsettings set --name fitcoachpro-api --resource-group FitCoachPro-RG --settings \
  "ConnectionStrings__DefaultConnection=your-connection-string" \
  "Jwt__Secret=your-jwt-secret" \
  "AllowedOrigins=https://your-frontend-url.com"
```

### 3. Deploy

```bash
dotnet publish -c Release
az webapp deploy --resource-group FitCoachPro-RG --name fitcoachpro-api --src-path bin/Release/net8.0/publish.zip
```

## Frontend Configuration

Update the React frontend's `.env` file:

```env
VITE_API_URL=https://fitcoachpro-api.azurewebsites.net/api
```

## Security Notes

1. Always use HTTPS in production
2. Store secrets in Azure Key Vault
3. Enable Azure SQL firewall rules
4. Configure CORS to only allow your frontend domain
5. Use managed identities where possible
