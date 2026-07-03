using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

public record EstacionDto(string Nombre);
public record ConfigImpresionEstacionDto(bool ImprimirComandaAutomatico, int AnchoPapelComandaMm);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EstacionesController : ControllerBase
{
    private readonly IAppDbContext _db;
    public EstacionesController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var estaciones = await _db.Estaciones.Where(e => e.Activo).OrderBy(e => e.Nombre).ToListAsync();
        return Ok(estaciones);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] EstacionDto dto)
    {
        var estacion = new Estacion { Nombre = dto.Nombre };
        _db.Estaciones.Add(estacion);
        await _db.SaveChangesAsync();
        return Ok(estacion);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(int id, [FromBody] EstacionDto dto)
    {
        var estacion = await _db.Estaciones.FindAsync(id);
        if (estacion == null) return NotFound(new { error = "Estación no encontrada." });
        estacion.Nombre = dto.Nombre;
        await _db.SaveChangesAsync();
        return Ok(estacion);
    }

    [HttpPut("{id}/impresion")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ActualizarImpresion(int id, [FromBody] ConfigImpresionEstacionDto dto)
    {
        var estacion = await _db.Estaciones.FindAsync(id);
        if (estacion == null) return NotFound(new { error = "Estación no encontrada." });
        if (dto.AnchoPapelComandaMm != 58 && dto.AnchoPapelComandaMm != 80)
            return BadRequest(new { error = "El ancho de papel debe ser 58 o 80 mm." });
        estacion.ImprimirComandaAutomatico = dto.ImprimirComandaAutomatico;
        estacion.AnchoPapelComandaMm = dto.AnchoPapelComandaMm;
        await _db.SaveChangesAsync();
        return Ok(estacion);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var estacion = await _db.Estaciones.FindAsync(id);
        if (estacion == null) return NotFound(new { error = "Estación no encontrada." });
        estacion.Activo = false;
        await _db.SaveChangesAsync();
        return Ok(new { mensaje = "Estación desactivada." });
    }
}
