using Microsoft.EntityFrameworkCore;
using RestaurantApp.Application.Dtos;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Application.Servicios;

public class CajaService
{
    private readonly IAppDbContext _db;
    public CajaService(IAppDbContext db) => _db = db;

    public Task<TurnoCaja?> ObtenerTurnoAbiertoAsync(int cajeroId) =>
        _db.TurnosCaja.Include(t => t.Cajero)
            .FirstOrDefaultAsync(t => t.CajeroId == cajeroId && t.Cierre == null);

    public async Task<TurnoCaja> AbrirTurnoAsync(int cajeroId, decimal fondoInicial)
    {
        var abierto = await _db.TurnosCaja.AnyAsync(t => t.CajeroId == cajeroId && t.Cierre == null);
        if (abierto) throw new Exception("Ya tienes un turno de caja abierto.");
        if (fondoInicial < 0) throw new Exception("El fondo inicial no puede ser negativo.");
        var turno = new TurnoCaja { CajeroId = cajeroId, FondoInicial = fondoInicial };
        _db.TurnosCaja.Add(turno);
        await _db.SaveChangesAsync();
        return turno;
    }

    /// <summary>Resumen del turno (totales por método, efectivo esperado, diferencia si ya se contó).</summary>
    public async Task<ResumenTurnoDto> ResumenTurnoAsync(int turnoId, decimal? efectivoContado = null)
    {
        var turno = await _db.TurnosCaja.Include(t => t.Cajero).FirstOrDefaultAsync(t => t.Id == turnoId)
            ?? throw new Exception("Turno no encontrado.");
        var pagos = await _db.Pagos.Where(p => p.TurnoCajaId == turnoId).ToListAsync();

        var totalVentas = pagos.Sum(p => p.Monto);
        var totalPropinas = pagos.Sum(p => p.Propina);
        var ventasEfectivo = pagos.Sum(p => p.MontoEfectivo ?? 0);
        var porMetodo = pagos
            .GroupBy(p => p.Metodo)
            .Select(g => new MetodoResumen(g.Key.ToString(), g.Count(), g.Sum(p => p.Monto + p.Propina)))
            .OrderBy(m => m.Metodo)
            .ToList();

        var efectivoEsperado = turno.FondoInicial + ventasEfectivo;
        var contado = efectivoContado ?? turno.EfectivoContado;
        decimal? diferencia = contado.HasValue ? contado.Value - efectivoEsperado : null;
        string? estado = diferencia.HasValue
            ? (diferencia.Value == 0 ? "Cuadrado" : diferencia.Value < 0 ? "Faltante" : "Sobrante")
            : null;

        return new ResumenTurnoDto(
            turno.Id, turno.CajeroId, turno.Cajero?.Nombre, turno.Apertura, turno.Cierre,
            turno.FondoInicial, pagos.Count, totalVentas, totalPropinas, porMetodo,
            ventasEfectivo, efectivoEsperado, contado, diferencia, estado);
    }

    public async Task<ResumenTurnoDto> CerrarTurnoAsync(int turnoId, decimal efectivoContado)
    {
        var turno = await _db.TurnosCaja.FindAsync(turnoId) ?? throw new Exception("Turno no encontrado.");
        if (turno.Cierre != null) throw new Exception("El turno ya fue cerrado.");
        turno.Cierre = DateTime.Now;
        turno.EfectivoContado = efectivoContado;
        await _db.SaveChangesAsync();
        return await ResumenTurnoAsync(turnoId, efectivoContado);
    }
}
