using System.Text;
using System.Threading.Channels;
using FitCoachPro.Api.Auth;
using FitCoachPro.Api.Data;
using FitCoachPro.Api.Endpoints;
using FitCoachPro.Api.Notifications;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "FitCoachPro API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.Configure<AzureEmailOptions>(builder.Configuration.GetSection("AzureEmail"));
builder.Services.AddSingleton(Channel.CreateUnbounded<NotificationEvent>());
builder.Services.AddSingleton<INotificationQueue, NotificationQueue>();
builder.Services.AddSingleton<IEmailNotificationSender, AzureEmailNotificationSender>();
builder.Services.AddHostedService<NotificationWorker>();

// ✅ DB selection: SQL if available, else InMemory
var sqlConn = builder.Configuration.GetConnectionString("SqlConnection")
             ?? builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrWhiteSpace(sqlConn))
{
    builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(sqlConn));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("fitcoachpro"));
}

// CORS
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("cors", p =>
    {
        if (builder.Environment.IsDevelopment())
        {
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
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key") ?? "CHANGE_ME_DEV_KEY_32_CHARS_MINIMUM";

if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be set in appsettings.json (>= 32 chars).");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
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

// ✅ Apply migrations automatically when using SQL Server
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // If SQL Server is used, apply migrations
    if (!string.IsNullOrWhiteSpace(sqlConn))
    {
        db.Database.Migrate();
    }

    SeedData.EnsureSeeded(db);
}

app.MapGet("/api/health", () => Results.Ok(new { ok = true, time = DateTime.UtcNow }));

app.MapAuthEndpoints();
app.MapCoachEndpoints();
app.MapClientEndpoints();
app.MapDashboardEndpoints();
app.MapProfileEndpoints();
app.MapCheckInEndpoints();
app.MapAnalyticsEndpoints();
app.MapExerciseEndpoints();
app.MapWorkoutPlanEndpoints();
app.MapDietPlanEndpoints();
app.MapNotificationEndpoints();

app.MapControllers();

app.Run();
