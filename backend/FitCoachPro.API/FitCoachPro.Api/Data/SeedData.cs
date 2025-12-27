using FitCoachPro.Api.Models;

namespace FitCoachPro.Api.Data;

public static class SeedData
{
    public static void EnsureSeeded(AppDbContext db)
    {
        if (db.Users.Any()) return;

        var adminId = Guid.NewGuid();
        var coachId = Guid.NewGuid();
        var c1Id = Guid.NewGuid();
        var c2Id = Guid.NewGuid();
        var soloId = Guid.NewGuid();

        var admin = new User
        {
            Id = adminId,
            Email = "admin@fitcoach.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = "admin",
            Profile = new UserProfile
            {
                UserId = adminId,
                DisplayName = "Admin"
            }
        };

        var coach = new User
        {
            Id = coachId,
            Email = "coach@fitcoach.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = "coach",
            Profile = new UserProfile
            {
                UserId = coachId,
                DisplayName = "Coach One",
                Bio = "Strength & fat-loss coach"
            }
        };

        var c1 = new User
        {
            Id = c1Id,
            Email = "client1@fitcoach.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = "client",
            Profile = new UserProfile
            {
                UserId = c1Id,
                DisplayName = "Client One",
                StartDate = DateTime.UtcNow.Date.AddDays(-28),
                HeightCm = 175,
                StartWeight = 90,
                CurrentWeight = 87,
                TargetWeight = 80
            }
        };

        var c2 = new User
        {
            Id = c2Id,
            Email = "client2@fitcoach.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = "client",
            Profile = new UserProfile
            {
                UserId = c2Id,
                DisplayName = "Client Two",
                StartDate = DateTime.UtcNow.Date.AddDays(-14),
                HeightCm = 168,
                StartWeight = 75,
                CurrentWeight = 74,
                TargetWeight = 68
            }
        };

        var solo = new User
        {
            Id = soloId,
            Email = "solo@fitcoach.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = "client",
            Profile = new UserProfile
            {
                UserId = soloId,
                DisplayName = "Solo Client",
                StartDate = DateTime.UtcNow.Date.AddDays(-7),
                HeightCm = 180,
                StartWeight = 95,
                CurrentWeight = 95,
                TargetWeight = 88
            }
        };

        db.Users.AddRange(admin, coach, c1, c2, solo);

        db.CoachClients.AddRange(
            new CoachClient { CoachId = coachId, ClientId = c1Id },
            new CoachClient { CoachId = coachId, ClientId = c2Id }
        );

        var now = DateTime.UtcNow;
        var strengthPlanId = Guid.NewGuid();
        var strengthPlan = new WorkoutPlan
        {
            Id = strengthPlanId,
            CoachId = coachId,
            Name = "Beginner Strength",
            Description = "A simple push/pull/legs rotation",
            DurationWeeks = 4,
            CreatedAt = now.AddDays(-21),
            UpdatedAt = now.AddDays(-14),
            Days =
            {
                new WorkoutDay
                {
                    Id = Guid.NewGuid(),
                    Name = "Push Day",
                    DayNumber = 1,
                    Exercises =
                    {
                        new WorkoutExercise
                        {
                            Id = Guid.NewGuid(),
                            ExerciseName = "Bench Press",
                            Sets = 3,
                            Reps = "8-10",
                            RestSeconds = 120,
                            Order = 1
                        },
                        new WorkoutExercise
                        {
                            Id = Guid.NewGuid(),
                            ExerciseName = "Overhead Press",
                            Sets = 3,
                            Reps = "8-10",
                            RestSeconds = 120,
                            Order = 2
                        }
                    }
                },
                new WorkoutDay
                {
                    Id = Guid.NewGuid(),
                    Name = "Pull Day",
                    DayNumber = 2,
                    Exercises =
                    {
                        new WorkoutExercise
                        {
                            Id = Guid.NewGuid(),
                            ExerciseName = "Deadlift",
                            Sets = 3,
                            Reps = "5",
                            RestSeconds = 180,
                            Order = 1
                        },
                        new WorkoutExercise
                        {
                            Id = Guid.NewGuid(),
                            ExerciseName = "Lat Pulldown",
                            Sets = 3,
                            Reps = "10-12",
                            RestSeconds = 90,
                            Order = 2
                        }
                    }
                },
                new WorkoutDay
                {
                    Id = Guid.NewGuid(),
                    Name = "Leg Day",
                    DayNumber = 3,
                    Exercises =
                    {
                        new WorkoutExercise
                        {
                            Id = Guid.NewGuid(),
                            ExerciseName = "Back Squat",
                            Sets = 4,
                            Reps = "6-8",
                            RestSeconds = 180,
                            Order = 1
                        },
                        new WorkoutExercise
                        {
                            Id = Guid.NewGuid(),
                            ExerciseName = "Leg Press",
                            Sets = 3,
                            Reps = "10-12",
                            RestSeconds = 120,
                            Order = 2
                        }
                    }
                }
            }
        };

        db.WorkoutPlans.Add(strengthPlan);

        db.ClientWorkoutPlans.Add(new ClientWorkoutPlan
        {
            Id = Guid.NewGuid(),
            ClientId = c1Id,
            WorkoutPlanId = strengthPlanId,
            StartDate = now.Date.AddDays(-7),
            IsActive = true
        });

        db.CheckIns.AddRange(
            new CheckIn
            {
                ClientId = c1Id,
                CoachId = coachId,
                Type = CheckInType.Weight,
                Status = CheckInStatus.Pending,
                SubmittedAt = now.AddDays(-1),
                Weight = 87.2m,
                BodyFat = 21.5m,
                Waist = 31,
                Notes = "Energy trending up"
            },
            new CheckIn
            {
                ClientId = c1Id,
                CoachId = coachId,
                Type = CheckInType.Workout,
                Status = CheckInStatus.Pending,
                SubmittedAt = now.AddDays(-2),
                WorkoutCompleted = true,
                WorkoutNotes = "Hit a new PR on deadlift"
            },
            new CheckIn
            {
                ClientId = c2Id,
                CoachId = coachId,
                Type = CheckInType.Diet,
                Status = CheckInStatus.Reviewed,
                SubmittedAt = now.AddDays(-3),
                DietCompliance = 8,
                DietDeviations = "Dessert after dinner on Sunday"
            },
            new CheckIn
            {
                ClientId = c2Id,
                CoachId = coachId,
                Type = CheckInType.Photos,
                Status = CheckInStatus.Pending,
                SubmittedAt = now.AddDays(-5),
                FrontPhotoUrl = "https://placehold.co/200x300?text=Front",
                SidePhotoUrl = "https://placehold.co/200x300?text=Side",
                BackPhotoUrl = "https://placehold.co/200x300?text=Back"
            }
        );

        db.Notifications.AddRange(
            new Notification
            {
                UserId = coachId,
                Title = "Welcome to notifications",
                Message = "We'll alert you when clients submit new check-ins or updates.",
                Type = "system",
                CreatedAt = now.AddHours(-2)
            },
            new Notification
            {
                UserId = c1Id,
                Title = "Weekly check-in reminder",
                Message = "Share an update with your coach to keep your plan on track.",
                Type = "reminder",
                CreatedAt = now.AddHours(-1)
            }
        );

        db.SaveChanges();
    }
}
