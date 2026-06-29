using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

public record CategoriaDto(string Nombre, int Orden);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriasController : ControllerBase
{
    private readonly IAppDbContext _db;
    public CategoriasController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var categorias = await _db.Categorias.Where(c => c.Activo).OrderBy(c => c.Orden).ToListAsync();
        return Ok(categorias);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] Categoria categoria)
    {
        _db.Categorias.Add(categoria);
        await _db.SaveChangesAsync();
        return Ok(categoria);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(int id, [FromBody] CategoriaDto dto)
    {
        var categoria = await _db.Categorias.FindAsync(id);
        if (categoria == null) return NotFound(new { error = "Categoría no encontrada." });
        categoria.Nombre = dto.Nombre;
        categoria.Orden = dto.Orden;
        await _db.SaveChangesAsync();
        return Ok(categoria);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var categoria = await _db.Categorias.FindAsync(id);
        if (categoria == null) return NotFound(new { error = "Categoría no encontrada." });
        var tieneProductosActivos = await _db.Productos.AnyAsync(p => p.CategoriaId == id && p.Activo);
        if (tieneProductosActivos) return BadRequest(new { error = "No puedes desactivar una categoría con productos activos. Desactiva los productos primero." });
        categoria.Activo = false;
        await _db.SaveChangesAsync();
        return Ok(new { mensaje = "Categoría desactivada." });
    }
}
