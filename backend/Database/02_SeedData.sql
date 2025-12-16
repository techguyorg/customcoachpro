-- FitCoach Pro Seed Data
-- Run this script after creating the schema

-- ============================================
-- USERS (Password: Password123! for all users)
-- BCrypt hash for 'Password123!' 
-- ============================================

DECLARE @CoachId UNIQUEIDENTIFIER = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
DECLARE @ClientUserId UNIQUEIDENTIFIER = 'B2C3D4E5-F6A7-8901-BCDE-F12345678901';
DECLARE @Client2UserId UNIQUEIDENTIFIER = 'C3D4E5F6-A7B8-9012-CDEF-123456789012';
DECLARE @ClientId UNIQUEIDENTIFIER = 'D4E5F6A7-B8C9-0123-DEF0-234567890123';
DECLARE @Client2Id UNIQUEIDENTIFIER = 'E5F6A7B8-C9D0-1234-EF01-345678901234';

-- Coach User
INSERT INTO Users (Id, Email, PasswordHash, FirstName, LastName, Role, IsActive)
VALUES (@CoachId, 'coach@fitcoach.com', '$2a$11$rBNrLQH9zGmR5K8tR5VPxOqH9zDkYJ5WgEJPv1xZ3FvF2R3DqQZ5K', 'John', 'Coach', 'Coach', 1);

-- Client Users
INSERT INTO Users (Id, Email, PasswordHash, FirstName, LastName, Role, IsActive)
VALUES (@ClientUserId, 'client@fitcoach.com', '$2a$11$rBNrLQH9zGmR5K8tR5VPxOqH9zDkYJ5WgEJPv1xZ3FvF2R3DqQZ5K', 'Jane', 'Client', 'Client', 1);

INSERT INTO Users (Id, Email, PasswordHash, FirstName, LastName, Role, IsActive)
VALUES (@Client2UserId, 'mike@fitcoach.com', '$2a$11$rBNrLQH9zGmR5K8tR5VPxOqH9zDkYJ5WgEJPv1xZ3FvF2R3DqQZ5K', 'Mike', 'Johnson', 'Client', 1);

-- ============================================
-- CLIENTS
-- ============================================

INSERT INTO Clients (Id, UserId, CoachId, DateOfBirth, Gender, Height, StartingWeight, GoalWeight, Phone, Notes, Status)
VALUES (@ClientId, @ClientUserId, @CoachId, '1990-05-15', 'Female', 165, 70, 60, '+1-555-0101', 'Wants to lose weight and build lean muscle', 'Active');

INSERT INTO Clients (Id, UserId, CoachId, DateOfBirth, Gender, Height, StartingWeight, GoalWeight, Phone, Notes, Status)
VALUES (@Client2Id, @Client2UserId, @CoachId, '1985-08-22', 'Male', 180, 85, 80, '+1-555-0102', 'Training for a marathon, needs endurance program', 'Active');

-- ============================================
-- EXERCISES
-- ============================================

DECLARE @Exercise1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Exercise2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Exercise3Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Exercise4Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Exercise5Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Exercise6Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Exercise7Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Exercise8Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO Exercises (Id, CoachId, Name, Description, MuscleGroup, Equipment, ExerciseType, Instructions, IsPublic) VALUES
(@Exercise1Id, @CoachId, 'Barbell Bench Press', 'Classic chest exercise for building upper body strength', 'Chest', 'Barbell', 'Strength', 'Lie on bench, grip bar slightly wider than shoulder width, lower to chest, press up', 1),
(@Exercise2Id, @CoachId, 'Barbell Squat', 'Fundamental lower body compound movement', 'Quads', 'Barbell', 'Strength', 'Bar on upper back, feet shoulder width, squat down until thighs parallel, drive up', 1),
(@Exercise3Id, @CoachId, 'Deadlift', 'Full body compound lift targeting posterior chain', 'Back', 'Barbell', 'Strength', 'Grip bar outside knees, hinge at hips, keep back flat, drive through heels', 1),
(@Exercise4Id, @CoachId, 'Pull-ups', 'Bodyweight back exercise', 'Back', 'Bodyweight', 'Strength', 'Hang from bar, pull up until chin over bar, lower with control', 1),
(@Exercise5Id, @CoachId, 'Overhead Press', 'Shoulder pressing movement', 'Shoulders', 'Barbell', 'Strength', 'Bar at shoulders, press overhead, fully extend arms', 1),
(@Exercise6Id, @CoachId, 'Dumbbell Lunges', 'Single leg lower body exercise', 'Quads', 'Dumbbell', 'Strength', 'Step forward, lower back knee toward ground, push back to start', 1),
(@Exercise7Id, @CoachId, 'Plank', 'Core stability exercise', 'Core', 'Bodyweight', 'Strength', 'Forearms on ground, body straight, hold position', 1),
(@Exercise8Id, @CoachId, 'Treadmill Running', 'Cardiovascular exercise', 'Cardio', 'Machine', 'Cardio', 'Set pace and incline, maintain steady state or intervals', 1);

-- ============================================
-- WORKOUT PLANS
-- ============================================

DECLARE @WorkoutPlan1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @WorkoutPlan2Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO WorkoutPlans (Id, CoachId, Name, Description, DurationWeeks, DaysPerWeek, Difficulty, IsTemplate) VALUES
(@WorkoutPlan1Id, @CoachId, 'Beginner Strength Program', 'A 4-week program designed for beginners to build foundational strength', 4, 3, 'Beginner', 1),
(@WorkoutPlan2Id, @CoachId, 'Intermediate Hypertrophy', '8-week muscle building program for intermediate lifters', 8, 4, 'Intermediate', 1);

-- Workout Days for Plan 1
DECLARE @Day1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Day2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Day3Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO WorkoutDays (Id, WorkoutPlanId, DayNumber, Name, Description, RestDay) VALUES
(@Day1Id, @WorkoutPlan1Id, 1, 'Push Day', 'Chest, Shoulders, Triceps', 0),
(@Day2Id, @WorkoutPlan1Id, 2, 'Pull Day', 'Back, Biceps', 0),
(@Day3Id, @WorkoutPlan1Id, 3, 'Leg Day', 'Quads, Hamstrings, Glutes', 0);

-- Workout Exercises
INSERT INTO WorkoutExercises (WorkoutDayId, ExerciseId, OrderIndex, Sets, Reps, RestSeconds, Notes) VALUES
(@Day1Id, @Exercise1Id, 1, 3, '8-10', 90, 'Focus on controlled movement'),
(@Day1Id, @Exercise5Id, 2, 3, '8-10', 90, 'Keep core tight'),
(@Day2Id, @Exercise4Id, 1, 3, '6-8', 90, 'Use assistance if needed'),
(@Day2Id, @Exercise3Id, 2, 3, '5', 120, 'Maintain flat back'),
(@Day3Id, @Exercise2Id, 1, 4, '8', 120, 'Go to parallel'),
(@Day3Id, @Exercise6Id, 2, 3, '10 each leg', 60, 'Alternate legs');

-- Assign workout plan to client
INSERT INTO ClientWorkoutPlans (ClientId, WorkoutPlanId, StartDate, IsActive)
VALUES (@ClientId, @WorkoutPlan1Id, CAST(GETDATE() AS DATE), 1);

-- ============================================
-- FOODS
-- ============================================

DECLARE @Food1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Food2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Food3Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Food4Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Food5Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Food6Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO Foods (Id, CoachId, Name, Brand, ServingSize, ServingUnit, Calories, Protein, Carbohydrates, Fat, Fiber, IsPublic) VALUES
(@Food1Id, @CoachId, 'Chicken Breast', 'Generic', 100, 'g', 165, 31, 0, 3.6, 0, 1),
(@Food2Id, @CoachId, 'Brown Rice', 'Generic', 100, 'g', 111, 2.6, 23, 0.9, 1.8, 1),
(@Food3Id, @CoachId, 'Broccoli', 'Generic', 100, 'g', 34, 2.8, 7, 0.4, 2.6, 1),
(@Food4Id, @CoachId, 'Whole Eggs', 'Generic', 50, 'g', 78, 6.3, 0.6, 5.3, 0, 1),
(@Food5Id, @CoachId, 'Oatmeal', 'Quaker', 40, 'g', 150, 5, 27, 3, 4, 1),
(@Food6Id, @CoachId, 'Greek Yogurt', 'Fage', 170, 'g', 100, 18, 6, 0, 0, 1);

-- ============================================
-- MEALS
-- ============================================

DECLARE @Meal1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Meal2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Meal3Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO Meals (Id, CoachId, Name, Description, MealType, TotalCalories, TotalProtein, TotalCarbs, TotalFat) VALUES
(@Meal1Id, @CoachId, 'Power Breakfast', 'High protein breakfast to start the day', 'Breakfast', 378, 29.3, 33.6, 8.3),
(@Meal2Id, @CoachId, 'Lean Lunch', 'Balanced lunch with lean protein', 'Lunch', 310, 36.4, 30, 4.9),
(@Meal3Id, @CoachId, 'Recovery Dinner', 'Post-workout recovery meal', 'Dinner', 310, 36.4, 30, 4.9);

INSERT INTO MealFoods (MealId, FoodId, Quantity) VALUES
(@Meal1Id, @Food4Id, 2),      -- 2 eggs
(@Meal1Id, @Food5Id, 1),      -- 1 serving oatmeal
(@Meal1Id, @Food6Id, 1),      -- 1 serving greek yogurt
(@Meal2Id, @Food1Id, 1.5),    -- 150g chicken
(@Meal2Id, @Food2Id, 1),      -- 100g rice
(@Meal2Id, @Food3Id, 1),      -- 100g broccoli
(@Meal3Id, @Food1Id, 1.5),    -- 150g chicken
(@Meal3Id, @Food2Id, 1),      -- 100g rice
(@Meal3Id, @Food3Id, 1);      -- 100g broccoli

-- ============================================
-- DIET PLANS
-- ============================================

DECLARE @DietPlan1Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO DietPlans (Id, CoachId, Name, Description, PlanType, TargetCalories, TargetProtein, TargetCarbs, TargetFat, IsTemplate) VALUES
(@DietPlan1Id, @CoachId, 'Weight Loss Plan', 'Calorie deficit plan for steady weight loss', 'WeightLoss', 1800, 150, 150, 60, 1);

INSERT INTO DietPlanMeals (DietPlanId, MealId, DayOfWeek, OrderIndex) VALUES
(@DietPlan1Id, @Meal1Id, 0, 1),
(@DietPlan1Id, @Meal2Id, 0, 2),
(@DietPlan1Id, @Meal3Id, 0, 3),
(@DietPlan1Id, @Meal1Id, 1, 1),
(@DietPlan1Id, @Meal2Id, 1, 2),
(@DietPlan1Id, @Meal3Id, 1, 3);

-- Assign diet plan to client
INSERT INTO ClientDietPlans (ClientId, DietPlanId, StartDate, IsActive)
VALUES (@ClientId, @DietPlan1Id, CAST(GETDATE() AS DATE), 1);

-- ============================================
-- CHECK-INS (Sample historical data)
-- ============================================

-- Weight check-ins over the past 4 weeks
INSERT INTO WeightCheckIns (ClientId, Weight, BodyFatPercentage, Waist, CheckInDate) VALUES
(@ClientId, 70.0, 28, 76, DATEADD(WEEK, -4, GETDATE())),
(@ClientId, 69.5, 27.5, 75.5, DATEADD(WEEK, -3, GETDATE())),
(@ClientId, 69.0, 27, 75, DATEADD(WEEK, -2, GETDATE())),
(@ClientId, 68.3, 26.5, 74.5, DATEADD(WEEK, -1, GETDATE())),
(@ClientId, 67.8, 26, 74, GETDATE());

-- Workout check-ins
INSERT INTO WorkoutCheckIns (ClientId, WorkoutPlanId, Completed, DurationMinutes, Notes, CheckInDate) VALUES
(@ClientId, @WorkoutPlan1Id, 1, 45, 'Felt strong today!', DATEADD(DAY, -6, GETDATE())),
(@ClientId, @WorkoutPlan1Id, 1, 50, 'Increased weight on squats', DATEADD(DAY, -4, GETDATE())),
(@ClientId, @WorkoutPlan1Id, 1, 40, 'Quick session, good pump', DATEADD(DAY, -2, GETDATE())),
(@ClientId, @WorkoutPlan1Id, 1, 55, 'PR on bench press!', GETDATE());

-- Diet check-ins
INSERT INTO DietCheckIns (ClientId, DietPlanId, AdherenceRating, CaloriesConsumed, ProteinGrams, Notes, CheckInDate) VALUES
(@ClientId, @DietPlan1Id, 8, 1850, 145, 'Stayed on track mostly', DATEADD(DAY, -6, GETDATE())),
(@ClientId, @DietPlan1Id, 9, 1780, 155, 'Hit all macros!', DATEADD(DAY, -4, GETDATE())),
(@ClientId, @DietPlan1Id, 7, 2000, 130, 'Had a cheat meal', DATEADD(DAY, -2, GETDATE())),
(@ClientId, @DietPlan1Id, 9, 1800, 150, 'Perfect day', GETDATE());

PRINT 'Seed data inserted successfully!';
PRINT '';
PRINT '==============================================';
PRINT 'TEST CREDENTIALS';
PRINT '==============================================';
PRINT 'Coach Account:';
PRINT '  Email: coach@fitcoach.com';
PRINT '  Password: Password123!';
PRINT '';
PRINT 'Client Account:';
PRINT '  Email: client@fitcoach.com';
PRINT '  Password: Password123!';
PRINT '';
PRINT 'Second Client Account:';
PRINT '  Email: mike@fitcoach.com';
PRINT '  Password: Password123!';
PRINT '==============================================';
