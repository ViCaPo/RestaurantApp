using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

public record ProductoExtrasDto(List<int> ExtraIds);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly IAppDbContext _db;
    public ProductosController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? buscar, [FromQuery] int? categoriaId, [FromQuery] bool? disponible)
    {
        var query = _db.Productos.Where(p => p.Activo)
            .Include(p => p.Categoria)
            .Include(p => p.Estacion)
            .Include(p => p.ExtrasDisponibles)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(p => p.Nombre.Contains(buscar) || (p.Sku != null && p.Sku.Contains(buscar)));
        if (categoriaId.HasValue)
            query = query.Where(p => p.CategoriaId == categoriaId.Value);
        if (disponible.HasValue)
            query = query.Where(p => p.Disponible == disponible.Value);

        var productos = await query.OrderBy(p => p.Categoria!.Orden).ThenBy(p => p.Nombre).ToListAsync();
        return Ok(productos);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] Producto producto)
    {
        _db.Productos.Add(producto);
        await _db.SaveChangesAsync();
        return Ok(producto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(int id, [FromBody] Producto datos)
    {
        var p = await _db.Productos.FindAsync(id);
        if (p == null) return NotFound(new { error = "Producto no encontrado." });
        p.Nombre = datos.Nombre; p.Descripcion = datos.Descripcion; p.Sku = datos.Sku; p.Precio = datos.Precio;
        p.CategoriaId = datos.CategoriaId; p.EstacionId = datos.EstacionId; p.Disponible = datos.Disponible;
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpPut("{id}/extras")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> AsignarExtras(int id, [FromBody] ProductoExtrasDto dto)
    {
        var producto = await _db.Productos.Include(p => p.ExtrasDisponibles).FirstOrDefaultAsync(p => p.Id == id);
        if (producto == null) return NotFound(new { error = "Producto no encontrado." });
        var extras = await _db.Extras.Where(e => dto.ExtraIds.Contains(e.Id)).ToListAsync();
        producto.ExtrasDisponibles.Clear();
        foreach (var extra in extras) producto.ExtrasDisponibles.Add(extra);
        await _db.SaveChangesAsync();
        return Ok(producto.ExtrasDisponibles);
    }

    [HttpPut("{id}/disponibilidad")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CambiarDisponibilidad(int id, [FromQuery] bool disponible)
    {
        var p = await _db.Productos.FindAsync(id);
        if (p == null) return NotFound(new { error = "Producto no encontrado." });
        p.Disponible = disponible;
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var p = await _db.Productos.FindAsync(id);
        if (p == null) return NotFound(new { error = "Producto no encontrado." });
        p.Activo = false;
        await _db.SaveChangesAsync();
        return Ok(new { mensaje = "Producto desactivado." });
    }
}
