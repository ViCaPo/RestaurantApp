using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entidades;

public class Comanda
{
    public int Id { get; set; }
    public int MesaId { get; set; }
    public Mesa? Mesa { get; set; }
    public int MeseroId { get; set; }
    public Usuario? Mesero { get; set; }
    public int NumeroComensales { get; set; }
    public EstadoComanda Estado { get; set; } = EstadoComanda.Abierta;
    public DateTime FechaApertura { get; set; } = DateTime.Now;
    public DateTime? FechaCierre { get; set; }
    public List<ComandaItem> Items { get; set; } = new();
    public decimal Subtotal => Items.Where(i => !i.Cancelado)
        .Sum(i => i.PrecioUnitarioTotal * i.Cantidad);
    public decimal Descuento { get; set; }
    public decimal Total => Subtotal - Descuento;
    public string? Notas { get; set; }
}
