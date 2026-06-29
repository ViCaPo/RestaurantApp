using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Application.Servicios;

public class CajaService
{
    private readonly IAppDbContext _db;
    public CajaService(IAppDbContext db) => _db = db;

    public async Task<TurnoCaja> AbrirTurnoAsync(int cajeroId, decimal fondoInicial)
    {
        var abierto = await _db.TurnosCaja.AnyAsync(t => t.CajeroId == cajeroId && t.Cierre == null);
        if (abierto) throw new Exception("Ya tienes un turno abierto.");
        var turno = new TurnoCaja { CajeroId = cajeroId, FondoInicial = fondoInicial };
        _db.TurnosCaja.Add(turno);
        await _db.SaveChangesAsync();
        return turno;
    }

    public async Task<object> CerrarTurnoAsync(int turnoId, decimal efectivoContado)
    {
        var turno = await _db.TurnosCaja.FindAsync(turnoId) ?? throw new Exception("Turno no encontrado.");
        if (turno.Cierre != null) throw new Exception("El turno ya fue cerrado.");
        turno.Cierre = DateTime.Now;
        turno.EfectivoContado = efectivoContado;
        var ventasEfectivo = await _db.Pagos
            .Where(p => p.Fecha >= turno.Apertura && p.Fecha <= turno.Cierre && p.Metodo == MetodoPago.Efectivo)
            .SumAsync(p => p.Monto);
        var esperado = turno.FondoInicial + ventasEfectivo;
        var diferencia = efectivoContado - esperado;
        await _db.SaveChangesAsync();
        return new
        {
            turno.Apertura, turno.Cierre, turno.FondoInicial,
            VentasEfectivo = ventasEfectivo, EsperadoEnCaja = esperado,
            EfectivoContado = efectivoContado, Diferencia = diferencia,
            Estado = diferencia == 0 ? "Cuadrado" : diferencia < 0 ? "Faltante" : "Sobrante"
        };
    }
}
