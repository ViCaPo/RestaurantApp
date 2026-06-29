using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entidades;

public class ComandaItem
{
    public int Id { get; set; }
    public int ComandaId { get; set; }
    public Comanda? Comanda { get; set; }
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }
    public decimal PrecioUnitario { get; set; }
    public int Cantidad { get; set; } = 1;
    public string? Notas { get; set; }
    public int? NumeroComensal { get; set; }
    public EstadoItem Estado { get; set; } = EstadoItem.Pendiente;
    public bool EnviadoACocina { get; set; }
    public bool Cancelado { get; set; }
    public string? MotivoCancelacion { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public List<ComandaItemExtra> Extras { get; set; } = new();
    public decimal PrecioUnitarioTotal => PrecioUnitario + Extras.Sum(e => e.PrecioAdicional);
}
