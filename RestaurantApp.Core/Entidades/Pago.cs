using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entidades;

public class Pago
{
    public int Id { get; set; }
    public int ComandaId { get; set; }
    public Comanda? Comanda { get; set; }
    public decimal Monto { get; set; }
    public decimal Propina { get; set; }
    public MetodoPago Metodo { get; set; }
    public decimal? MontoRecibido { get; set; }
    public decimal? Cambio { get; set; }
    public decimal? MontoEfectivo { get; set; }
    public decimal? MontoTarjeta { get; set; }
    public int CajeroId { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
}
