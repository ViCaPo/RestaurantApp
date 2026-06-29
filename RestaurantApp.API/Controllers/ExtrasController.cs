using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

public record ExtraDto(string Nombre, decimal PrecioAdicional);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExtrasController : ControllerBase
{
    private readonly IAppDbContext _db;
    public ExtrasController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var extras = await _db.Extras.Where(e => e.Activo).OrderBy(e => e.Nombre).ToListAsync();
        return Ok(extras);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] ExtraDto dto)
    {
        var extra = new Extra { Nombre = dto.Nombre, PrecioAdicional = dto.PrecioAdicional };
        _db.Extras.Add(extra);
        await _db.SaveChangesAsync();
        return Ok(extra);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(int id, [FromBody] ExtraDto dto)
    {
        var extra = await _db.Extras.FindAsync(id);
        if (extra == null) return NotFound(new { error = "Extra no encontrado." });
        extra.Nombre = dto.Nombre;
        extra.PrecioAdicional = dto.PrecioAdicional;
        await _db.SaveChangesAsync();
        return Ok(extra);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var extra = await _db.Extras.FindAsync(id);
        if (extra == null) return NotFound(new { error = "Extra no encontrado." });
        extra.Activo = false;
        await _db.SaveChangesAsync();
        return Ok(new { mensaje = "Extra desactivado." });
    }
}
