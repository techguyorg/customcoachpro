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
    }
}
