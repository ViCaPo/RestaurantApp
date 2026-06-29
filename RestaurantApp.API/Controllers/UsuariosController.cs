using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.API.Seguridad;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

public record LoginDto(string Pin);
public record GuardarUsuarioDto(string Nombre, string Pin, Rol Rol);
public record UsuarioDto(int Id, string Nombre, Rol Rol, bool Activo);
public record LoginRespuestaDto(string Token, UsuarioDto Usuario);

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly IAppDbContext _db;
    public UsuariosController(IAppDbContext db) => _db = db;

    private static UsuarioDto ADto(Usuario u) => new(u.Id, u.Nombre, u.Rol, u.Activo);

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Pin)) return BadRequest(new { error = "PIN requerido." });

        var usuarios = await _db.Usuarios.Where(u => u.Activo).ToListAsync();
        var usuario = usuarios.FirstOrDefault(u => Seguridad.Seguridad.VerificarPin(dto.Pin, u.Pin));
        if (usuario == null) return BadRequest(new { error = "PIN incorrecto." });

        // Migración suave: si el PIN estaba en texto plano, lo hasheamos ahora.
        if (!Seguridad.Seguridad.EsHash(usuario.Pin))
            usuario.Pin = Seguridad.Seguridad.HashearPin(dto.Pin);

        var sesion = new SesionToken { Token = Seguridad.Seguridad.GenerarToken(), UsuarioId = usuario.Id };
        _db.SesionTokens.Add(sesion);
        await _db.SaveChangesAsync();

        return Ok(new LoginRespuestaDto(sesion.Token, ADto(usuario)));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        var header = Request.Headers.Authorization.ToString();
        var token = header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? header["Bearer ".Length..].Trim()
            : null;
        if (!string.IsNullOrEmpty(token))
        {
            var sesion = await _db.SesionTokens.FirstOrDefaultAsync(s => s.Token == token);
            if (sesion != null)
            {
                _db.SesionTokens.Remove(sesion);
                await _db.SaveChangesAsync();
            }
        }
        return Ok(new { mensaje = "Sesión cerrada." });
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarios = await _db.Usuarios.Where(u => u.Activo).OrderBy(u => u.Nombre).ToListAsync();
        return Ok(usuarios.Select(ADto));
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] GuardarUsuarioDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Pin)) return BadRequest(new { error = "PIN requerido." });

        var activos = await _db.Usuarios.Where(u => u.Activo).ToListAsync();
        if (activos.Any(u => Seguridad.Seguridad.VerificarPin(dto.Pin, u.Pin)))
            return BadRequest(new { error = "Ese PIN ya está en uso." });

        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Rol = dto.Rol,
            Activo = true,
            Pin = Seguridad.Seguridad.HashearPin(dto.Pin),
        };
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return Ok(ADto(usuario));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(int id, [FromBody] GuardarUsuarioDto dto)
    {
        var u = await _db.Usuarios.FindAsync(id);
        if (u == null) return NotFound(new { error = "Usuario no encontrado." });

        if (!string.IsNullOrWhiteSpace(dto.Pin))
        {
            var otros = await _db.Usuarios.Where(x => x.Activo && x.Id != id).ToListAsync();
            if (otros.Any(x => Seguridad.Seguridad.VerificarPin(dto.Pin, x.Pin)))
                return BadRequest(new { error = "Ese PIN ya está en uso." });
            u.Pin = Seguridad.Seguridad.HashearPin(dto.Pin);
        }

        u.Nombre = dto.Nombre;
        u.Rol = dto.Rol;
        await _db.SaveChangesAsync();
        return Ok(ADto(u));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var u = await _db.Usuarios.FindAsync(id);
        if (u == null) return NotFound(new { error = "Usuario no encontrado." });
        u.Activo = false;
        // Revocar todas sus sesiones activas.
        var sesiones = await _db.SesionTokens.Where(s => s.UsuarioId == id).ToListAsync();
        _db.SesionTokens.RemoveRange(sesiones);
        await _db.SaveChangesAsync();
        return Ok(new { mensaje = "Usuario desactivado." });
    }
}
