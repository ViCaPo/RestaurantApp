using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

public record PagoDto(
    int Id, DateTime Fecha, int ComandaId, string? Mesa, string Metodo,
    decimal Monto, decimal Propina, decimal Total,
    decimal? MontoEfectivo, decimal? MontoTarjeta,
    string? Referencia, string? Autorizacion, string? UltimosDigitos,
    string? Cajero, int? TurnoCajaId);

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class PagosController : ControllerBase
{
    private readonly IAppDbContext _db;
    public PagosController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int? dias)
    {
        var query = _db.Pagos.Include(p => p.Comanda).ThenInclude(c => c!.Mesa).AsQueryable();
        if (dias.HasValue)
        {
            var desde = DateTime.Now.AddDays(-dias.Value);
            query = query.Where(p => p.Fecha >= desde);
        }

        var pagos = await query.OrderByDescending(p => p.Fecha).Take(500).ToListAsync();
        var cajeroIds = pagos.Select(p => p.CajeroId).Distinct().ToList();
        var cajeros = await _db.Usuarios
            .Where(u => cajeroIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Nombre);

        var dtos = pagos.Select(p => new PagoDto(
            p.Id, p.Fecha, p.ComandaId, p.Comanda?.Mesa?.Nombre, p.Metodo.ToString(),
            p.Monto, p.Propina, p.Monto + p.Propina, p.MontoEfectivo, p.MontoTarjeta,
            p.ReferenciaTransaccion, p.AutorizacionTarjeta, p.UltimosDigitosTarjeta,
            cajeros.TryGetValue(p.CajeroId, out var nombre) ? nombre : null, p.TurnoCajaId));

        return Ok(dtos);
    }
}
