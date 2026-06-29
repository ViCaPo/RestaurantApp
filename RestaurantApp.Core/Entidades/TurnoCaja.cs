namespace RestaurantApp.Core.Entidades;

public class TurnoCaja
{
    public int Id { get; set; }
    public int CajeroId { get; set; }
    public Usuario? Cajero { get; set; }
    public DateTime Apertura { get; set; } = DateTime.Now;
    public DateTime? Cierre { get; set; }
    public decimal FondoInicial { get; set; }
    public decimal? EfectivoContado { get; set; }
    public bool Abierto => Cierre == null;
}
