using System.Text;
using FitCoachPro.Api.Auth;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Endpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // requires Swashbuckle.AspNetCore

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<JwtTokenService>();

// Dummy DB for now
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("FitCoachPro"));

// CORS
var allowed = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
// CORS
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("cors", p =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Allow any localhost/127.0.0.1 port in dev (5173, 5174, etc.)
            p.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                return uri.Host is "localhost" or "127.0.0.1";
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
        }
        else
        {
            var allowed = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
            p.WithOrigins(allowed)
             .AllowAnyHeader()
             .AllowAnyMethod();
        }
    });
});

// JWT auth
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()!;
if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be set in appsettings.json (>= 32 chars).");

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("cors");
app.UseAuthentication();
app.UseAuthorization();

// Seed dummy users
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    SeedData.EnsureSeeded(db);
}

app.MapGet("/api/health", () => Results.Ok(new { ok = true, time = DateTime.UtcNow }));
app.MapAuthEndpoints();

app.MapControllers();

app.Run();
