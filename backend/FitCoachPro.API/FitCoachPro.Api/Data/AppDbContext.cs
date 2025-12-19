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
    }
}
