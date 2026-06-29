using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Seguridad;

/// <summary>
/// Esquema de autenticación basado en tokens opacos guardados en BD.
/// Lee el token del header "Authorization: Bearer {token}" o, para SignalR
/// (WebSocket, que no permite headers), del query string "?access_token=".
/// </summary>
public class TokenAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string Esquema = "Token";

    public TokenAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var token = ExtraerToken();
        if (string.IsNullOrEmpty(token)) return AuthenticateResult.NoResult();

        var db = Context.RequestServices.GetRequiredService<IAppDbContext>();
        var sesion = await db.SesionTokens
            .Include(s => s.Usuario)
            .FirstOrDefaultAsync(s => s.Token == token);

        if (sesion?.Usuario == null || !sesion.Usuario.Activo)
            return AuthenticateResult.Fail("Token inválido o usuario inactivo.");

        var u = sesion.Usuario;
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
            new Claim(ClaimTypes.Name, u.Nombre),
            new Claim(ClaimTypes.Role, u.Rol.ToString()),
        };
        var identidad = new ClaimsIdentity(claims, Esquema);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identidad), Esquema);
        return AuthenticateResult.Success(ticket);
    }

    private string? ExtraerToken()
    {
        var header = Request.Headers.Authorization.ToString();
        if (header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return header["Bearer ".Length..].Trim();

        if (Request.Query.TryGetValue("access_token", out var fromQuery))
            return fromQuery.ToString();

        return null;
    }
}
