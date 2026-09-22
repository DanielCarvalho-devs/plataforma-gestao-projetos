using GestaoProjetos.Data;
using GestaoProjetos.Models;
using GestaoProjetos.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// CONTROLLERS
// =====================================================

builder.Services.AddControllers();

// =====================================================
// BANCO DE DADOS
// =====================================================

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    );
});

// =====================================================
// PASSWORD HASH
// =====================================================

builder.Services.AddScoped<
    IPasswordHasher<Utilizadore>,
    PasswordHasher<Utilizadore>
>();

// =====================================================
// SERVIÇOS DA APLICAÇÃO
// =====================================================

builder.Services.AddScoped<HistoricoService>();

// =====================================================
// CORS
// Permite que o frontend React/Vite aceda à API
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =====================================================
// JWT
// =====================================================

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "A chave JWT não foi configurada no appsettings.json."
    );
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException(
        "O Jwt:Issuer não foi configurado no appsettings.json."
    );
}

if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "O Jwt:Audience não foi configurado no appsettings.json."
    );
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;

        options.RequireHttpsMetadata = true;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                ClockSkew = TimeSpan.Zero
            };
    });

// =====================================================
// AUTORIZAÇÃO
// =====================================================

builder.Services.AddAuthorization();

// =====================================================
// OPENAPI
// =====================================================

builder.Services.AddOpenApi();

// =====================================================
// BUILD
// =====================================================

var app = builder.Build();

// =====================================================
// PIPELINE HTTP
// =====================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// =====================================================
// HTTPS
// =====================================================

app.UseHttpsRedirection();

// =====================================================
// CORS
// Deve ficar antes de Authentication e Authorization
// =====================================================

app.UseCors("Frontend");

// =====================================================
// AUTENTICAÇÃO
// =====================================================

app.UseAuthentication();

// =====================================================
// AUTORIZAÇÃO
// =====================================================

app.UseAuthorization();

// =====================================================
// CONTROLLERS
// =====================================================

app.MapControllers();

// =====================================================
// EXECUÇÃO
// =====================================================

app.Run();