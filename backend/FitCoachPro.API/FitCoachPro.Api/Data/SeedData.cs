using FitCoachPro.Api.Models;

namespace FitCoachPro.Api.Data;

public static class SeedData
{
    public static void EnsureSeeded(AppDbContext db)
    {
        if (db.Users.Any()) return;

        db.Users.AddRange(
            new User
            {
                Email = "coach@fitcoach.com",
                FullName = "Demo Coach",
                Role = "Coach",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
            },
            new User
            {
                Email = "client@fitcoach.com",
                FullName = "Demo Client",
                Role = "Client",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
            },
            new User
            {
                Email = "mike@fitcoach.com",
                FullName = "Mike Demo",
                Role = "Client",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
            }
        );

        db.SaveChanges();
    }
}
