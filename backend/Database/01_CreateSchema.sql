-- FitCoach Pro Database Schema
-- Run this script on your Azure SQL Database or local SQL Server

-- Create Enums as check constraints (SQL Server doesn't support ENUMs)
-- We'll use VARCHAR with CHECK constraints

-- Users Table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Coach', 'Client')),
    AvatarUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);

-- Refresh Tokens Table
CREATE TABLE RefreshTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(500) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    RevokedAt DATETIME2 NULL,
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
CREATE INDEX IX_RefreshTokens_Token ON RefreshTokens(Token);

-- Clients Table
CREATE TABLE Clients (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    CoachId UNIQUEIDENTIFIER NOT NULL,
    DateOfBirth DATE NULL,
    Gender NVARCHAR(20) NULL CHECK (Gender IN ('Male', 'Female', 'Other', 'PreferNotToSay')),
    Height DECIMAL(5,2) NULL,
    StartingWeight DECIMAL(5,2) NULL,
    GoalWeight DECIMAL(5,2) NULL,
    Phone NVARCHAR(20) NULL,
    Notes NVARCHAR(MAX) NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Inactive', 'OnHold')),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Clients_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Clients_Coaches FOREIGN KEY (CoachId) REFERENCES Users(Id) ON DELETE NO ACTION
);

CREATE INDEX IX_Clients_UserId ON Clients(UserId);
CREATE INDEX IX_Clients_CoachId ON Clients(CoachId);

-- Weight Check-ins Table
CREATE TABLE WeightCheckIns (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER NOT NULL,
    Weight DECIMAL(5,2) NOT NULL,
    BodyFatPercentage DECIMAL(4,2) NULL,
    Waist DECIMAL(5,2) NULL,
    Chest DECIMAL(5,2) NULL,
    Arms DECIMAL(5,2) NULL,
    Thighs DECIMAL(5,2) NULL,
    Notes NVARCHAR(MAX) NULL,
    CheckInDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_WeightCheckIns_Clients FOREIGN KEY (ClientId) REFERENCES Clients(Id) ON DELETE CASCADE
);

CREATE INDEX IX_WeightCheckIns_ClientId ON WeightCheckIns(ClientId);
CREATE INDEX IX_WeightCheckIns_CheckInDate ON WeightCheckIns(CheckInDate);

-- Photo Check-ins Table
CREATE TABLE PhotoCheckIns (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER NOT NULL,
    FrontPhotoUrl NVARCHAR(500) NULL,
    SidePhotoUrl NVARCHAR(500) NULL,
    BackPhotoUrl NVARCHAR(500) NULL,
    Notes NVARCHAR(MAX) NULL,
    CheckInDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_PhotoCheckIns_Clients FOREIGN KEY (ClientId) REFERENCES Clients(Id) ON DELETE CASCADE
);

CREATE INDEX IX_PhotoCheckIns_ClientId ON PhotoCheckIns(ClientId);

-- Workout Check-ins Table
CREATE TABLE WorkoutCheckIns (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER NOT NULL,
    WorkoutPlanId UNIQUEIDENTIFIER NULL,
    WorkoutDayId UNIQUEIDENTIFIER NULL,
    Completed BIT NOT NULL DEFAULT 0,
    DurationMinutes INT NULL,
    Notes NVARCHAR(MAX) NULL,
    CheckInDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_WorkoutCheckIns_Clients FOREIGN KEY (ClientId) REFERENCES Clients(Id) ON DELETE CASCADE
);

CREATE INDEX IX_WorkoutCheckIns_ClientId ON WorkoutCheckIns(ClientId);

-- Diet Check-ins Table
CREATE TABLE DietCheckIns (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER NOT NULL,
    DietPlanId UNIQUEIDENTIFIER NULL,
    AdherenceRating INT NOT NULL CHECK (AdherenceRating >= 1 AND AdherenceRating <= 10),
    CaloriesConsumed INT NULL,
    ProteinGrams DECIMAL(6,2) NULL,
    CarbsGrams DECIMAL(6,2) NULL,
    FatGrams DECIMAL(6,2) NULL,
    WaterLiters DECIMAL(4,2) NULL,
    Notes NVARCHAR(MAX) NULL,
    CheckInDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_DietCheckIns_Clients FOREIGN KEY (ClientId) REFERENCES Clients(Id) ON DELETE CASCADE
);

CREATE INDEX IX_DietCheckIns_ClientId ON DietCheckIns(ClientId);

-- Exercises Table
CREATE TABLE Exercises (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CoachId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    MuscleGroup NVARCHAR(50) NOT NULL CHECK (MuscleGroup IN ('Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'FullBody', 'Cardio')),
    Equipment NVARCHAR(50) NOT NULL CHECK (Equipment IN ('None', 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Kettlebell', 'Bands', 'Bodyweight', 'Other')),
    ExerciseType NVARCHAR(50) NOT NULL CHECK (ExerciseType IN ('Strength', 'Cardio', 'Flexibility', 'Balance', 'Plyometric')),
    VideoUrl NVARCHAR(500) NULL,
    ImageUrl NVARCHAR(500) NULL,
    Instructions NVARCHAR(MAX) NULL,
    IsPublic BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Exercises_Coaches FOREIGN KEY (CoachId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Exercises_CoachId ON Exercises(CoachId);
CREATE INDEX IX_Exercises_MuscleGroup ON Exercises(MuscleGroup);

-- Workout Plans Table
CREATE TABLE WorkoutPlans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CoachId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    DurationWeeks INT NOT NULL DEFAULT 4,
    DaysPerWeek INT NOT NULL DEFAULT 4,
    Difficulty NVARCHAR(20) NOT NULL DEFAULT 'Intermediate' CHECK (Difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    IsTemplate BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_WorkoutPlans_Coaches FOREIGN KEY (CoachId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_WorkoutPlans_CoachId ON WorkoutPlans(CoachId);

-- Workout Days Table
CREATE TABLE WorkoutDays (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    WorkoutPlanId UNIQUEIDENTIFIER NOT NULL,
    DayNumber INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    RestDay BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_WorkoutDays_WorkoutPlans FOREIGN KEY (WorkoutPlanId) REFERENCES WorkoutPlans(Id) ON DELETE CASCADE
);

CREATE INDEX IX_WorkoutDays_WorkoutPlanId ON WorkoutDays(WorkoutPlanId);

-- Workout Exercises Table
CREATE TABLE WorkoutExercises (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    WorkoutDayId UNIQUEIDENTIFIER NOT NULL,
    ExerciseId UNIQUEIDENTIFIER NOT NULL,
    OrderIndex INT NOT NULL DEFAULT 0,
    Sets INT NOT NULL DEFAULT 3,
    Reps NVARCHAR(50) NOT NULL DEFAULT '10',
    RestSeconds INT NOT NULL DEFAULT 60,
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_WorkoutExercises_WorkoutDays FOREIGN KEY (WorkoutDayId) REFERENCES WorkoutDays(Id) ON DELETE CASCADE,
    CONSTRAINT FK_WorkoutExercises_Exercises FOREIGN KEY (ExerciseId) REFERENCES Exercises(Id) ON DELETE NO ACTION
);

CREATE INDEX IX_WorkoutExercises_WorkoutDayId ON WorkoutExercises(WorkoutDayId);
CREATE INDEX IX_WorkoutExercises_ExerciseId ON WorkoutExercises(ExerciseId);

-- Client Workout Plans Table
CREATE TABLE ClientWorkoutPlans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER NOT NULL,
    WorkoutPlanId UNIQUEIDENTIFIER NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NULL,
    DurationDays INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ClientWorkoutPlans_Clients FOREIGN KEY (ClientId) REFERENCES Clients(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ClientWorkoutPlans_WorkoutPlans FOREIGN KEY (WorkoutPlanId) REFERENCES WorkoutPlans(Id) ON DELETE NO ACTION
);

CREATE INDEX IX_ClientWorkoutPlans_ClientId ON ClientWorkoutPlans(ClientId);
CREATE INDEX IX_ClientWorkoutPlans_WorkoutPlanId ON ClientWorkoutPlans(WorkoutPlanId);

-- Foods Table
CREATE TABLE Foods (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CoachId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Brand NVARCHAR(100) NULL,
    ServingSize DECIMAL(8,2) NOT NULL DEFAULT 100,
    ServingUnit NVARCHAR(20) NOT NULL DEFAULT 'g',
    Calories DECIMAL(8,2) NOT NULL,
    Protein DECIMAL(8,2) NOT NULL,
    Carbohydrates DECIMAL(8,2) NOT NULL,
    Fat DECIMAL(8,2) NOT NULL,
    Fiber DECIMAL(8,2) NULL,
    Sugar DECIMAL(8,2) NULL,
    Sodium DECIMAL(8,2) NULL,
    IsPublic BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Foods_Coaches FOREIGN KEY (CoachId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Foods_CoachId ON Foods(CoachId);

-- Meals Table
CREATE TABLE Meals (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CoachId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    MealType NVARCHAR(20) NOT NULL CHECK (MealType IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'PreWorkout', 'PostWorkout')),
    TotalCalories DECIMAL(8,2) NOT NULL DEFAULT 0,
    TotalProtein DECIMAL(8,2) NOT NULL DEFAULT 0,
    TotalCarbs DECIMAL(8,2) NOT NULL DEFAULT 0,
    TotalFat DECIMAL(8,2) NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Meals_Coaches FOREIGN KEY (CoachId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Meals_CoachId ON Meals(CoachId);

-- Meal Foods Table
CREATE TABLE MealFoods (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    MealId UNIQUEIDENTIFIER NOT NULL,
    FoodId UNIQUEIDENTIFIER NOT NULL,
    Quantity DECIMAL(8,2) NOT NULL DEFAULT 1,
    CONSTRAINT FK_MealFoods_Meals FOREIGN KEY (MealId) REFERENCES Meals(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MealFoods_Foods FOREIGN KEY (FoodId) REFERENCES Foods(Id) ON DELETE NO ACTION
);

CREATE INDEX IX_MealFoods_MealId ON MealFoods(MealId);
CREATE INDEX IX_MealFoods_FoodId ON MealFoods(FoodId);

-- Diet Plans Table
CREATE TABLE DietPlans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CoachId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    PlanType NVARCHAR(30) NOT NULL CHECK (PlanType IN ('WeightLoss', 'MuscleGain', 'Maintenance', 'Cutting', 'Bulking', 'Recomp')),
    TargetCalories INT NOT NULL DEFAULT 2000,
    TargetProtein INT NOT NULL DEFAULT 150,
    TargetCarbs INT NOT NULL DEFAULT 200,
    TargetFat INT NOT NULL DEFAULT 70,
    IsTemplate BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_DietPlans_Coaches FOREIGN KEY (CoachId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_DietPlans_CoachId ON DietPlans(CoachId);

-- Diet Plan Meals Table
CREATE TABLE DietPlanMeals (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    DietPlanId UNIQUEIDENTIFIER NOT NULL,
    MealId UNIQUEIDENTIFIER NOT NULL,
    DayOfWeek INT NOT NULL CHECK (DayOfWeek >= 0 AND DayOfWeek <= 6),
    OrderIndex INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_DietPlanMeals_DietPlans FOREIGN KEY (DietPlanId) REFERENCES DietPlans(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DietPlanMeals_Meals FOREIGN KEY (MealId) REFERENCES Meals(Id) ON DELETE NO ACTION
);

CREATE INDEX IX_DietPlanMeals_DietPlanId ON DietPlanMeals(DietPlanId);
CREATE INDEX IX_DietPlanMeals_MealId ON DietPlanMeals(MealId);

-- Client Diet Plans Table
CREATE TABLE ClientDietPlans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER NOT NULL,
    DietPlanId UNIQUEIDENTIFIER NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NULL,
    DurationDays INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ClientDietPlans_Clients FOREIGN KEY (ClientId) REFERENCES Clients(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ClientDietPlans_DietPlans FOREIGN KEY (DietPlanId) REFERENCES DietPlans(Id) ON DELETE NO ACTION
);

CREATE INDEX IX_ClientDietPlans_ClientId ON ClientDietPlans(ClientId);
CREATE INDEX IX_ClientDietPlans_DietPlanId ON ClientDietPlans(DietPlanId);

-- Add foreign key constraints for check-ins after all tables are created
ALTER TABLE WorkoutCheckIns ADD CONSTRAINT FK_WorkoutCheckIns_WorkoutPlans 
    FOREIGN KEY (WorkoutPlanId) REFERENCES WorkoutPlans(Id) ON DELETE SET NULL;
ALTER TABLE WorkoutCheckIns ADD CONSTRAINT FK_WorkoutCheckIns_WorkoutDays 
    FOREIGN KEY (WorkoutDayId) REFERENCES WorkoutDays(Id) ON DELETE SET NULL;
ALTER TABLE DietCheckIns ADD CONSTRAINT FK_DietCheckIns_DietPlans 
    FOREIGN KEY (DietPlanId) REFERENCES DietPlans(Id) ON DELETE SET NULL;

PRINT 'Schema created successfully!';
