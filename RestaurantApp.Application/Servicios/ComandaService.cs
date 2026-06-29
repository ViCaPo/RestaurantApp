using Microsoft.EntityFrameworkCore;
using RestaurantApp.Application.Dtos;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Application.Servicios;

public class ComandaService
{
    private readonly IAppDbContext _db;
    private readonly IComandaNotificador _notificador;
    public ComandaService(IAppDbContext db, IComandaNotificador notificador)
    {
        _db = db;
        _notificador = notificador;
    }

    private static ItemCocinaDto AItemCocinaDto(ComandaItem item) => new(
        item.Id,
        item.ComandaId,
        item.Comanda!.MesaId,
        item.Comanda.MeseroId,
        item.Comanda.Mesa!.Nombre,
        item.Producto!.Nombre,
        item.Producto.EstacionId,
        item.Producto.Estacion?.Nombre,
        item.Cantidad,
        item.NumeroComensal,
        item.Notas,
        item.Extras.Select(e => e.Nombre).ToList(),
        item.Estado.ToString(),
        item.FechaCreacion
    );

    public async Task<Comanda> AbrirMesaAsync(int mesaId, int meseroId, int comensales)
    {
        var mesa = await _db.Mesas.FindAsync(mesaId) ?? throw new Exception("La mesa no existe.");
        if (mesa.Estado == EstadoMesa.Ocupada) throw new Exception("La mesa ya está ocupada.");
        var comanda = new Comanda { MesaId = mesaId, MeseroId = meseroId, NumeroComensales = comensales, Estado = EstadoComanda.Abierta };
        _db.Comandas.Add(comanda);
        await _db.SaveChangesAsync();
        mesa.Estado = EstadoMesa.Ocupada;
        mesa.ComandaActivaId = comanda.Id;
        await _db.SaveChangesAsync();
        return comanda;
    }

    public async Task<ComandaItem> AgregarItemAsync(int comandaId, int productoId, int cantidad, string? notas, List<int>? extraIds = null, int? numeroComensal = null)
    {
        var comanda = await _db.Comandas.Include(c => c.Mesa).FirstOrDefaultAsync(c => c.Id == comandaId)
            ?? throw new Exception("Comanda no encontrada.");
        if (comanda.Estado != EstadoComanda.Abierta) throw new Exception("No se puede modificar una comanda cerrada.");
        var producto = await _db.Productos.Include(p => p.ExtrasDisponibles).Include(p => p.Estacion).FirstOrDefaultAsync(p => p.Id == productoId)
            ?? throw new Exception("Producto no encontrado.");
        if (!producto.Disponible) throw new Exception($"{producto.Nombre} no está disponible.");
        if (numeroComensal.HasValue && (numeroComensal < 1 || numeroComensal > comanda.NumeroComensales))
            throw new Exception("El número de comensal no es válido para esta mesa.");

        var item = new ComandaItem { ComandaId = comandaId, ProductoId = productoId, PrecioUnitario = producto.Precio, Cantidad = cantidad, Notas = notas, Estado = EstadoItem.Pendiente, NumeroComensal = numeroComensal };

        if (extraIds != null && extraIds.Count > 0)
        {
            var idsValidos = producto.ExtrasDisponibles.Where(e => e.Activo).Select(e => e.Id).ToHashSet();
            foreach (var extraId in extraIds.Distinct())
            {
                if (!idsValidos.Contains(extraId)) throw new Exception("Uno de los extras no está disponible para este producto.");
                var extra = producto.ExtrasDisponibles.First(e => e.Id == extraId);
                item.Extras.Add(new ComandaItemExtra { ExtraId = extra.Id, Nombre = extra.Nombre, PrecioAdicional = extra.PrecioAdicional });
            }
        }

        _db.ComandaItems.Add(item);
        await _db.SaveChangesAsync();

        item.Comanda = comanda;
        item.Producto = producto;
        return item;
    }

    public async Task<List<ComandaItem>> EnviarPedidoACocinaAsync(int comandaId)
    {
        var items = await _db.ComandaItems
            .Include(i => i.Comanda).ThenInclude(c => c!.Mesa)
            .Include(i => i.Producto).ThenInclude(p => p!.Estacion)
            .Include(i => i.Extras)
            .Where(i => i.ComandaId == comandaId && !i.Cancelado && !i.EnviadoACocina)
            .ToListAsync();
        if (items.Count == 0) throw new Exception("No hay productos nuevos para enviar a cocina.");

        foreach (var item in items) item.EnviadoACocina = true;
        await _db.SaveChangesAsync();

        foreach (var item in items) await _notificador.NotificarItemNuevoAsync(AItemCocinaDto(item));
        return items;
    }

    public async Task CancelarItemAsync(int itemId, string motivo)
    {
        var item = await _db.ComandaItems.Include(i => i.Comanda).ThenInclude(c => c!.Mesa)
            .Include(i => i.Producto).ThenInclude(p => p!.Estacion)
            .Include(i => i.Extras)
            .FirstOrDefaultAsync(i => i.Id == itemId) ?? throw new Exception("Item no encontrado.");
        var estabaEnCocina = item.EnviadoACocina;
        item.Cancelado = true;
        item.MotivoCancelacion = motivo;
        await _db.SaveChangesAsync();
        if (estabaEnCocina) await _notificador.NotificarItemActualizadoAsync(AItemCocinaDto(item));
    }

    public async Task<ComandaItem> ActualizarEstadoItemAsync(int itemId, EstadoItem estado)
    {
        var item = await _db.ComandaItems.Include(i => i.Comanda).ThenInclude(c => c!.Mesa)
            .Include(i => i.Producto).ThenInclude(p => p!.Estacion)
            .Include(i => i.Extras)
            .FirstOrDefaultAsync(i => i.Id == itemId) ?? throw new Exception("Item no encontrado.");
        item.Estado = estado;
        await _db.SaveChangesAsync();
        await _notificador.NotificarItemActualizadoAsync(AItemCocinaDto(item));
        return item;
    }

    public async Task<List<ItemCocinaDto>> ObtenerItemsCocinaAsync(int? estacionId = null)
    {
        var query = _db.ComandaItems
            .Include(i => i.Comanda).ThenInclude(c => c!.Mesa)
            .Include(i => i.Producto).ThenInclude(p => p!.Estacion)
            .Include(i => i.Extras)
            .Where(i => i.EnviadoACocina && !i.Cancelado && i.Estado != EstadoItem.Entregado && i.Comanda!.Estado == EstadoComanda.Abierta);

        if (estacionId.HasValue) query = query.Where(i => i.Producto!.EstacionId == estacionId.Value);

        var items = await query.OrderBy(i => i.FechaCreacion).ToListAsync();
        return items.Select(AItemCocinaDto).ToList();
    }

    public async Task<Comanda?> ObtenerComandaAsync(int comandaId)
    {
        return await _db.Comandas
            .Include(c => c.Items).ThenInclude(i => i.Producto).ThenInclude(p => p!.Estacion)
            .Include(c => c.Items).ThenInclude(i => i.Extras)
            .Include(c => c.Mesa).Include(c => c.Mesero)
            .FirstOrDefaultAsync(c => c.Id == comandaId);
    }

    public async Task AplicarDescuentoAsync(int comandaId, decimal descuento)
    {
        var comanda = await _db.Comandas.FindAsync(comandaId) ?? throw new Exception("Comanda no encontrada.");
        if (descuento < 0) throw new Exception("El descuento no puede ser negativo.");
        comanda.Descuento = descuento;
        await _db.SaveChangesAsync();
    }

    public async Task<Pago> CobrarAsync(
        int comandaId,
        MetodoPago metodo,
        decimal propina,
        int cajeroId,
        decimal? montoRecibido = null,
        decimal? montoEfectivo = null,
        decimal? montoTarjeta = null)
    {
        var comanda = await ObtenerComandaAsync(comandaId) ?? throw new Exception("Comanda no encontrada.");
        if (comanda.Estado != EstadoComanda.Abierta) throw new Exception("La comanda ya fue cobrada o cancelada.");
        var total = comanda.Total;
        var aPagar = total + propina;
        var pago = new Pago { ComandaId = comandaId, Monto = total, Propina = propina, Metodo = metodo, CajeroId = cajeroId };

        if (metodo == MetodoPago.Efectivo && montoRecibido.HasValue)
        {
            if (montoRecibido.Value < aPagar) throw new Exception("El monto recibido es menor al total a pagar.");
            pago.MontoRecibido = montoRecibido.Value;
            pago.Cambio = montoRecibido.Value - aPagar;
            pago.MontoEfectivo = aPagar;
        }
        else if (metodo == MetodoPago.Mixto)
        {
            if (!montoEfectivo.HasValue || !montoTarjeta.HasValue)
                throw new Exception("Para pago mixto debes indicar el monto en efectivo y en tarjeta.");
            var recibido = montoEfectivo.Value + montoTarjeta.Value;
            if (recibido < aPagar) throw new Exception("La suma de efectivo y tarjeta es menor al total a pagar.");
            pago.MontoEfectivo = montoEfectivo.Value;
            pago.MontoTarjeta = montoTarjeta.Value;
            pago.MontoRecibido = recibido;
            pago.Cambio = recibido - aPagar;
        }
        else
        {
            pago.MontoTarjeta = aPagar;
        }

        _db.Pagos.Add(pago);
        comanda.Estado = EstadoComanda.Cobrada;
        comanda.FechaCierre = DateTime.Now;
        if (comanda.Mesa != null) { comanda.Mesa.Estado = EstadoMesa.Libre; comanda.Mesa.ComandaActivaId = null; }
        await _db.SaveChangesAsync();
        return pago;
    }

    public async Task<Comanda> CambiarMesaAsync(int comandaId, int nuevaMesaId)
    {
        var comanda = await _db.Comandas.Include(c => c.Mesa).FirstOrDefaultAsync(c => c.Id == comandaId)
            ?? throw new Exception("Comanda no encontrada.");
        if (comanda.Estado != EstadoComanda.Abierta) throw new Exception("La comanda no está abierta.");
        if (comanda.MesaId == nuevaMesaId) throw new Exception("La comanda ya está en esa mesa.");

        var nuevaMesa = await _db.Mesas.FindAsync(nuevaMesaId) ?? throw new Exception("La mesa destino no existe.");
        if (nuevaMesa.Estado != EstadoMesa.Libre) throw new Exception("La mesa destino no está libre.");

        var mesaAnterior = comanda.Mesa!;
        mesaAnterior.Estado = EstadoMesa.Libre;
        mesaAnterior.ComandaActivaId = null;

        comanda.MesaId = nuevaMesaId;
        nuevaMesa.Estado = EstadoMesa.Ocupada;
        nuevaMesa.ComandaActivaId = comanda.Id;

        await _db.SaveChangesAsync();
        return comanda;
    }

    public async Task<Comanda> UnirMesasAsync(int comandaDestinoId, int comandaOrigenId)
    {
        if (comandaDestinoId == comandaOrigenId) throw new Exception("No se puede unir una mesa consigo misma.");

        var destino = await _db.Comandas.Include(c => c.Mesa).Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == comandaDestinoId) ?? throw new Exception("Comanda destino no encontrada.");
        var origen = await _db.Comandas.Include(c => c.Mesa).Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == comandaOrigenId) ?? throw new Exception("Comanda origen no encontrada.");

        if (destino.Estado != EstadoComanda.Abierta || origen.Estado != EstadoComanda.Abierta)
            throw new Exception("Ambas comandas deben estar abiertas.");

        var desplazamiento = destino.NumeroComensales;
        foreach (var item in origen.Items)
        {
            item.ComandaId = destino.Id;
            if (item.NumeroComensal.HasValue) item.NumeroComensal += desplazamiento;
        }

        destino.NumeroComensales += origen.NumeroComensales;
        origen.Estado = EstadoComanda.Cancelada;
        origen.FechaCierre = DateTime.Now;
        if (origen.Mesa != null) { origen.Mesa.Estado = EstadoMesa.Libre; origen.Mesa.ComandaActivaId = null; }

        await _db.SaveChangesAsync();
        return destino;
    }
}
