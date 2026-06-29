using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MesasController : ControllerBase
{
    private readonly IAppDbContext _db;
    public MesasController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var mesas = await _db.Mesas.Include(m => m.MeseroAsignado)
            .OrderBy(m => m.Zona).ThenBy(m => m.Nombre).ToListAsync();
        return Ok(mesas);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] Mesa mesa)
    {
        _db.Mesas.Add(mesa);
        await _db.SaveChangesAsync();
        return Ok(mesa);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(int id, [FromBody] Mesa datos)
    {
        var m = await _db.Mesas.FindAsync(id);
        if (m == null) return NotFound(new { error = "Mesa no encontrada." });
        m.Nombre = datos.Nombre; m.Capacidad = datos.Capacidad; m.Zona = datos.Zona;
        m.MeseroAsignadoId = datos.MeseroAsignadoId;
        await _db.SaveChangesAsync();
        return Ok(m);
    }
}
