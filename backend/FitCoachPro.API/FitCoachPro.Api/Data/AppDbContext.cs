// Data/AppDbContext.cs

using FitCoachPro.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FitCoachPro.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<CoachClient> CoachClients => Set<CoachClient>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<CheckIn> CheckIns => Set<CheckIn>();
    public DbSet<WorkoutPlan> WorkoutPlans => Set<WorkoutPlan>();
    public DbSet<WorkoutDay> WorkoutDays => Set<WorkoutDay>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();
    public DbSet<ClientWorkoutPlan> ClientWorkoutPlans => Set<ClientWorkoutPlan>();
    public DbSet<Food> Foods => Set<Food>();
    public DbSet<Meal> Meals => Set<Meal>();
    public DbSet<MealFood> MealFoods => Set<MealFood>();
    public DbSet<DietPlan> DietPlans => Set<DietPlan>();
    public DbSet<DietDay> DietDays => Set<DietDay>();
    public DbSet<DietMeal> DietMeals => Set<DietMeal>();
    public DbSet<ClientDietPlan> ClientDietPlans => Set<ClientDietPlan>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // IMPORTANT: Explicit PK for UserProfile
        modelBuilder.Entity<UserProfile>()
            .HasKey(p => p.UserId);

        // One-to-one User <-> UserProfile
        modelBuilder.Entity<User>()
            .HasOne(u => u.Profile)
            .WithOne(p => p.User)
            .HasForeignKey<UserProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // CoachClient mapping relationships
        modelBuilder.Entity<CoachClient>()
            .HasOne(cc => cc.Coach)
            .WithMany()
            .HasForeignKey(cc => cc.CoachId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CoachClient>()
            .HasOne(cc => cc.Client)
            .WithMany()
            .HasForeignKey(cc => cc.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        // Prevent duplicate mapping for same coach-client pair
        modelBuilder.Entity<CoachClient>()
            .HasIndex(cc => new { cc.CoachId, cc.ClientId })
            .IsUnique();

        modelBuilder.Entity<CheckIn>()
            .Property(c => c.Type)
            .HasMaxLength(20);

        modelBuilder.Entity<CheckIn>()
            .Property(c => c.Status)
            .HasMaxLength(20);
        modelBuilder.Entity<CheckIn>().Property(c => c.Weight).HasPrecision(6, 2);
        modelBuilder.Entity<CheckIn>().Property(c => c.BodyFat).HasPrecision(5, 2);
        modelBuilder.Entity<CheckIn>().Property(c => c.Waist).HasPrecision(6, 2);
        modelBuilder.Entity<CheckIn>().Property(c => c.Chest).HasPrecision(6, 2);
        modelBuilder.Entity<CheckIn>().Property(c => c.Arms).HasPrecision(6, 2);
        modelBuilder.Entity<CheckIn>().Property(c => c.Thighs).HasPrecision(6, 2);

        modelBuilder.Entity<WorkoutPlan>()
            .HasMany(p => p.Days)
            .WithOne(d => d.WorkoutPlan)
            .HasForeignKey(d => d.WorkoutPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkoutDay>()
            .HasMany(d => d.Exercises)
            .WithOne(e => e.WorkoutDay)
            .HasForeignKey(e => e.WorkoutDayId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientWorkoutPlan>()
            .HasOne(c => c.WorkoutPlan)
            .WithMany(p => p.Assignments)
            .HasForeignKey(c => c.WorkoutPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientWorkoutPlan>()
            .HasIndex(c => new { c.ClientId, c.WorkoutPlanId })
            .IsUnique();

        modelBuilder.Entity<MealFood>()
            .HasOne(mf => mf.Meal)
            .WithMany(m => m.Foods)
            .HasForeignKey(mf => mf.MealId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MealFood>()
            .HasOne(mf => mf.Food)
            .WithMany(f => f.MealFoods)
            .HasForeignKey(mf => mf.FoodId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<MealFood>().Property(mf => mf.Quantity).HasPrecision(8, 2);

        modelBuilder.Entity<DietPlan>()
            .HasMany(p => p.Days)
            .WithOne(d => d.DietPlan)
            .HasForeignKey(d => d.DietPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DietDay>()
            .HasMany(d => d.Meals)
            .WithOne(m => m.DietDay)
            .HasForeignKey(m => m.DietDayId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DietMeal>()
            .HasOne(dm => dm.Meal)
            .WithMany(m => m.DietMeals)
            .HasForeignKey(dm => dm.MealId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ClientDietPlan>()
            .HasOne(c => c.DietPlan)
            .WithMany(p => p.Assignments)
            .HasForeignKey(c => c.DietPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClientDietPlan>()
            .HasIndex(c => new { c.ClientId, c.DietPlanId })
            .IsUnique();

        modelBuilder.Entity<Exercise>()
            .HasMany(e => e.WorkoutExercises)
            .WithOne(we => we.Exercise)
            .HasForeignKey(we => we.ExerciseId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Exercise>()
            .Property(e => e.IsPublished)
            .HasDefaultValue(false);
        modelBuilder.Entity<Food>()
            .Property(f => f.IsPublished)
            .HasDefaultValue(false);
        modelBuilder.Entity<Meal>()
            .Property(m => m.IsPublished)
            .HasDefaultValue(false);
        modelBuilder.Entity<WorkoutPlan>()
            .Property(p => p.IsPublished)
            .HasDefaultValue(false);
        modelBuilder.Entity<DietPlan>()
            .Property(p => p.IsPublished)
            .HasDefaultValue(false);

        modelBuilder.Entity<Exercise>().HasIndex(e => e.Name);
        modelBuilder.Entity<Exercise>().HasIndex(e => e.Tags);
        modelBuilder.Entity<Exercise>().HasIndex(e => e.PrimaryMuscleGroup);
        modelBuilder.Entity<Food>().HasIndex(f => f.Name);
        modelBuilder.Entity<Meal>().HasIndex(m => m.Name);
        modelBuilder.Entity<WorkoutPlan>().HasIndex(p => p.Name);
        modelBuilder.Entity<DietPlan>().HasIndex(p => p.Name);
        modelBuilder.Entity<Notification>()
            .Property(n => n.Type)
            .HasMaxLength(64);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AuditLog>()
            .Property(a => a.EntityType)
            .HasMaxLength(64);

        modelBuilder.Entity<AuditLog>()
            .Property(a => a.Action)
            .HasMaxLength(64);

        modelBuilder.Entity<AuditLog>()
            .Property(a => a.Details)
            .HasMaxLength(512);

        modelBuilder.Entity<UserProfile>().Property(p => p.HeightCm).HasPrecision(5, 2);
        modelBuilder.Entity<UserProfile>().Property(p => p.NeckCm).HasPrecision(5, 2);
        modelBuilder.Entity<UserProfile>().Property(p => p.ArmsCm).HasPrecision(5, 2);
        modelBuilder.Entity<UserProfile>().Property(p => p.QuadsCm).HasPrecision(5, 2);
        modelBuilder.Entity<UserProfile>().Property(p => p.HipsCm).HasPrecision(5, 2);
        modelBuilder.Entity<UserProfile>().Property(p => p.StartWeight).HasPrecision(6, 2);
        modelBuilder.Entity<UserProfile>().Property(p => p.CurrentWeight).HasPrecision(6, 2);
        modelBuilder.Entity<UserProfile>().Property(p => p.TargetWeight).HasPrecision(6, 2);
    }
}
