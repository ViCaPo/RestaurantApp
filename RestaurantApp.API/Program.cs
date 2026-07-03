using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using RestaurantApp.API.Hubs;
using RestaurantApp.API.Seguridad;
using RestaurantApp.Application.Servicios;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Licensing;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseWindowsService(options => { options.ServiceName = "RestaurantAPI"; });
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000);
    // TLS opcional: si se configura un certificado (Seguridad:Https:CertPath),
    // se habilita HTTPS en el puerto 5001 además del HTTP en 5000.
    var certPath = builder.Configuration["Seguridad:Https:CertPath"];
    var certPass = builder.Configuration["Seguridad:Https:CertPassword"];
    if (!string.IsNullOrEmpty(certPath) && File.Exists(certPath))
        options.ListenAnyIP(5001, lo => lo.UseHttps(certPath, certPass));
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<ComandaService>();
builder.Services.AddScoped<CajaService>();
builder.Services.AddScoped<IComandaNotificador, ComandaNotificadorSignalR>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddSignalR();

// Autenticación por token opaco (ver TokenAuthenticationHandler) + autorización por rol.
builder.Services.AddAuthentication(TokenAuthenticationHandler.Esquema)
    .AddScheme<AuthenticationSchemeOptions, TokenAuthenticationHandler>(TokenAuthenticationHandler.Esquema, _ => { });
builder.Services.AddAuthorization();

// Límite de intentos de login (anti fuerza bruta del PIN), por IP de origen.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconocido",
            _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(1), PermitLimit = 15, QueueLimit = 0 }));
});

// CORS restringido a orígenes conocidos (en producción el SPA es del mismo origen,
// así que esto solo afecta a herramientas/dev externos). Configurable en Cors:Origins.
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:5180" };
builder.Services.AddCors(options =>
    options.AddPolicy("LocalNetwork", p => p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));

var licencia = LicenseManager.CargarLicencia();
builder.Services.AddSingleton(licencia);
ModuleLoader.RegistrarModulosActivos(builder.Services, licencia);

var app = builder.Build();

var carpetaUploads = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(carpetaUploads);

app.UseCors("LocalNetwork");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(carpetaUploads),
    RequestPath = "/uploads",
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ComandasHub>("/hubs/comandas");
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Migración suave: hashea cualquier PIN que aún esté en texto plano.
    var pendientes = db.Usuarios.Where(u => u.Pin != "").ToList()
        .Where(u => !Seguridad.EsHash(u.Pin)).ToList();
    if (pendientes.Count > 0)
    {
        foreach (var u in pendientes) u.Pin = Seguridad.HashearPin(u.Pin);
        db.SaveChanges();
    }
}

app.Run();
